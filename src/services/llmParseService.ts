import { env } from "../config/env.js";
import type { BusinessCardDocument } from "../models/BusinessCard.js";

type ParsedFields = Partial<
  Pick<
    BusinessCardDocument,
    "name" | "designation" | "company" | "email" | "phone" | "website" | "address"
  >
>;

function cleanNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
}

export function normalizeLlMParsedFields(payload: unknown): ParsedFields {
  if (!payload || typeof payload !== "object") return {};

  const record = payload as Record<string, unknown>;
  return {
    name: cleanNullableString(record.name),
    designation: cleanNullableString(record.designation),
    company: cleanNullableString(record.company),
    email: cleanNullableString(record.email),
    phone: cleanNullableString(record.phone),
    website: cleanNullableString(record.website),
    address: cleanNullableString(record.address)
  };
}

export async function parseBusinessCardWithLLM(rawText: string): Promise<ParsedFields | null> {
  if (!env.llmApiKey) {
    return null;
  }

  const response = await fetch(env.llmApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.llmApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.llmModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract business card contact fields from OCR text. Return only JSON with keys: name, designation, company, email, phone, website, address. Use null for unknown values. Do not invent data. If a value is present without a label, infer the most likely field. Do not include any other keys."
        },
        {
          role: "user",
          content: `OCR text:\n${rawText}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM parse failed with ${response.status}: ${errorText}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    return normalizeLlMParsedFields(parsed);
  } catch {
    throw new Error("LLM parser returned invalid JSON.");
  }
}
