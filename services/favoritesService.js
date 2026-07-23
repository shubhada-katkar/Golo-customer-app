import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

const FAVORITES_KEY_PREFIX = "favoriteAds";

async function getFavoritesStorageKey() {
  const customerId = await AsyncStorage.getItem("customerId");
  const scope = customerId ? String(customerId) : "guest";
  return `${FAVORITES_KEY_PREFIX}:${scope}`;
}

function getAdId(ad) {
  return String(ad?.adId || ad?._id || "");
}

function toFavoritePayload(ad) {
  return {
    adId: getAdId(ad),
    _id: ad?._id,
    title: ad?.title || "",
    description: ad?.description || "",
    price: ad?.price,
    location: ad?.location || ad?.city || "",
    image: Array.isArray(ad?.images) ? ad.images[0] || null : ad?.image || null,
    createdAt: ad?.createdAt || new Date().toISOString(),
  };
}

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("customerToken");
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function fetchWithAuth(url, options = {}) {
  const headers = await getAuthHeaders();
  if (!headers) return null;
  return fetch(url, { headers, ...options });
}

async function getFavoriteAds() {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/users/wishlist`);
    if (response?.ok) {
      const json = await response.json();
      if (Array.isArray(json?.data)) {
        return json.data.filter((item) => item._type === "ad" || (!item._type && Boolean(item.adId)));
      }
    }
  } catch (error) {
    console.warn("Favorite ads fetch failed:", error?.message || error);
  }

  const key = await getFavoritesStorageKey();
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
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

  const items = await getFavoriteAds();
  return items.map((item) => String(item.adId || item._id || "")).filter(Boolean);
}

async function saveFavoriteAds(items) {
  const key = await getFavoritesStorageKey();
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function isFavoriteAdId(adId) {
  if (!adId) return false;
  const ids = await getFavoriteIds();
  return ids.some((id) => String(id) === String(adId));
}

async function toggleFavoriteAd(ad) {
  const adId = getAdId(ad);
  if (!adId) {
    throw new Error("Ad id not available");
  }

  const response = await fetchWithAuth(`${BASE_URL}/users/wishlist/${encodeURIComponent(adId)}`, {
    method: "POST",
  });

  if (response?.ok) {
    try {
      const json = await response.json();
      const isFavorite = Boolean(json?.data?.added);
      const items = await getFavoriteAds();
      return { isFavorite, items };
    } catch (error) {
      console.warn("Favorite toggle parse failed:", error?.message || error);
    }
  }

  const items = await getFavoriteAds();
  const exists = items.some((item) => String(item.adId || item._id) === String(adId));
  if (exists) {
    const updated = items.filter((item) => String(item.adId || item._id) !== String(adId));
    await saveFavoriteAds(updated);
    return { isFavorite: false, items: updated };
  }

  const updated = [toFavoritePayload(ad), ...items.filter((item) => String(item.adId || item._id) !== String(adId))];
  await saveFavoriteAds(updated);
  return { isFavorite: true, items: updated };
}

export {
  getAdId,
  getFavoriteAds,
  isFavoriteAdId,
  toggleFavoriteAd,
};
