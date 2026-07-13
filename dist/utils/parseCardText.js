function cleanLine(value) {
    return value
        .replace(/[|•·]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[\s,;:-]+|[\s,;:-]+$/g, "")
        .trim();
}
function normalizeText(rawText) {
    return rawText.replace(/\r\n?/g, "\n");
}
function isEmail(line) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line);
}
function isPhone(line) {
    return /^\+?[0-9().\-\s]{7,}$/.test(line);
}
function isWebsite(line) {
    return /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i.test(line);
}
function isTitleCaseName(line) {
    return /^[A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){0,3}$/.test(line);
}
function isFallbackName(line) {
    return /^[A-Za-z][A-Za-z.'-]{1,30}(?:\s+[A-Za-z][A-Za-z.'-]{1,30}){0,3}$/.test(line);
}
function isCompany(line) {
    return /(inc|llc|ltd|pvt|corp|company|technologies|technology|solutions|systems|group|studios|labs|services|associates|consulting|enterprises|international|global|innovations|digital|agency|media|partners)/i.test(line);
}
function isDesignation(line) {
    return /(engineer|manager|director|founder|consultant|specialist|lead|head|officer|architect|developer|designer|analyst|president|vice president|vp|chief|co-founder|cto|ceo|cfo|marketing|sales|operations|product)/i.test(line);
}
function isAddress(line) {
    return /(\d|street|road|rd|avenue|ave|lane|ln|sector|block|city|state|india|usa|united|suite|floor|building|nagar|district|pin|pincode|postal|zip|plot|near|opp\.|opposite)/i.test(line);
}
function extractFromLabels(lines, regex) {
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const match = line.match(regex);
        if (match?.[1])
            return cleanLine(match[1]);
        if (regex.test(line) && lines[index + 1]) {
            return cleanLine(lines[index + 1]);
        }
    }
    return null;
}
function scoreLine(line, index) {
    let score = 0;
    const wordCount = line.split(" ").length;
    if (isTitleCaseName(line))
        score += 8;
    if (isFallbackName(line))
        score += 5;
    if (wordCount === 1)
        score += 2;
    if (line.length <= 40)
        score += 1;
    if (index <= 4)
        score += 2;
    if (isCompany(line))
        score -= 6;
    if (isDesignation(line))
        score -= 4;
    if (isEmail(line) || isPhone(line) || isWebsite(line))
        score -= 10;
    if (isAddress(line))
        score -= 5;
    return score;
}
function scoreCompany(line, index) {
    let score = 0;
    if (isCompany(line))
        score += 10;
    if (line === line.toUpperCase() && line.length > 2 && line.length < 60)
        score += 4;
    if (index <= 5)
        score += 1;
    if (isEmail(line) || isPhone(line) || isWebsite(line))
        score -= 10;
    if (isDesignation(line))
        score -= 5;
    return score;
}
function scoreDesignation(line, index) {
    let score = 0;
    if (isDesignation(line))
        score += 10;
    if (line.split(" ").length <= 5)
        score += 1;
    if (index <= 6)
        score += 1;
    if (isCompany(line) || isEmail(line) || isPhone(line) || isWebsite(line))
        score -= 10;
    return score;
}
function pickBest(lines, scorer) {
    let bestLine = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    lines.forEach((line, index) => {
        const score = scorer(line, index);
        if (score > bestScore) {
            bestScore = score;
            bestLine = line;
        }
    });
    return bestScore > 0 ? bestLine : null;
}
export function parseBusinessCardText(rawText) {
    const text = normalizeText(rawText);
    const lines = text
        .split("\n")
        .map(cleanLine)
        .filter(Boolean);
    const email = extractFromLabels(lines, /(?:email|e-mail)\s*[:\-]?\s*([^\s@]+@[^\s@]+\.[^\s@]+)/i) ??
        lines.find(isEmail) ??
        null;
    const phone = extractFromLabels(lines, /(?:phone|mobile|m(?:ob(?:ile)?)?|tel|telephone|cell)\s*[:\-]?\s*([+\d][\d\s().-]{6,}\d)/i) ??
        lines.find(isPhone) ??
        null;
    const website = extractFromLabels(lines, /(?:website|web|site|url)\s*[:\-]?\s*((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i) ??
        lines.find(isWebsite) ??
        null;
    const companyLabel = extractFromLabels(lines, /(?:company|organization|organisation|firm)\s*[:\-]?\s*(.+)/i);
    const designationLabel = extractFromLabels(lines, /(?:designation|title|role|position)\s*[:\-]?\s*(.+)/i);
    const nameLabel = extractFromLabels(lines, /(?:name|full name)\s*[:\-]?\s*(.+)/i);
    const addressLabel = extractFromLabels(lines, /(?:address|location)\s*[:\-]?\s*(.+)/i);
    const name = nameLabel ??
        pickBest(lines.filter((line) => ![email, phone, website].includes(line)), scoreLine) ??
        null;
    const designation = designationLabel ??
        pickBest(lines.filter((line) => ![name, email, phone, website].includes(line)), scoreDesignation) ??
        null;
    const company = companyLabel ??
        pickBest(lines.filter((line) => ![name, designation, email, phone, website].includes(line)), scoreCompany) ??
        null;
    const addressCandidates = [
        ...(addressLabel ? [addressLabel] : []),
        ...lines.filter((line) => {
            if ([name, designation, company, email, phone, website].includes(line))
                return false;
            return isAddress(line);
        })
    ];
    const address = addressCandidates.length > 0 ? addressCandidates.join(", ") : null;
    return {
        name,
        designation,
        company,
        email,
        phone,
        website,
        address,
        rawText: text || null
    };
}
