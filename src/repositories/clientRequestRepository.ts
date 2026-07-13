import {
  ClientRequestModel,
  type ClientRequestDocument,
  type ClientRequestStatus
} from "../models/ClientRequest.js";

export async function createClientRequest(
  payload: Partial<ClientRequestDocument>
) {
  return ClientRequestModel.create(payload);
}

export async function listClientRequests(options: {
  page: number;
  limit: number;
  status?: ClientRequestStatus;
}) {
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

export async function getClientRequestById(id: string) {
  return ClientRequestModel.findById(id).lean();
}

export async function updateClientRequestStatus(
  id: string,
  status: ClientRequestStatus
) {
  return ClientRequestModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).lean();
}
