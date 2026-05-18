const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.9:3002";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

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
  const categoryNeedle = normalizeText(category);
  const queryNeedle = normalizeText(q);

  return offers.filter((offer) => {
    if (categoryNeedle) {
      const offerCategory = normalizeText(
        offer?.bannerCategory || offer?.offerType || offer?.category
      );
      if (offerCategory !== categoryNeedle) {
        return false;
      }
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

const fetchOfferList = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return extractOfferArray(payload);
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
  } = options;

  try {
    const nearbyParams = new URLSearchParams();
    nearbyParams.append("limit", String(limit));
    nearbyParams.append("page", String(page));

    if (category) {
      nearbyParams.append("category", category);
    }

    if (q) {
      nearbyParams.append("q", q);
    }

    if (lat && lng) {
      nearbyParams.append("lat", String(lat));
      nearbyParams.append("lng", String(lng));
      nearbyParams.append("radiusKm", String(radiusKm));
    }

    const publicParams = new URLSearchParams();
    publicParams.append("limit", String(limit));
    publicParams.append("page", String(page));

    const [nearbyResult, publicResult] = await Promise.allSettled([
      fetchOfferList(`${BASE_URL}/banners/promotions/offers/nearby?${nearbyParams.toString()}`),
      fetchOfferList(`${BASE_URL}/offers?${publicParams.toString()}`),
    ]);

    const nearbyOffers =
      nearbyResult.status === "fulfilled" ? nearbyResult.value : [];
    const publicOffers =
      publicResult.status === "fulfilled" ? publicResult.value : [];

    if (
      nearbyResult.status === "rejected" &&
      publicResult.status === "rejected"
    ) {
      throw new Error(
        nearbyResult.reason?.message ||
          publicResult.reason?.message ||
          "Unable to fetch offers"
      );
    }

    const merged = [...nearbyOffers, ...publicOffers].map((offer) =>
      normalizeOfferRecord(offer)
    );

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
    const response = await fetch(
      `${BASE_URL}/banners/promotions/offers/${offerId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`);
    }

    return data?.data || null;
  } catch (err) {
    console.error("Failed to fetch offer details:", err);
    throw err;
  }
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
  fetchNearbyOffers,
  searchOffers,
  getOffersByCategory,
};
