import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { getValidToken } from "./authService";

const FAVORITE_OFFERS_KEY_PREFIX = "favoriteOffers";

async function getFavoritesStorageKey() {
  const customerId = await AsyncStorage.getItem("customerId");
  const scope = customerId ? String(customerId) : "guest";
  return `${FAVORITE_OFFERS_KEY_PREFIX}:${scope}`;
}

function isMongoObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

function getOfferId(offer) {
  const candidateIds = [offer?._id, offer?.offerId, offer?.requestId];
  const validId = candidateIds.find((value) => isMongoObjectId(value));
  return String(validId || offer?._id || offer?.offerId || offer?.requestId || "");
}

function getOfferImage(offer) {
  return (
    offer?.imageUrl ||
    offer?.selectedProducts?.[0]?.imageUrl ||
    offer?.products?.[0]?.images?.[0] ||
    offer?.products?.[0]?.image?.url ||
    null
  );
}

function getOfferTitle(offer) {
  return offer?.bannerTitle || offer?.title || "Untitled Offer";
}

function getOfferMerchant(offer) {
  return (
    offer?.shopName ||
    offer?.merchantName ||
    offer?.businessName ||
    offer?.sellerName ||
    offer?.storeName ||
    offer?.merchant?.name ||
    offer?.merchant?.storeName ||
    "Nearby merchant"
  );
}

function getOfferLocation(offer) {
  return (
    offer?.address ||
    offer?.shopAddress ||
    offer?.location ||
    offer?.city ||
    offer?.merchant?.address ||
    offer?.merchant?.storeLocation ||
    ""
  );
}

function toFavoriteOfferPayload(offer) {
  return {
    offerId: getOfferId(offer),
    _id: offer?._id,
    requestId: offer?.requestId,
    bannerTitle: getOfferTitle(offer),
    title: offer?.title || offer?.bannerTitle || "",
    shopName: getOfferMerchant(offer),
    merchantName: offer?.merchantName || offer?.merchant?.name || "",
    location: getOfferLocation(offer),
    imageUrl: getOfferImage(offer),
    discountedPrice:
      offer?.discountedPrice || offer?.offerPrice || offer?.salePrice || offer?.finalPrice,
    originalPrice: offer?.originalPrice || offer?.mrp || offer?.price || offer?.regularPrice,
    endDate: offer?.endDate || offer?.validTo || null,
    offerType: offer?.bannerCategory || offer?.offerType || offer?.category || "",
    description: offer?.description || offer?.bannerDescription || "",
    rawOffer: offer,
    createdAt: offer?.createdAt || new Date().toISOString(),
  };
}

async function getAuthHeaders() {
  try {
    const token = await getValidToken();
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  } catch {
    // Guest user — no token available
    return null;
  }
}

async function fetchWithAuth(url, options = {}) {
  const headers = await getAuthHeaders();
  if (!headers) return null;
  return fetch(url, { headers, ...options });
}

async function getLocalFavoriteOffers() {
  try {
    const key = await getFavoritesStorageKey();
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { }
  return [];
}

async function getFavoriteOffers() {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/users/wishlist`);
    if (response?.ok) {
      const json = await response.json();
      if (Array.isArray(json?.data)) {
        // Map various server wishlist shapes into a consistent favorite-offer payload
        const mapped = json.data
          .map((item) => {
            const candidate = item?.rawOffer || item?.offer || item?.item || item;
            // If candidate looks like an offer/promotion, convert to favorite payload
            // Only treat this as an offer if it clearly has an offer identifier
            const promoType = (candidate?.promotionType || candidate?.promoTag || candidate?.type || "").toString().toLowerCase();
            if (
              candidate?.offerId ||
              candidate?.requestId ||
              item?._type === 'offer' ||
              promoType === 'offer' ||
              promoType.includes('offer')
            ) {
              return toFavoriteOfferPayload(candidate);
            }
            return null;
          })
          .filter(Boolean);

        if (mapped.length) {
          await saveFavoriteOffers(mapped);
          return mapped;
        }

        // Fallback: keep items that explicitly declare offer identifiers
        const fallback = json.data.filter(
          (item) => item._type === "offer" || Boolean(item.offerId) || Boolean(item.requestId)
        );
        if (fallback.length) {
          await saveFavoriteOffers(fallback);
          return fallback;
        }
      }
    }
  } catch (error) {
    console.warn("Favorite offers fetch failed:", error?.message || error);
  }

  return await getLocalFavoriteOffers();
}

async function saveFavoriteOffers(items) {
  const key = await getFavoritesStorageKey();
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function getFavoriteIds() {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/users/wishlist/ids`);
    if (response?.ok) {
      const json = await response.json();
      if (Array.isArray(json?.data)) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn("Favorite ids fetch failed:", error?.message || error);
  }

  const items = await getFavoriteOffers();
  return items
    .map((item) => {
      const candidateIds = [item?._id, item?.offerId, item?.requestId];
      const validId = candidateIds.find((value) => isMongoObjectId(value));
      return String(validId || item?._id || item?.offerId || item?.requestId || "");
    })
    .filter(Boolean);
}

async function isFavoriteOfferId(offerId) {
  if (!offerId) return false;
  const ids = await getFavoriteIds();
  return ids.some((id) => String(id) === String(offerId));
}

async function toggleFavoriteOffer(offer) {
  const offerId = getOfferId(offer);
  if (!offerId) {
    throw new Error("Offer id not available");
  }

  const response = await fetchWithAuth(`${BASE_URL}/users/wishlist/${encodeURIComponent(offerId)}`, {
    method: "POST",
  });

  if (response?.ok) {
    try {
      const json = await response.json();
      const isFavorite = Boolean(json?.data?.added);
      const items = await getFavoriteOffers();
      return { isFavorite, items };
    } catch (error) {
      console.warn("Favorite offer toggle parse failed:", error?.message || error);
    }
  }

  const items = await getFavoriteOffers();
  const exists = items.some((item) => String(item.offerId || item._id || item.requestId) === String(offerId));
  if (exists) {
    const updated = items.filter((item) => String(item.offerId || item._id || item.requestId) !== String(offerId));
    await saveFavoriteOffers(updated);
    return { isFavorite: false, items: updated };
  }

  const updated = [
    toFavoriteOfferPayload(offer),
    ...items.filter((item) => String(item.offerId || item._id || item.requestId) !== String(offerId)),
  ];
  await saveFavoriteOffers(updated);
  return { isFavorite: true, items: updated };
}

export { getOfferId, getFavoriteOffers, getLocalFavoriteOffers, isFavoriteOfferId, toggleFavoriteOffer };
