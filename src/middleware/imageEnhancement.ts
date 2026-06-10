import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logInfo } from "../utils/logger.js";
import { getOcrOptimizedUrl } from "../services/cloudinaryService.js";

/**
 * Middleware to enhance uploaded image for better OCR quality
 * For Cloudinary uploads, this applies transformations via Cloudinary API
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

    const file = req.file as any;
    
    // For Cloudinary uploads, store the optimized URL
    if (file.public_id) {
      logInfo(`Applying OCR optimization for Cloudinary image: ${file.public_id}`);
      
      // Get the OCR-optimized URL with Cloudinary transformations
      const optimizedUrl = getOcrOptimizedUrl(file.public_id);
      
      // Store the optimized URL in the file object for use in the controller
      file.optimizedUrl = optimizedUrl;
      
      logInfo(`Image optimization completed for: ${file.originalname}`);
    } else {
      logInfo("File enhancement skipped - not a Cloudinary upload");
    }

    // Continue to next middleware/route
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logInfo(`Image enhancement error (continuing without enhancement): ${errorMsg}`);
    // Don't fail the request if enhancement fails - continue with original image
    next();
  }
}
