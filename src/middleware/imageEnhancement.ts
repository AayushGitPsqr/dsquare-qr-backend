import { Request, Response, NextFunction } from "express";
import { enhanceImageForOCR } from "../services/imageEnhancementService.js";
import { env } from "../config/env.js";
import { logInfo } from "../utils/logger.js";

/**
 * Middleware to enhance uploaded image for better OCR quality
 * Should be used after multer upload middleware
 */
export async function enhanceUploadedImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      next();
      return;
    }

    if (!env.imageEnhancementEnabled) {
      logInfo("Image enhancement is disabled");
      next();
      return;
    }

    const imagePath = req.file.path;
    logInfo(`Starting image enhancement for: ${req.file.originalname}`);

    // Enhance the image
    await enhanceImageForOCR(imagePath, {
      enabled: env.imageEnhancementEnabled,
      quality: env.imageEnhancementQuality,
      brightness: env.imageEnhancementBrightness,
      contrast: env.imageEnhancementContrast,
      sharpen: env.imageEnhancementSharpen
    });

    logInfo(`Image enhancement completed for: ${req.file.originalname}`);

    // Continue to next middleware/route
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logInfo(`Image enhancement error (continuing without enhancement): ${errorMsg}`);
    // Don't fail the request if enhancement fails - continue with original image
    next();
  }
}
