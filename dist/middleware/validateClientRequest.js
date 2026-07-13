import { CLIENT_REQUEST_STATUSES } from "../models/ClientRequest.js";
import { sendError } from "../utils/response.js";
export function validateCreateClientRequest(req, res, next) {
    const { name, company, email, contactNumber, message } = req.body ?? {};
    if (!String(name ?? "").trim()) {
        return sendError(res, "Name is required.", 400);
    }
    if (!String(company ?? "").trim()) {
        return sendError(res, "Company is required.", 400);
    }
    if (!String(email ?? "").trim()) {
        return sendError(res, "Email is required.", 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return sendError(res, "Email format is invalid.", 400);
    }
    if (!String(contactNumber ?? "").trim()) {
        return sendError(res, "Contact number is required.", 400);
    }
    if (!/^\+?[0-9().\-\s]{7,}$/.test(String(contactNumber))) {
        return sendError(res, "Contact number format is invalid.", 400);
    }
    if (!String(message ?? "").trim()) {
        return sendError(res, "Message is required.", 400);
    }
    return next();
}
export function validateUpdateClientRequestStatus(req, res, next) {
    const { status } = req.body ?? {};
    if (!String(status ?? "").trim()) {
        return sendError(res, "Status is required.", 400);
    }
    if (!CLIENT_REQUEST_STATUSES.includes(String(status))) {
        return sendError(res, `Invalid status. Allowed values: ${CLIENT_REQUEST_STATUSES.join(", ")}`, 400);
    }
    req.body.status = status;
    return next();
}
