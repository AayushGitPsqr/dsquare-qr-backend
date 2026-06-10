import { createWorker } from "tesseract.js";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { env } from "../config/env.js";
import { logInfo, logWarn } from "../utils/logger.js";

type OcrResult = {
  text: string;
  provider: string;
};

/**
 * Download image from URL to a temporary file
 */
async function downloadImageToTemp(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const tempDir = os.tmpdir();
    const tempFileName = `card-${Date.now()}.jpg`;
    const tempPath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempPath, Buffer.from(response.data));
    logInfo(`Downloaded image from URL to temporary file: ${tempPath}`);
    
    return tempPath;
  } catch (error) {
    throw new Error(
      `Failed to download image from URL: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get the actual file path - download from URL if needed
 */
async function getImagePath(imagePath: string): Promise<string> {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return await downloadImageToTemp(imagePath);
  }
  return imagePath;
}

async function runTesseract(imagePath: string): Promise<OcrResult> {
  const actualPath = await getImagePath(imagePath);
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(actualPath);
    return {
      text: result.data.text ?? "",
      provider: "tesseract"
    };
  } finally {
    await worker.terminate();
    // Clean up temp file if it was downloaded
    if (imagePath.startsWith("http")) {
      try {
        await fs.unlink(actualPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

function guessMimeType(imagePath: string) {
  const extension = path.extname(imagePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function runMistral(imagePath: string): Promise<OcrResult> {
  if (!env.mistralApiKey) {
    throw new Error("MISTRAL_API_KEY is required when OCR_PROVIDER=mistral.");
  }

  const actualPath = await getImagePath(imagePath);
  const fileBuffer = await fs.readFile(actualPath);
  const imageBase64 = fileBuffer.toString("base64");
  const dataUrl = `data:${guessMimeType(actualPath)};base64,${imageBase64}`;

  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mistralApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        image_url: dataUrl
      },
      include_image_base64: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mistral OCR failed with ${response.status}: ${errorText}`
    );
  }

  const payload = (await response.json()) as {
    pages?: Array<{ markdown?: string }>;
    model?: string;
  };

  const text =
    payload.pages
      ?.map((page) => page.markdown ?? "")
      .filter(Boolean)
      .join("\n\n") ?? "";

  // Clean up temp file if it was downloaded
  if (imagePath.startsWith("http")) {
    try {
      await fs.unlink(actualPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  return {
    text,
    provider: "mistral"
  };
}

async function runGoogleVision(imagePath: string): Promise<OcrResult> {
  const actualPath = await getImagePath(imagePath);
  const image = await import("node:fs/promises").then((fs) =>
    fs.readFile(actualPath, { encoding: "base64" })
  );

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${env.googleVisionApiKey}`,
    {
      requests: [
        {
          image: { content: image },
          features: [{ type: "TEXT_DETECTION" }]
        }
      ]
    }
  );

  // Clean up temp file if it was downloaded
  if (imagePath.startsWith("http")) {
    try {
      await fs.unlink(actualPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  const text =
    response.data?.responses?.[0]?.fullTextAnnotation?.text ??
    response.data?.responses?.[0]?.textAnnotations?.[0]?.description ??
    "";

  return { text, provider: "google-vision" };
}

async function runAzureVision(imagePath: string): Promise<OcrResult> {
  const actualPath = await getImagePath(imagePath);
  const image = await import("node:fs/promises").then((fs) =>
    fs.readFile(actualPath)
  );

  const response = await axios.post(
    `${env.azureVisionEndpoint}/vision/v3.2/read/analyze`,
    image,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": env.azureVisionKey,
        "Content-Type": "application/octet-stream"
      }
    }
  );

  const operationLocation = response.headers["operation-location"];
  if (!operationLocation) {
    throw new Error("Azure OCR did not return an operation location.");
  }

  let status = "running";
  let resultText = "";

  for (let attempt = 0; attempt < 20 && status === "running"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await axios.get(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": env.azureVisionKey }
    });
    status = poll.data?.status?.toLowerCase() ?? "failed";
    if (status === "succeeded") {
      resultText =
        poll.data?.analyzeResult?.readResults
          ?.map((page: { lines?: Array<{ text?: string }> }) =>
            page.lines?.map((line) => line.text ?? "").join("\n")
          )
          .filter(Boolean)
          .join("\n") ?? "";
    }
  }

  // Clean up temp file if it was downloaded
  if (imagePath.startsWith("http")) {
    try {
      await fs.unlink(actualPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  return { text: resultText, provider: "azure-vision" };
}

export async function extractTextFromCard(imagePath: string) {
  try {
    if (env.ocrProvider === "mistral") {
      logInfo("Using Mistral OCR");
      return await runMistral(imagePath);
    }

    if (env.ocrProvider === "google" && env.googleVisionApiKey) {
      logInfo("Using Google Vision OCR");
      return await runGoogleVision(imagePath);
    }

    if (env.ocrProvider === "azure" && env.azureVisionEndpoint && env.azureVisionKey) {
      logInfo("Using Azure Vision OCR");
      return await runAzureVision(imagePath);
    }

    logInfo("Using Tesseract OCR fallback");
    return await runTesseract(imagePath);
  } catch (error) {
    logWarn("Preferred OCR provider failed, falling back to Tesseract", {
      error
    });
    return runTesseract(imagePath);
  }
}
