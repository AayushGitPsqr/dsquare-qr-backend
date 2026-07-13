import { extractTextFromCard } from "./ocrService.js";
import { parseBusinessCardText } from "../utils/parseCardText.js";
import { normalizeBusinessCardPayload } from "../utils/normalizeCardPayload.js";
import { parseBusinessCardWithLLM } from "./llmParseService.js";
import { extractBusinessCardWithOpenAI } from "./openAiCardExtractor.js";
import { logInfo, logWarn } from "../utils/logger.js";
import { env } from "../config/env.js";
import { createBusinessCard, deleteBusinessCardById, getBusinessCardById, listBusinessCards } from "../repositories/businessCardRepository.js";
function valueOrEmpty(value) {
    return typeof value === "string" ? value.trim() : "";
}
export async function scanBusinessCard(imagePath) {
    if (env.ocrProvider === "openai" || env.llmApiKey) {
        try {
            const openAiParsed = await extractBusinessCardWithOpenAI(imagePath);
            if (openAiParsed) {
                const normalized = normalizeBusinessCardPayload(openAiParsed);
                if (!valueOrEmpty(normalized.name)) {
                    const error = new Error("OpenAI could not confidently identify the card owner name.");
                    error.name = "OcrError";
                    throw error;
                }
                return {
                    provider: "openai",
                    rawText: normalized.rawText ?? "",
                    parsed: {
                        name: normalized.name,
                        designation: normalized.designation,
                        company: normalized.company,
                        email: normalized.email,
                        phone: normalized.phone,
                        website: normalized.website,
                        address: normalized.address
                    }
                };
            }
        }
        catch (error) {
            logWarn("OpenAI direct card extraction failed, falling back to OCR pipeline", {
                error
            });
        }
    }
    const ocr = await extractTextFromCard(imagePath);
    if (!ocr.text.trim()) {
        const error = new Error("OCR did not detect readable text in the image.");
        error.name = "OcrError";
        throw error;
    }
    let llmParsed = null;
    try {
        llmParsed = await parseBusinessCardWithLLM(ocr.text);
        if (llmParsed) {
            logInfo("OpenAI structured parser applied", { provider: ocr.provider });
        }
    }
    catch (error) {
        logWarn("OpenAI structured parser failed, falling back to rule parser", {
            error
        });
    }
    const parsed = {
        ...parseBusinessCardText(ocr.text),
        ...(llmParsed ?? {})
    };
    return {
        provider: ocr.provider,
        rawText: ocr.text,
        parsed
    };
}
export function validateBusinessCardPayload(payload) {
    const errors = [];
    if (!valueOrEmpty(payload.name)) {
        errors.push("Name is required.");
    }
    if (valueOrEmpty(payload.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueOrEmpty(payload.email))) {
        errors.push("Email format is invalid.");
    }
    if (valueOrEmpty(payload.phone) && !/^\+?[0-9().\-\s]{7,}$/.test(valueOrEmpty(payload.phone))) {
        errors.push("Phone format is invalid.");
    }
    return errors;
}
export async function saveBusinessCard(payload) {
    const normalized = normalizeBusinessCardPayload(payload);
    const parsedValidation = validateBusinessCardPayload(normalized);
    if (parsedValidation.length > 0) {
        const error = new Error(parsedValidation.join(" "));
        error.name = "ValidationError";
        throw error;
    }
    return createBusinessCard(normalized);
}
export { listBusinessCards, getBusinessCardById, deleteBusinessCardById };
