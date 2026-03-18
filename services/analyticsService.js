import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

function normalizeBaseUrl() {
  return (BASE_URL || "").replace(/\/+$/, "");
}

async function getToken() {
  const token = await AsyncStorage.getItem("customerToken");
  return token || "";
}

async function authorizedFetch(path, options = {}) {
  const token = await getToken();
  if (!token) {
    throw new Error("Please login to view analytics");
  }

  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      "Analytics request failed";
    throw new Error(message);
  }

  return data?.data;
}

async function publicPost(path) {
  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    return;
  }

  try {
    await fetch(`${baseUrl}${path}`, { method: "POST" });
  } catch {
    // Analytics tracking should never block user actions.
  }
}

async function getMyAnalytics() {
  return authorizedFetch("/ads/analytics/me", { method: "GET" });
}

async function getAdAnalytics(adId) {
  if (!adId) {
    throw new Error("Ad id is required");
  }

  const safeAdId = encodeURIComponent(adId);
  return authorizedFetch(`/ads/${safeAdId}/analytics`, { method: "GET" });
}

async function trackAdCardClick(adId) {
  if (!adId) return;
  const safeAdId = encodeURIComponent(adId);
  await publicPost(`/ads/${safeAdId}/analytics/card-click`);
}

async function trackContactClick(adId) {
  if (!adId) return;
  const safeAdId = encodeURIComponent(adId);
  await publicPost(`/ads/${safeAdId}/analytics/contact-click`);
}

async function trackWishlistSave(adId) {
  if (!adId) return;
  const safeAdId = encodeURIComponent(adId);
  await publicPost(`/ads/${safeAdId}/analytics/wishlist-save`);
}

export {
  getMyAnalytics,
  getAdAnalytics,
  trackAdCardClick,
  trackContactClick,
  trackWishlistSave,
};
