import { BASE_URL } from "../config";
import { getValidToken } from "./authService";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");

const CATEGORY_ALIASES = {
  "food & dining": "food & restaurants",
  beauty: "beauty & wellness",
  healthcare: "healthcare & medical",
};

const toCanonicalCategory = (value) => {
  const normalized = normalizeText(value);
  return CATEGORY_ALIASES[normalized] || normalized;
};

const isOfferLikeObject = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Boolean(
    value.offerId ||
    value.requestId ||
    value._id ||
    value.title ||
    value.bannerTitle
  );
};

const extractOfferArray = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.offers)) {
    return payload.offers;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload?.data?.offers)) {
    return payload.data.offers;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  if (Array.isArray(payload?.data?.rows)) {
    return payload.data.rows;
  }

  if (isOfferLikeObject(payload?.data)) {
    return [payload.data];
  }

  if (isOfferLikeObject(payload)) {
    return [payload];
  }

  return [];
};

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeSelectedProducts = (offer) => {
  const fromSelected = Array.isArray(offer?.selectedProducts)
    ? offer.selectedProducts
    : [];
  const fromProducts = Array.isArray(offer?.products) ? offer.products : [];

  if (fromSelected.length) {
    return fromSelected;
  }

  return fromProducts.map((product) => {
    const imageUrl =
      product?.imageUrl ||
      product?.images?.[0] ||
      product?.image?.url ||
      product?.image ||
      "";

    const price = toFiniteNumber(product?.price);

    return {
      productId: product?._id || product?.id || product?.productId || "",
      productName: product?.name || product?.productName || "",
      imageUrl,
      originalPrice: price ?? 0,
      offerPrice: price ?? 0,
      stockQuantity: toFiniteNumber(product?.stockQuantity) ?? 0,
    };
  });
};

const pickLowestOfferPrice = (selectedProducts) => {
  const prices = selectedProducts
    .map((product) => toFiniteNumber(product?.offerPrice))
    .filter((value) => value !== null && value > 0);

  if (!prices.length) {
    return null;
  }

  return Math.min(...prices);
};

const pickHighestOriginalPrice = (selectedProducts) => {
  const prices = selectedProducts
    .map((product) => toFiniteNumber(product?.originalPrice))
    .filter((value) => value !== null && value > 0);

  if (!prices.length) {
    return null;
  }

  return Math.max(...prices);
};

const normalizeOfferRecord = (rawOffer = {}) => {
  const selectedProducts = normalizeSelectedProducts(rawOffer);
  const merchant = rawOffer?.merchant || {};
  const fallbackDiscountPrice = pickLowestOfferPrice(selectedProducts);
  const fallbackOriginalPrice = pickHighestOriginalPrice(selectedProducts);

  const discountPrice =
    toFiniteNumber(rawOffer?.discountedPrice) ??
    toFiniteNumber(rawOffer?.offerPrice) ??
    toFiniteNumber(rawOffer?.salePrice) ??
    toFiniteNumber(rawOffer?.finalPrice) ??
    toFiniteNumber(rawOffer?.displayPrice) ??
    fallbackDiscountPrice;

  const originalPrice =
    toFiniteNumber(rawOffer?.originalPrice) ??
    toFiniteNumber(rawOffer?.mrp) ??
    toFiniteNumber(rawOffer?.price) ??
    toFiniteNumber(rawOffer?.regularPrice) ??
    fallbackOriginalPrice;

  const merchantName =
    rawOffer?.shopName ||
    rawOffer?.merchantName ||
    rawOffer?.businessName ||
    rawOffer?.sellerName ||
    rawOffer?.storeName ||
    rawOffer?.merchant?.name ||
    rawOffer?.merchant?.storeName ||
    "Nearby merchant";

  const address =
    rawOffer?.address ||
    rawOffer?.shopAddress ||
    rawOffer?.location ||
    rawOffer?.city ||
    rawOffer?.merchant?.address ||
    rawOffer?.merchant?.storeLocation ||
    "";

  const normalized = {
    ...rawOffer,
    offerId: rawOffer?.offerId || rawOffer?._id || rawOffer?.requestId || "",
    requestId: rawOffer?.requestId || rawOffer?.offerId || rawOffer?._id || "",
    _id: rawOffer?._id || rawOffer?.offerId || rawOffer?.requestId || "",
    title: rawOffer?.title || rawOffer?.bannerTitle || "Untitled Offer",
    bannerTitle: rawOffer?.bannerTitle || rawOffer?.title || "Untitled Offer",
    category: rawOffer?.category || rawOffer?.bannerCategory || rawOffer?.offerType || "",
    bannerCategory:
      rawOffer?.bannerCategory || rawOffer?.category || rawOffer?.offerType || "",
    offerType: rawOffer?.offerType || rawOffer?.bannerCategory || rawOffer?.category || "",
    imageUrl:
      rawOffer?.imageUrl ||
      selectedProducts?.[0]?.imageUrl ||
      rawOffer?.products?.[0]?.images?.[0] ||
      rawOffer?.products?.[0]?.image?.url ||
      "",
    selectedProducts,
    discountedPrice: discountPrice,
    offerPrice: discountPrice,
    originalPrice,
    price: originalPrice,
    endDate: rawOffer?.endDate || rawOffer?.validTo || rawOffer?.endsAt || null,
    validTo: rawOffer?.validTo || rawOffer?.endDate || rawOffer?.endsAt || null,
    shopName: merchantName,
    merchantName,
    storeName: merchantName,
    address,
    location: address,
  };

  return normalized;
};

const buildOfferKey = (offer, index) =>
  offer?.requestId ||
  offer?.offerId ||
  offer?._id ||
  `${offer?.title || "offer"}-${offer?.merchantName || "merchant"}-${index}`;

const applyLocalFilters = (offers, { category, q }) => {
  const categoryNeedle = toCanonicalCategory(category);
  const queryNeedle = normalizeText(q);

  return offers.filter((offer) => {
    if (categoryNeedle) {
      const candidates = [
        offer?.bannerCategory,
        offer?.offerType,
        offer?.category,
        offer?.merchant?.category,
        offer?.merchant?.storeCategory,
      ];

      const hasCategoryMatch = candidates.some(
        (candidate) => toCanonicalCategory(candidate) === categoryNeedle
      );

      if (!hasCategoryMatch) return false;
    }

    if (queryNeedle) {
      const searchBlob = normalizeText(
        [
          offer?.bannerTitle,
          offer?.title,
          offer?.bannerCategory,
          offer?.offerType,
          offer?.merchantName,
          offer?.storeName,
          offer?.address,
          offer?.location,
        ]
          .filter(Boolean)
          .join(" ")
      );

      if (!searchBlob.includes(queryNeedle)) {
        return false;
      }
    }

    return true;
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchOfferList = async (url, maxRetries = 2) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = payload?.message || `HTTP ${response.status}`;
        // If 503 (transient failure/timeout) and we have retries left, wait and retry
        if ((response.status === 503 || response.status === 504) && attempt < maxRetries) {
          await delay(600 * (attempt + 1));
          continue;
        }
        throw new Error(errorMsg);
      }

      return extractOfferArray(payload);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await delay(600 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Failed to fetch offers");
};

/**
 * Fetch all active offers from merchants
 * @param {Object} options - Query parameters
 * @param {number} options.limit - Number of offers per page (default: 50)
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.category - Filter by category (optional)
 * @param {string} options.q - Search query (optional)
 * @param {number} options.lat - Latitude for nearby search (optional)
 * @param {number} options.lng - Longitude for nearby search (optional)
 * @param {number} options.radiusKm - Radius in km for nearby search (optional, default: 10km)
 * @returns {Promise<Array>} Array of offer objects
 */
export const fetchAllOffers = async (options = {}) => {
  const {
    limit = 50,
    page = 1,
    category = null,
    q = null,
    lat = null,
    lng = null,
    radiusKm = 10,
    offerTypes = null,
  } = options;

  const buildUrl = (includeLocation = true) => {
    const nearbyParams = new URLSearchParams();
    nearbyParams.append("limit", String(limit));
    nearbyParams.append("page", String(page));

    if (category) {
      nearbyParams.append("category", category);
    }

    if (q) {
      nearbyParams.append("q", q);
    }

    if (offerTypes) {
      nearbyParams.append("offerTypes", offerTypes);
    }

    const hasCoords =
      includeLocation &&
      lat !== null &&
      lat !== undefined &&
      lng !== null &&
      lng !== undefined &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));

    if (hasCoords) {
      nearbyParams.append("lat", String(lat));
      nearbyParams.append("lng", String(lng));
      nearbyParams.append("radiusKm", String(radiusKm));
    }

    nearbyParams.append("activeNow", "true");

    return `${BASE_URL}/offers/nearby?${nearbyParams.toString()}`;
  };

  try {
    let offersResult = [];
    try {
      offersResult = await fetchOfferList(buildUrl(true));
    } catch (primaryErr) {
      // If location-constrained query fails, attempt fallback without location params
      const hasCoords =
        lat !== null &&
        lat !== undefined &&
        lng !== null &&
        lng !== undefined &&
        !Number.isNaN(Number(lat)) &&
        !Number.isNaN(Number(lng));

      if (hasCoords) {
        console.warn("Primary nearby offers fetch failed, attempting fallback without location filter...", primaryErr);
        offersResult = await fetchOfferList(buildUrl(false));
      } else {
        throw primaryErr;
      }
    }

    const merged = offersResult.map((offer) => normalizeOfferRecord(offer));

    const uniqueByKey = new Map();
    merged.forEach((offer, index) => {
      uniqueByKey.set(buildOfferKey(offer, index), offer);
    });

    const filtered = applyLocalFilters(
      Array.from(uniqueByKey.values()),
      {
        category,
        q,
      }
    );

    filtered.sort(
      (a, b) =>
        new Date(b?.createdAt || b?.updatedAt || 0).getTime() -
        new Date(a?.createdAt || a?.updatedAt || 0).getTime()
    );

    return filtered;
  } catch (err) {
    console.error("Failed to fetch offers:", err);
    throw err;
  }
};

/**
 * Fetch a specific offer's details
 * @param {string} offerId - Offer request ID or object ID
 * @returns {Promise<Object>} Offer details
 */
export const fetchOfferDetails = async (offerId) => {
  try {
    const response = await fetch(`${BASE_URL}/offers/${offerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return data?.data || null;
  } catch (err) {
    throw err;
  }
};

/**
 * Fetch public merchant profile by merchant ID
 * @param {string} merchantId - Merchant user ID or profile ID
 * @returns {Promise<Object|null>} Merchant profile data or null
 */
export const fetchPublicMerchantProfile = async (merchantId) => {
  try {
    if (!BASE_URL || !merchantId) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/merchant/public/${merchantId}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`);
    }

    return data?.data || null;
  } catch (err) {
    console.error("Failed to fetch public merchant profile:", err);
    return null;
  }
};

const readJsonResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

/**
 * Check whether the current customer is already following a merchant.
 * @param {string} merchantId
 * @returns {Promise<{success:boolean, isFollowing:boolean}>}
 */
export const checkFollowStatus = async (merchantId) => {
  try {
    if (!BASE_URL || !merchantId) {
      return { success: true, isFollowing: false };
    }

    const token = await getValidToken();
    const response = await fetch(`${BASE_URL}/users/merchants/${merchantId}/follow-status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await readJsonResponse(response);
    return {
      success: Boolean(data?.success !== false),
      isFollowing: Boolean(data?.isFollowing),
    };
  } catch (error) {
    if (error?.message === "NOT_AUTHENTICATED" || error?.message === "SESSION_EXPIRED") {
      return { success: true, isFollowing: false };
    }

    console.warn("Failed to check follow status:", error);
    return { success: true, isFollowing: false };
  }
};

/**
 * Toggle follow status for a merchant.
 * @param {string} merchantId
 * @returns {Promise<{success:boolean, isFollowing:boolean, message:string}>}
 */
export const toggleFollowMerchant = async (merchantId) => {
  if (!BASE_URL || !merchantId) {
    throw new Error("Merchant ID is required");
  }

  const token = await getValidToken();
  const response = await fetch(`${BASE_URL}/users/merchants/${merchantId}/follow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJsonResponse(response);
  return {
    success: Boolean(data?.success !== false),
    isFollowing: Boolean(data?.isFollowing),
    message: data?.message || "",
  };
};

/**
 * Fetch nearby offers based on user location
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {Object} options - Additional options
 * @param {number} options.radiusKm - Search radius in km (default: 10)
 * @param {string} options.category - Filter by category (optional)
 * @returns {Promise<Array>} Array of nearby offers
 */
export const fetchNearbyOffers = async (latitude, longitude, options = {}) => {
  return fetchAllOffers({
    lat: latitude,
    lng: longitude,
    ...options,
  });
};

/**
 * Search offers by keyword or category
 * @param {string} searchQuery - Search term
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of matching offers
 */
export const searchOffers = async (searchQuery, options = {}) => {
  return fetchAllOffers({
    q: searchQuery,
    ...options,
  });
};

/**
 * Get offers by category
 * @param {string} category - Category name (e.g., "Education", "Travel", etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of offers in the category
 */
export const getOffersByCategory = async (category, options = {}) => {
  return fetchAllOffers({
    category,
    ...options,
  });
};

export default {
  fetchAllOffers,
  fetchOfferDetails,
  fetchPublicMerchantProfile,
  checkFollowStatus,
  toggleFollowMerchant,
  fetchNearbyOffers,
  searchOffers,
  getOffersByCategory,
};
