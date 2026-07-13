import { asyncHandler } from "../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { deleteBusinessCardById, getBusinessCardById, listBusinessCards, saveBusinessCard, scanBusinessCard } from "../services/businessCardService.js";
export const scanCard = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        return sendError(res, "Image is required.", 400);
    }
    // multer-storage-cloudinary exposes the uploaded asset at `path` and `filename`.
    // We also keep the enhancement middleware fallback fields for compatibility.
    const cardImageUrl = file.optimizedUrl ||
        file.path ||
        file.secure_url ||
        file.secureUrl ||
        file.url;
    if (typeof cardImageUrl !== "string" || !cardImageUrl.trim()) {
        return sendError(res, "Uploaded image URL is unavailable.", 400);
    }
    const result = await scanBusinessCard(cardImageUrl);
    return sendSuccess(res, "Card scanned successfully", {
        ...result.parsed,
        rawText: result.rawText,
        provider: result.provider,
        cardImage: cardImageUrl,
        cloudinaryPublicId: file.public_id
    });
});
export const saveCard = asyncHandler(async (req, res) => {
    const saved = await saveBusinessCard(req.body);
    return sendSuccess(res, "Card saved successfully", saved, 201);
});
export const getCards = asyncHandler(async (_req, res) => {
    const cards = await listBusinessCards();
    return sendSuccess(res, "Cards fetched successfully", cards);
});
export const getCardById = asyncHandler(async (req, res) => {
    const card = await getBusinessCardById(String(req.params.id));
    if (!card) {
        return sendError(res, "Card not found.", 404);
    }
    return sendSuccess(res, "Card fetched successfully", card);
});
export const deleteCard = asyncHandler(async (req, res) => {
    const deleted = await deleteBusinessCardById(String(req.params.id));
    if (!deleted) {
        return sendError(res, "Card not found.", 404);
    }
    return sendSuccess(res, "Card deleted successfully", deleted);
});
