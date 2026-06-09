import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import type { BusinessCardDocument } from "../models/BusinessCard.js";

type ExtractedCard = Partial<
  Pick<
    BusinessCardDocument,
    "name" | "designation" | "company" | "email" | "phone" | "website" | "address"
  >
> & {
  rawText?: string | null;
};

function guessMimeType(imagePath: string) {
  const extension = path.extname(imagePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
}

function normalizeCard(payload: unknown): ExtractedCard {
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;

  return {
    name: normalizeNullableString(record.name),
    designation: normalizeNullableString(record.designation),
    company: normalizeNullableString(record.company),
    email: normalizeNullableString(record.email),
    phone: normalizeNullableString(record.phone),
    website: normalizeNullableString(record.website),
    address: normalizeNullableString(record.address),
    rawText: normalizeNullableString(record.rawText)
  };
}

export async function extractBusinessCardWithOpenAI(
  imagePath: string
): Promise<ExtractedCard | null> {
  if (!env.llmApiKey) {
    return null;
  }

  const imageBuffer = await fs.readFile(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const imageUrl = `data:${guessMimeType(imagePath)};base64,${imageBase64}`;

  const response = await fetch(env.llmApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.llmApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.llmModel,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "business_card_extraction",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { anyOf: [{ type: "string" }, { type: "null" }] },
              designation: { anyOf: [{ type: "string" }, { type: "null" }] },
              company: { anyOf: [{ type: "string" }, { type: "null" }] },
              email: { anyOf: [{ type: "string" }, { type: "null" }] },
              phone: { anyOf: [{ type: "string" }, { type: "null" }] },
              website: { anyOf: [{ type: "string" }, { type: "null" }] },
              address: { anyOf: [{ type: "string" }, { type: "null" }] },
              rawText: { anyOf: [{ type: "string" }, { type: "null" }] }
            },
            required: [
              "name",
              "designation",
              "company",
              "email",
              "phone",
              "website",
              "address",
              "rawText"
            ]
          }
        }
      },
      messages: [
        {
          role: "system",
          content:
            "Read the business card image directly and extract the fields. Be conservative. Use null for any field you cannot confidently identify. Infer unlabeled name, company, designation, address, email, phone, and website only when strongly supported by the visual layout or text. Do not invent values."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract business-card data from this image and return only the JSON object matching the schema."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI card extraction failed with ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        refusal?: string | null;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  try {
    return normalizeCard(JSON.parse(content));
  } catch {
    throw new Error("OpenAI returned invalid JSON for card extraction.");
  }
}
