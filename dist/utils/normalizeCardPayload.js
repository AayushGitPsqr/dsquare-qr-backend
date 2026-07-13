function normalizeValue(value) {
    if (typeof value !== "string")
        return null;
    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized ? normalized : null;
}
function normalizeRawText(value) {
    if (typeof value !== "string")
        return null;
    const normalized = value.replace(/\r\n?/g, "\n").trim();
    return normalized ? normalized : null;
}
export function normalizeBusinessCardPayload(payload) {
    return {
        name: normalizeValue(payload.name),
        designation: normalizeValue(payload.designation),
        company: normalizeValue(payload.company),
        email: normalizeValue(payload.email),
        phone: normalizeValue(payload.phone),
        website: normalizeValue(payload.website),
        address: normalizeValue(payload.address),
        cardImage: normalizeValue(payload.cardImage),
        rawText: normalizeRawText(payload.rawText)
    };
}
