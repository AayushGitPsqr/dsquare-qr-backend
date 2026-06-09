import { createWorker } from "tesseract.js";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { logInfo, logWarn } from "../utils/logger.js";

type OcrResult = {
  text: string;
  provider: string;
};

async function runTesseract(imagePath: string): Promise<OcrResult> {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(imagePath);
    return {
      text: result.data.text ?? "",
      provider: "tesseract"
    };
  } finally {
    await worker.terminate();
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

  const fileBuffer = await fs.readFile(imagePath);
  const imageBase64 = fileBuffer.toString("base64");
  const dataUrl = `data:${guessMimeType(imagePath)};base64,${imageBase64}`;

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

  return {
    text,
    provider: "mistral"
  };
}

async function runGoogleVision(imagePath: string): Promise<OcrResult> {
  const image = await import("node:fs/promises").then((fs) =>
    fs.readFile(imagePath, { encoding: "base64" })
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

  const text =
    response.data?.responses?.[0]?.fullTextAnnotation?.text ??
    response.data?.responses?.[0]?.textAnnotations?.[0]?.description ??
    "";

  return { text, provider: "google-vision" };
}

async function runAzureVision(imagePath: string): Promise<OcrResult> {
  const image = await import("node:fs/promises").then((fs) =>
    fs.readFile(imagePath)
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
