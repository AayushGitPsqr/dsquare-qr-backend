import { Router } from "express";
import {
  deleteCard,
  getCardById,
  getCards,
  saveCard,
  scanCard
} from "../controllers/businessCardController.js";
import { validateBusinessCardPayload } from "../middleware/validateBusinessCard.js";
import { uploadCardImage } from "../middleware/upload.js";

export const businessCardRoutes = Router();

businessCardRoutes.post("/scan", uploadCardImage.single("image"), scanCard);
businessCardRoutes.post("/save", validateBusinessCardPayload, saveCard);
businessCardRoutes.get("/", getCards);
businessCardRoutes.get("/:id", getCardById);
businessCardRoutes.delete("/:id", deleteCard);
