import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

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

export const claimOfferVoucher = async (offerId) => {
  if (!offerId) {
    throw new Error("Offer id is required");
  }

  const payload = await authorizedFetch(
    "/vouchers/claim",
    {
      method: "POST",
      body: JSON.stringify({ offerId }),
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
  id: item?.id || item?._id || null,
  title: item?.title || item?.offerTitle || "",
  image: item?.image || item?.offerImage || null,
  merchantName: item?.merchantName || "",
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
};
