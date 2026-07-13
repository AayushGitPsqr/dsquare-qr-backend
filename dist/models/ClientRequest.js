import { Schema, model } from "mongoose";
export const CLIENT_REQUEST_STATUSES = [
    "New",
    "Contacted",
    "In Progress",
    "Completed",
    "Closed"
];
const clientRequestSchema = new Schema({
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
}, {
    timestamps: true
});
clientRequestSchema.index({ status: 1 });
clientRequestSchema.index({ createdAt: -1 });
export const ClientRequestModel = model("ClientRequest", clientRequestSchema);
