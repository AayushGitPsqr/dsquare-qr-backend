import { asyncHandler } from "../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { changeClientRequestStatus, getClientRequest, getClientRequests, saveClientRequest } from "../services/clientRequestService.js";
export const createRequest = asyncHandler(async (req, res) => {
    const saved = await saveClientRequest(req.body);
    return sendSuccess(res, "Client request submitted successfully", saved, 201);
});
export const getRequests = asyncHandler(async (req, res) => {
    const result = await getClientRequests(req.query);
    return sendSuccess(res, "Client requests fetched successfully", result);
});
export const getRequestById = asyncHandler(async (req, res) => {
    const request = await getClientRequest(String(req.params.id));
    if (!request) {
        return sendError(res, "Client request not found.", 404);
    }
    return sendSuccess(res, "Client request fetched successfully", request);
});
export const updateRequestStatus = asyncHandler(async (req, res) => {
    const updated = await changeClientRequestStatus(String(req.params.id), req.body.status);
    if (!updated) {
        return sendError(res, "Client request not found.", 404);
    }
    return sendSuccess(res, "Client request status updated successfully", updated);
});
