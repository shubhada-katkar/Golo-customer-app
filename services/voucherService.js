import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

const normalizeBaseUrl = () => String(BASE_URL || "").replace(/\/+$/, "");

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("customerToken");
  return token || "";
};

const parseErrorMessage = (payload, fallbackMessage) => {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return fallbackMessage;
};

const authorizedFetch = async (path, options = {}, fallbackMessage = "Request failed") => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Please login to continue");
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

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(parseErrorMessage(payload, fallbackMessage));
  }

  return payload;
};

export const claimOfferVoucher = async (offerId, metadata = {}) => {
  if (!offerId) {
    throw new Error("Offer id is required");
  }

  const body = { offerId };
  if (typeof metadata.latitude === "number") {
    body.latitude = Number(metadata.latitude);
  }
  if (typeof metadata.longitude === "number") {
    body.longitude = Number(metadata.longitude);
  }
  if (metadata.location) {
    body.location = String(metadata.location).trim();
  }

  const headers = {};
  if (metadata.age !== undefined && metadata.age !== null) {
    headers["X-Customer-Age"] = String(metadata.age);
  }
  if (metadata.gender) {
    headers["X-Customer-Gender"] = String(metadata.gender).trim();
  }

  const payload = await authorizedFetch(
    "/vouchers/claim",
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
    "Unable to claim this offer"
  );

  return payload?.data || null;
};

export const fetchMyVouchers = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.status) params.set("status", String(options.status));

  const query = params.toString();
  const payload = await authorizedFetch(
    `/vouchers/my-vouchers${query ? `?${query}` : ""}`,
    { method: "GET" },
    "Unable to load claimed vouchers"
  );

  return payload?.data || [];
};

const normalizeClaimedOffer = (item) => ({
  ...item,
  id: item?.id || item?._id || null,
  title: item?.title || item?.offerTitle || item?.bannerTitle || "",
  image: item?.image || item?.offerImage || item?.imageUrl || null,
  merchantName:
    item?.merchantName ||
    item?.shopName ||
    item?.businessName ||
    item?.storeName ||
    "",
  claimedAt: item?.claimedAt || item?.createdAt || null,
});

export const fetchMyClaimedOffers = async (options = {}) => {
  const limit = Number(options?.limit) || 50;
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  try {
    const query = params.toString();
    const payload = await authorizedFetch(
      `/vouchers/my-claimed-offers${query ? `?${query}` : ""}`,
      { method: "GET" },
      "Unable to load claimed offers"
    );

    const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return list.map(normalizeClaimedOffer);
  } catch (error) {
    const vouchers = await fetchMyVouchers({ page: 1, limit });
    return (Array.isArray(vouchers) ? vouchers : []).map(normalizeClaimedOffer);
  }
};

export const fetchVoucherById = async (voucherId) => {
  if (!voucherId) {
    throw new Error("Voucher id is required");
  }

  const payload = await authorizedFetch(
    `/vouchers/${encodeURIComponent(voucherId)}`,
    { method: "GET" },
    "Unable to fetch voucher details"
  );

  return payload?.data || null;
};

export const submitOfferReview = async (voucherId, payload = {}) => {
  if (!voucherId) {
    throw new Error("Voucher id is required to submit review");
  }

  const reviewPayload = {
    rating: Number(payload.rating) || 5,
    content: String(payload.content || "").trim(),
  };

  if (!reviewPayload.content) {
    throw new Error("Please enter review content");
  }

  const result = await authorizedFetch(
    `/reviews/vouchers/${encodeURIComponent(voucherId)}`,
    {
      method: "POST",
      body: JSON.stringify(reviewPayload),
    },
    "Unable to submit review"
  );

  return result?.data || null;
};

export const findVoucherForOffer = async (offerId) => {
  if (!offerId) {
    return null;
  }

  const maxPages = 10;
  const limit = 100;

  for (let page = 1; page <= maxPages; page += 1) {
    const vouchers = await fetchMyVouchers({ page, limit });
    if (!Array.isArray(vouchers) || vouchers.length === 0) {
      break;
    }

    const match = vouchers.find(
      (voucher) => String(voucher?.offerId) === String(offerId)
    );
    if (match) {
      return match;
    }

    if (vouchers.length < limit) {
      break;
    }
  }

  return null;
};

export default {
  claimOfferVoucher,
  fetchMyClaimedOffers,
  fetchMyVouchers,
  fetchVoucherById,
  findVoucherForOffer,
  submitOfferReview,
};
