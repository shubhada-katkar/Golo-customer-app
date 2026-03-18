import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "favoriteAds";

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

async function getFavoriteAds() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveFavoriteAds(items) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

async function isFavoriteAdId(adId) {
  if (!adId) return false;
  const items = await getFavoriteAds();
  return items.some((item) => String(item.adId) === String(adId));
}

async function toggleFavoriteAd(ad) {
  const adId = getAdId(ad);
  if (!adId) {
    throw new Error("Ad id not available");
  }

  const items = await getFavoriteAds();
  const exists = items.some((item) => String(item.adId) === String(adId));

  if (exists) {
    const updated = items.filter((item) => String(item.adId) !== String(adId));
    await saveFavoriteAds(updated);
    return { isFavorite: false, items: updated };
  }

  const updated = [toFavoritePayload(ad), ...items.filter((item) => String(item.adId) !== String(adId))];
  await saveFavoriteAds(updated);
  return { isFavorite: true, items: updated };
}

export {
  getAdId,
  getFavoriteAds,
  isFavoriteAdId,
  toggleFavoriteAd,
};