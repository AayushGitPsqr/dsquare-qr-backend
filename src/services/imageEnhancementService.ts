import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { logInfo, logWarn } from "../utils/logger.js";

interface EnhancementConfig {
  enabled: boolean;
  quality: number;
  brightness: number;
  contrast: number;
  sharpen: boolean;
}

const defaultConfig: EnhancementConfig = {
  enabled: env.imageEnhancementEnabled,
  quality: env.imageEnhancementQuality,
  brightness: env.imageEnhancementBrightness,
  contrast: env.imageEnhancementContrast,
  sharpen: env.imageEnhancementSharpen
};

/**
 * Enhance image quality for better OCR recognition
 * - Increases sharpness
 * - Adjusts brightness and contrast
 * - Optimizes quality
 */
export async function enhanceImageForOCR(
  imagePath: string,
  config: Partial<EnhancementConfig> = {}
): Promise<string> {
  try {
    const finalConfig = { ...defaultConfig, ...config };

    if (!finalConfig.enabled) {
      logInfo(`Image enhancement disabled for ${imagePath}`);
      return imagePath;
    }

    const ext = path.extname(imagePath).toLowerCase();
    const enhancedPath = imagePath.replace(
      ext,
      `-enhanced${ext}`
    );

    let pipeline = sharp(imagePath);

    // Increase brightness and contrast for better visibility
    pipeline = pipeline.modulate({
      brightness: 1 + finalConfig.brightness / 100,
      saturation: 1.1,
      lightness: finalConfig.contrast / 100
    });

    // Sharpen the image to improve text clarity
    if (finalConfig.sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 1.5
      });
    }

    // Apply additional processing based on format
    if (ext === ".png") {
      pipeline = pipeline.png({ quality: finalConfig.quality });
    } else {
      pipeline = pipeline.jpeg({ quality: finalConfig.quality });
    }

    await pipeline.toFile(enhancedPath);

    logInfo(`Image enhanced: ${imagePath} -> ${enhancedPath}`);

    // Replace original with enhanced version
    await fs.rename(enhancedPath, imagePath);

    return imagePath;
  } catch (error) {
    logWarn(
      `Failed to enhance image ${imagePath}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    // Return original path if enhancement fails
    return imagePath;
  }
}

/**
 * Batch enhance multiple images
 */
export async function enhanceMultipleImages(
  imagePaths: string[],
  config?: Partial<EnhancementConfig>
): Promise<string[]> {
  return Promise.all(
    imagePaths.map((path) => enhanceImageForOCR(path, config))
  );
}
