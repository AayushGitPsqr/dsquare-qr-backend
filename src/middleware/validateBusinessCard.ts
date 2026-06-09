import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response.js";

export function validateBusinessCardPayload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name, email, phone } = req.body ?? {};

  if (!String(name ?? "").trim()) {
    return sendError(res, "Name is required.", 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return sendError(res, "Email format is invalid.", 400);
  }

  if (phone && !/^\+?[0-9().\-\s]{7,}$/.test(String(phone))) {
    return sendError(res, "Phone format is invalid.", 400);
  }

  return next();
}
