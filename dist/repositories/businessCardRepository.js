import { BusinessCardModel } from "../models/BusinessCard.js";
export async function createBusinessCard(payload) {
    return BusinessCardModel.create(payload);
}
export async function listBusinessCards() {
    return BusinessCardModel.find().sort({ createdAt: -1 }).lean();
}
export async function getBusinessCardById(id) {
    return BusinessCardModel.findById(id).lean();
}
export async function deleteBusinessCardById(id) {
    return BusinessCardModel.findByIdAndDelete(id).lean();
}
