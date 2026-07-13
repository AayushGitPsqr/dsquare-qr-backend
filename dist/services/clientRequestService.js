import { CLIENT_REQUEST_STATUSES } from "../models/ClientRequest.js";
import { createClientRequest, getClientRequestById, listClientRequests, updateClientRequestStatus } from "../repositories/clientRequestRepository.js";
function valueOrEmpty(value) {
    return typeof value === "string" ? value.trim() : "";
}
function isValidStatus(value) {
    return (typeof value === "string" &&
        CLIENT_REQUEST_STATUSES.includes(value));
}
export function validateClientRequestPayload(payload) {
    const name = valueOrEmpty(payload.name);
    const company = valueOrEmpty(payload.company);
    const email = valueOrEmpty(payload.email);
    const contactNumber = valueOrEmpty(payload.contactNumber);
    const message = valueOrEmpty(payload.message);
    if (!name) {
        const error = new Error("Name is required.");
        error.name = "ValidationError";
        throw error;
    }
    if (!company) {
        const error = new Error("Company is required.");
        error.name = "ValidationError";
        throw error;
    }
    if (!email) {
        const error = new Error("Email is required.");
        error.name = "ValidationError";
        throw error;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const error = new Error("Email format is invalid.");
        error.name = "ValidationError";
        throw error;
    }
    if (!contactNumber) {
        const error = new Error("Contact number is required.");
        error.name = "ValidationError";
        throw error;
    }
    if (!/^\+?[0-9().\-\s]{7,}$/.test(contactNumber)) {
        const error = new Error("Contact number format is invalid.");
        error.name = "ValidationError";
        throw error;
    }
    if (!message) {
        const error = new Error("Message is required.");
        error.name = "ValidationError";
        throw error;
    }
    return {
        name,
        company,
        email,
        contactNumber,
        message
    };
}
export async function saveClientRequest(payload) {
    const validated = validateClientRequestPayload(payload);
    return createClientRequest({
        ...validated,
        status: "New"
    });
}
export async function getClientRequests(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    let status;
    if (query.status !== undefined && query.status !== "") {
        if (!isValidStatus(query.status)) {
            const error = new Error(`Invalid status. Allowed values: ${CLIENT_REQUEST_STATUSES.join(", ")}`);
            error.name = "ValidationError";
            throw error;
        }
        status = query.status;
    }
    return listClientRequests({ page, limit, status });
}
export async function getClientRequest(id) {
    return getClientRequestById(id);
}
export async function changeClientRequestStatus(id, status) {
    if (!isValidStatus(status)) {
        const error = new Error(`Invalid status. Allowed values: ${CLIENT_REQUEST_STATUSES.join(", ")}`);
        error.name = "ValidationError";
        throw error;
    }
    return updateClientRequestStatus(id, status);
}
