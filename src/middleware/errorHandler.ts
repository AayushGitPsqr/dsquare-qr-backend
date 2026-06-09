import type { NextFunction, Request, Response } from "express";
import { logError } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(
  error: Error & { code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logError(error.message, { stack: error.stack });

  if (error.name === "ValidationError") {
    return sendError(res, error.message, 400);
  }

  if (error.name === "OcrError") {
    return sendError(res, error.message, 422);
  }

  if (error.message.includes("Invalid image")) {
    return sendError(res, error.message, 400);
  }

  if (error.code === "LIMIT_FILE_SIZE" || error.message.includes("File too large")) {
    return sendError(res, "Image must be 10 MB or less.", 400);
  }

  return sendError(res, "An unexpected error occurred.", 500);
}
