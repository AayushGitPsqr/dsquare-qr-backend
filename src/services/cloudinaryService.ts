import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Initialize Cloudinary with environment variables
 */
export function initializeCloudinary() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    logError("Cloudinary credentials are not properly configured");
    throw new Error("Cloudinary credentials missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
  }

  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  });

  logInfo("Cloudinary initialized successfully");
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  filePath: string,
  options: {
    folder?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    publicId?: string;
  } = {}
): Promise<{
  publicId: string;
  url: string;
  secureUrl: string;
}> {
  try {
    const folder = options.folder || env.cloudinaryFolder;
    const resourceType = options.resourceType || "image";

    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      overwrite: true,
      invalidate: true
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logInfo(`File uploaded to Cloudinary: ${result.public_id}`);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url
    };
  } catch (error) {
    logError(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logInfo(`File deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logError(`Failed to delete file from Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw new Error(`Cloudinary deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get a transformation URL from Cloudinary
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: Record<string, any>
): string {
  const baseUrl = cloudinary.url(publicId, {
    secure: true
  });

  if (!transformations) {
    return baseUrl;
  }

  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
}

/**
 * Apply transformations for OCR optimization
 */
export function getOcrOptimizedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    quality: "auto",
    fetch_format: "auto",
    flags: "immutable"
  });
}

export { cloudinary };
