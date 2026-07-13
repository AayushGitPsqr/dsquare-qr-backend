import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
dotenv.config({ path: path.resolve(projectRoot, ".env") });
function required(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export const env = {
    port: Number(process.env.PORT ?? 4000),
    mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/dsquare"),
    frontendOrigins: (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://172.28.80.1:3000,http://localhost:8081")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ocrProvider: process.env.OCR_PROVIDER ?? (process.env.LLM_API_KEY ? "openai" : "tesseract"),
    llmApiKey: process.env.LLM_API_KEY ?? "",
    llmApiUrl: process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions",
    llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
    mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY ?? "",
    azureVisionEndpoint: process.env.AZURE_VISION_ENDPOINT ?? "",
    azureVisionKey: process.env.AZURE_VISION_KEY ?? "",
    // Cloudinary Configuration
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? "business-cards",
    // Image Enhancement Settings
    imageEnhancementEnabled: process.env.IMAGE_ENHANCEMENT_ENABLED === "true",
    imageEnhancementQuality: Number(process.env.IMAGE_ENHANCEMENT_QUALITY ?? 90),
    imageEnhancementBrightness: Number(process.env.IMAGE_ENHANCEMENT_BRIGHTNESS ?? 10),
    imageEnhancementContrast: Number(process.env.IMAGE_ENHANCEMENT_CONTRAST ?? 20),
    imageEnhancementSharpen: process.env.IMAGE_ENHANCEMENT_SHARPEN !== "false"
};
