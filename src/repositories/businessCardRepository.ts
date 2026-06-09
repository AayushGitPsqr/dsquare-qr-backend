import { BusinessCardModel, type BusinessCardDocument } from "../models/BusinessCard.js";

export async function createBusinessCard(
  payload: Partial<BusinessCardDocument>
) {
  return BusinessCardModel.create(payload);
}

export async function listBusinessCards() {
  return BusinessCardModel.find().sort({ createdAt: -1 }).lean();
}

export async function getBusinessCardById(id: string) {
  return BusinessCardModel.findById(id).lean();
}

export async function deleteBusinessCardById(id: string) {
  return BusinessCardModel.findByIdAndDelete(id).lean();
}
