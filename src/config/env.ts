import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../"
);

dotenv.config({ path: path.resolve(projectRoot, ".env") });

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const rawUploadDir = process.env.UPLOAD_DIR ?? "uploads/cards";
const uploadDir = path.isAbsolute(rawUploadDir)
  ? rawUploadDir
  : path.resolve(projectRoot, rawUploadDir);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/dsquare"),
  uploadDir,
  uploadsServePath: process.env.UPLOADS_SERVE_PATH ?? "/uploads",
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://172.28.80.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  ocrProvider:
    process.env.OCR_PROVIDER ?? (process.env.LLM_API_KEY ? "openai" : "tesseract"),
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmApiUrl:
    process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY ?? "",
  azureVisionEndpoint: process.env.AZURE_VISION_ENDPOINT ?? "",
  azureVisionKey: process.env.AZURE_VISION_KEY ?? "",
  // Image Enhancement Settings
  imageEnhancementEnabled: process.env.IMAGE_ENHANCEMENT_ENABLED === "true",
  imageEnhancementQuality: Number(process.env.IMAGE_ENHANCEMENT_QUALITY ?? 90),
  imageEnhancementBrightness: Number(process.env.IMAGE_ENHANCEMENT_BRIGHTNESS ?? 10),
  imageEnhancementContrast: Number(process.env.IMAGE_ENHANCEMENT_CONTRAST ?? 20),
  imageEnhancementSharpen: process.env.IMAGE_ENHANCEMENT_SHARPEN !== "false"
};
