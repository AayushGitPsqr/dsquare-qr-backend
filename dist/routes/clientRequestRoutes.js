import { Router } from "express";
import { createRequest, getRequestById, getRequests, updateRequestStatus } from "../controllers/clientRequestController.js";
import { validateCreateClientRequest, validateUpdateClientRequestStatus } from "../middleware/validateClientRequest.js";
export const clientRequestRoutes = Router();
clientRequestRoutes.post("/", validateCreateClientRequest, createRequest);
clientRequestRoutes.get("/", getRequests);
clientRequestRoutes.get("/:id", getRequestById);
clientRequestRoutes.patch("/:id/status", validateUpdateClientRequestStatus, updateRequestStatus);
