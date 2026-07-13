import { Schema, model } from "mongoose";
const businessCardSchema = new Schema({
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: null },
    company: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    website: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    cardImage: { type: String, trim: true, default: null },
    rawText: { type: String, trim: true, default: null }
}, {
    timestamps: true
});
businessCardSchema.index({ email: 1 });
businessCardSchema.index({ phone: 1 });
export const BusinessCardModel = model("BusinessCard", businessCardSchema);
