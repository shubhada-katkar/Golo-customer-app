const normalizeCategoryName = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const normalizeFilterValue = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const CATEGORY_ALIASES = {
    electronics: "Electronics & Home appliances",
    electronicshome: "Electronics & Home appliances",
    electronicsandhomeappliances: "Electronics & Home appliances",
    electronicshomeappliances: "Electronics & Home appliances",
    greetings: "Greetings & Tributes",
    greetingstributes: "Greetings & Tributes",
    greetingsandtributes: "Greetings & Tributes",
    tribute: "Greetings & Tributes",
    vehicle: "Vehicle",
    property: "Property",
    education: "Education",
    matrimonial: "Matrimonial",
    business: "Business",
    travel: "Travel",
    astrology: "Astrology",
    publicnotice: "Public Notice",
    lostfound: "Lost & Found",
    lostandfound: "Lost & Found",
    service: "Service",
    personal: "Personal",
    employment: "Employment",
    pets: "Pets",
    mobiles: "Mobiles",
    furniture: "Furniture",
    other: "Other",
};

export const getBackendCategoryName = (value) => {
    if (!value) return null;

    const normalized = normalizeCategoryName(value);
    if (!normalized) return null;

    const compact = normalized.replace(/\s+/g, "");

    return CATEGORY_ALIASES[normalized] || CATEGORY_ALIASES[compact] || String(value).trim();
};

const getCategorySpecificData = (ad) => {
    const directData = ad?.categorySpecificData || {};
    const explicitData = ad?.vehicleData || ad?.greetingsData || ad?.otherData || {};

    return {
        ...explicitData,
        ...directData,
    };
};

export const getCategorySubFilterValue = (ad) => {
    const category = normalizeCategoryName(getBackendCategoryName(ad?.category || ad?.adCategory || ad?.bannerCategory || ""));
    const categoryData = getCategorySpecificData(ad);

    if (category === "vehicle") {
        return normalizeFilterValue(
            categoryData?.type ||
            ad?.vehicleData?.type ||
            ad?.categorySpecificData?.type ||
            ad?.type ||
            ad?.subCategory
        );
    }

    if (category === "property") {
        return normalizeFilterValue(
            categoryData?.Type ||
            ad?.categorySpecificData?.noticeType ||
            ad?.noticeType ||
            ad?.subCategory
        );
    }

    if (category === "greetings" || category === "greetings tributes") {
        return normalizeFilterValue(
            categoryData?.Type ||
            ad?.greetingsData?.noticeType ||
            ad?.categorySpecificData?.noticeType ||
            ad?.noticeType ||
            ad?.subCategory
        );
    }

    return null;
};

export const matchesCategory = (ad, category) => {
    if (!category) return true;

    const expectedCategory = getBackendCategoryName(category);
    const adCategory = getBackendCategoryName(ad?.category || ad?.adCategory || ad?.bannerCategory || "");

    if (!expectedCategory || !adCategory) return true;

    return normalizeCategoryName(expectedCategory) === normalizeCategoryName(adCategory);
};

export const matchesCategorySubFilter = (ad, category, subFilter) => {
    if (!category) return true;

    if (!matchesCategory(ad, category)) return false;

    if (!subFilter) return true;

    const normalizedCategory = normalizeCategoryName(getBackendCategoryName(category));
    const normalizedSubFilter = normalizeFilterValue(subFilter);

    if (normalizedCategory === "vehicle") {
        return normalizeFilterValue(getCategorySubFilterValue(ad)) === normalizedSubFilter;
    }

    if (normalizedCategory === "property") {
        return normalizeFilterValue(getCategorySubFilterValue(ad)) === normalizedSubFilter;
    }

    if (normalizedCategory === "greetings" || normalizedCategory === "greetings tributes") {
        return normalizeFilterValue(getCategorySubFilterValue(ad)) === normalizedSubFilter;
    }

    return true;
};
