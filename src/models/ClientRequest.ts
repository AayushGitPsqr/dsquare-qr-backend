import { Schema, model, type Model } from "mongoose";

export const CLIENT_REQUEST_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Completed",
  "Closed"
] as const;

export type ClientRequestStatus = (typeof CLIENT_REQUEST_STATUSES)[number];

export interface ClientRequestDocument {
  name: string;
  company: string;
  email: string;
  contactNumber: string;
  message: string;
  status: ClientRequestStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const clientRequestSchema = new Schema<ClientRequestDocument>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: CLIENT_REQUEST_STATUSES,
      default: "New"
    }
  },
  {
    timestamps: true
  }
);

clientRequestSchema.index({ status: 1 });
clientRequestSchema.index({ createdAt: -1 });

export const ClientRequestModel = model<
  ClientRequestDocument,
  Model<ClientRequestDocument>
>("ClientRequest", clientRequestSchema);
