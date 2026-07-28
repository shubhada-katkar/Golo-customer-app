import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { getValidToken } from "./authService";

function normalizeBaseUrl() {
  return (BASE_URL || "").replace(/\/+$/, "");
}

async function getToken() {
  try {
    const token = await getValidToken();
    return token || "";
  } catch {
    // Guest user or network error — return empty string
    return "";
  }
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
    console.warn("[Analytics] Base URL not configured");
    return;
  }

  try {
    const token = await getToken();
    const fullUrl = `${baseUrl}${path}`;
    console.log(`[Analytics] Tracking: POST ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });

    if (!response.ok) {
      console.warn(`[Analytics] Tracking failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.warn(`[Analytics] Response: ${text}`);
    } else {
      console.log(`[Analytics] Tracking successful: ${path}`);
    }
  } catch (error) {
    // Analytics tracking should never block user actions.
    console.error(`[Analytics] Tracking error for ${path}:`, error.message);
  }
}

async function getMyAnalytics() {
  return authorizedFetch("/ads/analytics/my", { method: "GET" });
}

async function getAdAnalytics(adId) {
  if (!adId) {
    throw new Error("Ad id is required");
  }

  const analytics = await authorizedFetch("/ads/analytics/my", { method: "GET" });
  const ad = Array.isArray(analytics?.ads)
    ? analytics.ads.find((item) =>
      String(item.adId) === String(adId) ||
      String(item.id) === String(adId) ||
      String(item._id) === String(adId)
    )
    : null;

  if (!ad) {
    throw new Error("Ad analytics not found");
  }

  const adViews = Number(ad?.views ?? ad?.uniqueVisitors ?? ad?.viewHistory?.length ?? 0);
  const adUniqueVisitors = Number(ad?.uniqueVisitors ?? ad?.views ?? ad?.viewHistory?.length ?? 0);
  const adContactClicks = Number(ad?.contactClicks ?? 0);
  const adWishlistCount = Number(ad?.wishlistCount ?? 0);
  const adCtr = Number(ad?.clickThroughRate ?? 0);
  const adWishlistRate = Number(ad?.wishlistRate ?? 0);

  return {
    ...analytics,
    ad,
    stats: {
      clicks: adViews,
      visitors: adUniqueVisitors,
      contacts: adContactClicks,
      wishlist: adWishlistCount,
    },
    rates: {
      ctr: adCtr,
      visitorsRate: 0,
      wishlistRate: adWishlistRate,
    },
  };
}

async function getPublicAdAnalytics(adId) {
  if (!adId) {
    throw new Error("Ad id is required");
  }

  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    throw new Error("API URL is not configured");
  }

  const safeAdId = encodeURIComponent(adId);
  const response = await fetch(`${baseUrl}/ads/${safeAdId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      "Failed to fetch ad analytics";
    throw new Error(message);
  }

  return data?.data;
}

async function trackAdCardClick(adId) {
  if (!adId) {
    console.warn('[Analytics] trackAdCardClick: adId is empty');
    return;
  }
  console.log('[Analytics] trackAdCardClick called with:', adId);
  // Ad card clicks are counted via the public ad detail endpoint for authenticated users.
  // The backend tracks unique visitors on GET /ads/:adId, so no separate analytics route exists.
}

async function trackContactClick(adId) {
  if (!adId) {
    console.warn('[Analytics] trackContactClick: adId is empty');
    return;
  }
  console.log('[Analytics] trackContactClick called with:', adId);
  const safeAdId = encodeURIComponent(adId);
  await publicPost(`/ads/${safeAdId}/click`);
}

async function trackWishlistSave(adId) {
  if (!adId) {
    console.warn('[Analytics] trackWishlistSave: adId is empty');
    return;
  }
  console.log('[Analytics] trackWishlistSave called with:', adId);
  const safeAdId = encodeURIComponent(adId);
  await publicPost(`/ads/${safeAdId}/analytics/wishlist-save`);
}

async function deleteAd(adId) {
  if (!adId) {
    throw new Error('Ad ID is required');
  }

  const token = await getToken();
  if (!token) {
    throw new Error("Please login to delete an ad");
  }

  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  const safeAdId = encodeURIComponent(adId);
  const response = await fetch(`${baseUrl}/ads/${safeAdId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      "Failed to delete ad";
    throw new Error(message);
  }

  return data?.data;
}

async function updateAd(adId, payload = {}) {
  if (!adId) {
    throw new Error("Ad ID is required");
  }

  return authorizedFetch(`/ads/${encodeURIComponent(adId)}`, {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

export {
  getMyAnalytics,
  getAdAnalytics,
  getPublicAdAnalytics,
  trackAdCardClick,
  trackContactClick,
  trackWishlistSave,
  deleteAd,
  updateAd,
};
