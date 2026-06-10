import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  deleteBusinessCardById,
  getBusinessCardById,
  listBusinessCards,
  saveBusinessCard,
  scanBusinessCard
} from "../services/businessCardService.js";

export const scanCard = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as any;
  if (!file) {
    return sendError(res, "Image is required.", 400);
  }

  // For Cloudinary uploads, use the secure_url
  const cardImageUrl = file.secure_url || file.url;
  
  const result = await scanBusinessCard(cardImageUrl);
  
  return sendSuccess(res, "Card scanned successfully", {
    ...result.parsed,
    rawText: result.rawText,
    provider: result.provider,
    cardImage: cardImageUrl,
    cloudinaryPublicId: file.public_id
  });
});

export const saveCard = asyncHandler(async (req: Request, res: Response) => {
  const saved = await saveBusinessCard(req.body);
  return sendSuccess(res, "Card saved successfully", saved, 201);
});

export const getCards = asyncHandler(async (_req: Request, res: Response) => {
  const cards = await listBusinessCards();
  return sendSuccess(res, "Cards fetched successfully", cards);
});

export const getCardById = asyncHandler(async (req: Request, res: Response) => {
  const card = await getBusinessCardById(String(req.params.id));
  if (!card) {
    return sendError(res, "Card not found.", 404);
  }
  return sendSuccess(res, "Card fetched successfully", card);
});

export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await deleteBusinessCardById(String(req.params.id));
  if (!deleted) {
    return sendError(res, "Card not found.", 404);
  }
  return sendSuccess(res, "Card deleted successfully", deleted);
});
