import { Schema, model, type Model } from "mongoose";

export interface BusinessCardDocument {
  name: string | null;
  designation: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  cardImage: string | null;
  rawText: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const businessCardSchema = new Schema<BusinessCardDocument>(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: null },
    company: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    website: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    cardImage: { type: String, trim: true, default: null },
    rawText: { type: String, trim: true, default: null }
  },
  {
    timestamps: true
  }
);

businessCardSchema.index({ email: 1 });
businessCardSchema.index({ phone: 1 });

export const BusinessCardModel = model<BusinessCardDocument, Model<BusinessCardDocument>>(
  "BusinessCard",
  businessCardSchema
);
