import { ClientRequestModel } from "../models/ClientRequest.js";
export async function createClientRequest(payload) {
    return ClientRequestModel.create(payload);
}
export async function listClientRequests(options) {
    const { page, limit, status } = options;
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        ClientRequestModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ClientRequestModel.countDocuments(filter)
    ]);
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0
    };
}
export async function getClientRequestById(id) {
    return ClientRequestModel.findById(id).lean();
}
export async function updateClientRequestStatus(id, status) {
    return ClientRequestModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
}
