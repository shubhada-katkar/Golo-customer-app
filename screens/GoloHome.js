import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView
} from "react-native";
import { Feather, Ionicons, EvilIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar2 from "../components/Topbar2";
import GoloBottom from "../components/GoloBottom";
import RatingsBox from "../components/RatingsBox";
import { fetchAllOffers } from "../services/offersService";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

const CATEGORY_ICONS = {
    "Food & Restaurants": "restaurant-outline",
    "Home Services": "construct-outline",
    "Beauty & Wellness": "flower-outline",
    "Healthcare & Medical": "medkit-outline",
    "Hotels & Accommodation": "bed-outline",
    "Shopping & Retail": "bag-handle-outline",
    "Education & Training": "school-outline",
    "Real Estate": "home-outline",
    "Events & Entertainment": "musical-notes-outline",
    "Professional Services": "briefcase-outline",
    "Automotive Services": "car-outline",
    "Home Improvement": "hammer-outline",
    "Fitness & Sports": "barbell-outline",
    "Daily Needs & Utilities": "cart-outline",
    "Local Businesses & Vendors": "storefront-outline",
};

const STRIP_CATEGORIES = [
    { label: "Food & Restaurants", displayLabel: "Food", icon: "restaurant-outline" },
    { label: "Home Services", displayLabel: "Home services", icon: "construct-outline" },
    { label: "Beauty & Wellness", displayLabel: "Beauty", icon: "flower-outline" },
    { label: "Healthcare & Medical", displayLabel: "Healthcare", icon: "medkit-outline" },
];

const MAIN_STORE_CATEGORIES = [
    "Food & Restaurants",
    "Home Services",
    "Beauty & Wellness",
    "Healthcare & Medical",
    "Hotels & Accommodation",
    "Shopping & Retail",
    "Education & Training",
    "Real Estate",
    "Events & Entertainment",
    "Professional Services",
    "Automotive Services",
    "Home Improvement",
    "Fitness & Sports",
    "Daily Needs & Utilities",
    "Local Businesses & Vendors",
];

const CATEGORY_COLORS = {
    "Food & Restaurants": { bg: "#d6efe2", dark: "#1c7a4d" },
    "Home Services": { bg: "#fde3cf", dark: "#c2641a" },
    "Beauty & Wellness": { bg: "#ede1fb", dark: "#7b3fc4" },
    "Healthcare & Medical": { bg: "#d2f3ea", dark: "#0f8a5f" },
    "Hotels & Accommodation": { bg: "#fdf2cf", dark: "#a8821a" },
    "Shopping & Retail": { bg: "#fbdfe2", dark: "#c23b4d" },
    "Education & Training": { bg: "#ece2fb", dark: "#6b3fc4" },
    "Real Estate": { bg: "#d6f5ec", dark: "#117a5a" },
    "Events & Entertainment": { bg: "#fdeccb", dark: "#b3781a" },
    "Professional Services": { bg: "#e1eaf0", dark: "#3c6685" },
    "Automotive Services": { bg: "#fbdfe2", dark: "#c23b4d" },
    "Home Improvement": { bg: "#fde3cf", dark: "#c2641a" },
    "Fitness & Sports": { bg: "#fde3cf", dark: "#c2641a" },
    "Daily Needs & Utilities": { bg: "#d6efe2", dark: "#1c7a4d" },
    "Local Businesses & Vendors": { bg: "#d6e7fa", dark: "#1d5fa3" },
};

const DEFAULT_CATEGORY_COLOR = { bg: "#f0f0f0", dark: "#555555" };

const CATEGORY_ALIASES = {
    "Food & Dining": "Food & Restaurants",
    Beauty: "Beauty & Wellness",
    Healthcare: "Healthcare & Medical",
};

const normalizeCategoryText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");

const getCanonicalCategory = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    const trimmed = value.trim();
    return CATEGORY_ALIASES[trimmed] || trimmed;
};

const categoryMatches = (offer, selectedCategory) => {
    if (!selectedCategory) {
        return true;
    }

    const selected = normalizeCategoryText(getCanonicalCategory(selectedCategory));

    const offerCategoryCandidates = [
        offer?.bannerCategory,
        offer?.category,
        offer?.offerType,
        offer?.type,
        offer?.merchant?.category,
        offer?.merchant?.storeCategory,
    ];

    return offerCategoryCandidates.some((candidate) => {
        const canonical = getCanonicalCategory(candidate);
        return normalizeCategoryText(canonical) === selected;
    });
};

const resolveImageUrl = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
    return `${BASE_URL}/${trimmed}`;
};

const getOfferImage = (item) =>
    item?.imageUrl ||
    item?.selectedProducts?.[0]?.imageUrl ||
    item?.products?.[0]?.images?.[0] ||
    item?.products?.[0]?.image?.url ||
    "";

const getOfferTitle = (item) => item?.bannerTitle || item?.title || "Untitled Offer";

const getOfferSubtitle = (item) =>
    item?.shopName ||
    item?.merchantName ||
    item?.businessName ||
    item?.sellerName ||
    item?.storeName ||
    item?.merchant?.name ||
    item?.merchant?.storeName ||
    item?.selectedProducts?.[0]?.productName ||
    item?.selectedProducts?.[0]?.name ||
    "Nearby merchant";

const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `Rs ${numericValue}` : String(value);
};

const getOfferDisplayPrice = (item) => {
    const directPrice = formatPrice(
        item?.displayPrice ||
        item?.discountedPrice ||
        item?.offerPrice ||
        item?.salePrice ||
        item?.finalPrice ||
        item?.price
    );

    if (directPrice) {
        return directPrice;
    }

    const selectedProducts = Array.isArray(item?.selectedProducts)
        ? item.selectedProducts
        : [];

    const lowestProductPrice = selectedProducts
        .map((product) =>
            formatPrice(
                product?.offerPrice ||
                product?.discountedPrice ||
                product?.salePrice ||
                product?.finalPrice ||
                product?.displayPrice ||
                product?.price
            )
        )
        .filter(Boolean)
        .map((value) => Number(String(value).replace(/[^0-9.-]/g, "")))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b)[0];

    return lowestProductPrice !== undefined ? formatPrice(lowestProductPrice) : null;
};

const computeStartingPrice = (products = [], fallback = 0) => {
    const fallbackValue = Number(fallback) || 0;
    if (fallbackValue > 0) return fallbackValue;
    if (!Array.isArray(products) || products.length === 0) return fallbackValue;
    const values = products
        .map((item) => Number(item?.offerPrice || item?.discountedPrice || item?.salePrice || item?.price) || 0)
        .filter((price) => price > 0);
    if (!values.length) return fallbackValue;
    return values.reduce((sum, price) => sum + price, 0);
};

const computeBestDiscountPercent = (products = [], fallback = 0) => {
    const fallbackValue = Number(fallback) || 0;
    if (fallbackValue > 0) return Math.max(0, Math.round(fallbackValue));
    return Math.round(
        (Array.isArray(products) ? products : []).reduce((best, product) => {
            const original = Number(product?.originalPrice || product?.mrp) || 0;
            const offer = Number(product?.offerPrice || product?.discountedPrice || product?.salePrice || product?.price) || 0;
            if (original <= 0 || offer < 0 || offer >= original) return best;
            const discount = ((original - offer) / original) * 100;
            return Math.max(best, discount);
        }, 0)
    );
};

const normalizeNearbyOffer = (row) => {
    const selectedProducts = Array.isArray(row?.selectedProducts)
        ? row.selectedProducts
        : Array.isArray(row?.products)
            ? row.products
            : [];
    const displayPrice = computeStartingPrice(
        selectedProducts,
        row?.displayPrice || row?.totalPrice || row?.price
    );
    const discountPercent = computeBestDiscountPercent(
        selectedProducts,
        row?.discountPercent
    );

    return {
        ...row,
        selectedProducts,
        displayPrice,
        discountPercent,
    };
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const getDistanceText = (value) => {
    const distance = Number(value);
    if (!Number.isFinite(distance) || distance < 0) {
        return null;
    }

    return distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`;
};

const isOfferCurrentlyActive = (offer) => {
    const status = String(offer?.status || "").toLowerCase();
    if (status === "expired") return false;

    const now = Date.now();
    const start = offer?.startDate ? new Date(offer.startDate).getTime() : null;
    const end = offer?.endDate ? new Date(offer.endDate).getTime() : null;

    if (start !== null && now < start) {
        return false;
    }
    if (end !== null && now > end) {
        return false;
    }

    return true;
};

const offerTypeMatches = (offer, selectedOfferTypesStr) => {
    if (!selectedOfferTypesStr) {
        return true;
    }

    const selectedTypes = selectedOfferTypesStr
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    if (selectedTypes.length === 0) {
        return true;
    }

    const offerType = String(offer?.bannerCategory || offer?.offerType || offer?.category || "").toLowerCase();
    const title = String(offer?.title || offer?.bannerTitle || "").toLowerCase();
    const blob = `${title} ${offerType}`;

    return selectedTypes.some((type) => {
        if (!type) return false;
        if (offerType === type) return true;
        if (type === 'flat discount') return blob.includes('flat') || blob.includes('discount');
        if (type.includes('bogo') || type.includes('buy one get')) {
            return blob.includes('bogo') || blob.includes('buy 1 get 1') || blob.includes('buy one get one');
        }
        if (type === 'percentage off' || type.includes('percent') || type.includes('%')) {
            return blob.includes('%') || blob.includes('percent') || blob.includes('percentage');
        }
        return blob.includes(type);
    });
};

const DEFAULT_RADIUS_KM = 50;

export default function GoloHome({ route }) {
    const navigation = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState(null);

    React.useEffect(() => {
        if (route?.params?.category) {
            setSelectedCategory(route.params.category);
            navigation.setParams({ category: undefined });
        }
    }, [route?.params?.category]);

    React.useEffect(() => {
        if (route?.params?.searchQuery !== undefined) {
            const q = String(route.params.searchQuery || "").trim();
            setSearchInput(q);
            setSearchQuery(q);
            navigation.setParams({ searchQuery: undefined });
        }
    }, [route?.params?.searchQuery]);

    const [allCategoriesModalOpen, setAllCategoriesModalOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [gpsPlaceName, setGpsPlaceName] = useState("");
    const [locationPlaceName, setLocationPlaceName] = useState("");
    const scrollRef = useRef(null);
    const [radius, setRadius] = useState(DEFAULT_RADIUS_KM);
    const [selectedOfferTypes, setSelectedOfferTypes] = useState("");

    // All offers pool used exclusively for search (no location filter)
    const [allOffersForSearch, setAllOffersForSearch] = useState([]);
    const [searchOffersLoading, setSearchOffersLoading] = useState(false);

    const [offersLimit, setOffersLimit] = useState(6);
    const [merchantsLimit, setMerchantsLimit] = useState(6);
    const [productsLimit, setProductsLimit] = useState(6);

    // ─── Unified search state (matching website) ──────────────
    const [unifiedMerchants, setUnifiedMerchants] = useState([]);
    const [unifiedProducts, setUnifiedProducts] = useState([]);
    const [unifiedOffers, setUnifiedOffers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [merchantPage, setMerchantPage] = useState(1);
    const [productPage, setProductPage] = useState(1);
    const [offerPage, setOfferPage] = useState(1);
    const [hasMoreMerchants, setHasMoreMerchants] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const [hasMoreOffers, setHasMoreOffers] = useState(false);
    const [loadingMoreOffers, setLoadingMoreOffers] = useState(false);
    const [loadingMoreMerchants, setLoadingMoreMerchants] = useState(false);
    const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
    const searchSeqRef = useRef(0);

    useEffect(() => {
        setOffersLimit(6);
        setMerchantsLimit(6);
        setProductsLimit(6);
    }, [searchQuery]);

    // Fetch unified search results from backend API when searchQuery changes
    useEffect(() => {
        const queryTrimmed = String(searchQuery || "").trim();
        if (!queryTrimmed || !BASE_URL) {
            setUnifiedMerchants([]);
            setUnifiedProducts([]);
            setUnifiedOffers([]);
            setSearchLoading(false);
            setHasMoreMerchants(false);
            setHasMoreProducts(false);
            setHasMoreOffers(false);
            return;
        }

        const fetchUnified = async () => {
            const seq = ++searchSeqRef.current;
            setSearchLoading(true);
            setMerchantPage(1);
            setProductPage(1);
            setOfferPage(1);

            try {
                const url = `${BASE_URL}/search/unified?q=${encodeURIComponent(queryTrimmed)}&type=all&limit=16&page=1`;
                const response = await fetch(url);
                const res = await response.json();

                if (seq !== searchSeqRef.current) return;

                if (res?.success && res?.data) {
                    const merchants = res.data.merchants || [];
                    const products = res.data.products || [];
                    const offers = (res.data.offers || []).map(normalizeNearbyOffer);

                    setUnifiedMerchants(merchants);
                    setUnifiedProducts(products);
                    setUnifiedOffers(offers);

                    setHasMoreMerchants(merchants.length === 16);
                    setHasMoreProducts(products.length === 16);
                    setHasMoreOffers(offers.length === 16);
                } else {
                    setUnifiedMerchants([]);
                    setUnifiedProducts([]);
                    setUnifiedOffers([]);
                    setHasMoreMerchants(false);
                    setHasMoreProducts(false);
                    setHasMoreOffers(false);
                }
            } catch (err) {
                if (seq !== searchSeqRef.current) return;
                console.error("Unified search error:", err);
                setUnifiedMerchants([]);
                setUnifiedProducts([]);
                setUnifiedOffers([]);
            } finally {
                if (seq === searchSeqRef.current) {
                    setSearchLoading(false);
                }
            }
        };

        fetchUnified();
    }, [searchQuery]);

    const loadMoreOffers = async () => {
        const queryTrimmed = String(searchQuery || "").trim();
        if (!queryTrimmed || loadingMoreOffers || !hasMoreOffers || !BASE_URL) return;

        setLoadingMoreOffers(true);
        try {
            const nextPage = offerPage + 1;
            const url = `${BASE_URL}/search/unified?q=${encodeURIComponent(queryTrimmed)}&type=offers&limit=16&page=${nextPage}`;
            const response = await fetch(url);
            const res = await response.json();

            if (res?.success && res?.data?.offers) {
                const newOffers = (res.data.offers || []).map(normalizeNearbyOffer);
                setUnifiedOffers(prev => {
                    const combined = [...prev, ...newOffers];
                    const seen = new Set();
                    return combined.filter(o => {
                        const id = o.offerId || o.requestId || o._id || o.id;
                        if (!id) return true;
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                });
                setOfferPage(nextPage);
                setHasMoreOffers(newOffers.length === 16);
            } else {
                setHasMoreOffers(false);
            }
        } catch (e) {
            console.error("Load more offers error:", e);
        } finally {
            setLoadingMoreOffers(false);
        }
    };

    const loadMoreMerchants = async () => {
        const queryTrimmed = String(searchQuery || "").trim();
        if (!queryTrimmed || loadingMoreMerchants || !hasMoreMerchants || !BASE_URL) return;

        setLoadingMoreMerchants(true);
        try {
            const nextPage = merchantPage + 1;
            const url = `${BASE_URL}/search/unified?q=${encodeURIComponent(queryTrimmed)}&type=merchants&limit=16&page=${nextPage}`;
            const response = await fetch(url);
            const res = await response.json();

            if (res?.success && res?.data?.merchants) {
                const newMerchants = res.data.merchants || [];
                setUnifiedMerchants(prev => {
                    const combined = [...prev, ...newMerchants];
                    const seen = new Set();
                    return combined.filter(m => {
                        const id = m._id || m.userId || m.merchantId;
                        if (!id) return true;
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                });
                setMerchantPage(nextPage);
                setHasMoreMerchants(newMerchants.length === 16);
            } else {
                setHasMoreMerchants(false);
            }
        } catch (e) {
            console.error("Load more merchants error:", e);
        } finally {
            setLoadingMoreMerchants(false);
        }
    };

    const loadMoreProducts = async () => {
        const queryTrimmed = String(searchQuery || "").trim();
        if (!queryTrimmed || loadingMoreProducts || !hasMoreProducts || !BASE_URL) return;

        setLoadingMoreProducts(true);
        try {
            const nextPage = productPage + 1;
            const url = `${BASE_URL}/search/unified?q=${encodeURIComponent(queryTrimmed)}&type=products&limit=16&page=${nextPage}`;
            const response = await fetch(url);
            const res = await response.json();

            if (res?.success && res?.data?.products) {
                const newProducts = res.data.products || [];
                setUnifiedProducts(prev => {
                    const combined = [...prev, ...newProducts];
                    const seen = new Set();
                    return combined.filter(p => {
                        const id = p._id || p.productId;
                        if (!id) return true;
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                });
                setProductPage(nextPage);
                setHasMoreProducts(newProducts.length === 16);
            } else {
                setHasMoreProducts(false);
            }
        } catch (e) {
            console.error("Load more products error:", e);
        } finally {
            setLoadingMoreProducts(false);
        }
    };

    // Location editing state
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const locationInputRef = useRef(null);
    const debounceTimer = useRef(null);

    const categoryIconMap = {
        "Food & Restaurants": "restaurant-outline",
        "Home Services": "construct-outline",
        "Beauty & Wellness": "flower-outline",
        "Healthcare & Medical": "medkit-outline",
        "Hotels & Accommodation": "bed-outline",
        "Shopping & Retail": "bag-handle-outline",
        "Education & Training": "school-outline",
        "Real Estate": "home-outline",
        "Events & Entertainment": "musical-notes-outline",
        "Professional Services": "briefcase-outline",
        "Automotive Services": "car-outline",
        "Home Improvement": "hammer-outline",
        "Fitness & Sports": "barbell-outline",
        "Daily Needs & Utilities": "cart-outline",
        "Local Businesses & Vendors": "storefront-outline",
    };

    const categories = MAIN_STORE_CATEGORIES.map((label) => ({
        label,
        icon: categoryIconMap[label] || "pricetags-outline",
    }));

    const sortedCategories = categories;

    useEffect(() => {
        let isMounted = true;

        const getUserLocation = async () => {
            try {
                setLocationStatus("loading");
                setLocationPlaceName("");

                const { status } = await Location.requestForegroundPermissionsAsync();

                if (!isMounted) {
                    return;
                }

                if (status !== "granted") {
                    setLocationStatus("denied");
                    return;
                }

                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                if (!isMounted) {
                    return;
                }

                const coords = {
                    lat: current?.coords?.latitude,
                    lng: current?.coords?.longitude,
                };

                setUserCoordinates(coords);
                setGpsCoordinates(coords);

                try {
                    const geocode = await Location.reverseGeocodeAsync({
                        latitude: coords.lat,
                        longitude: coords.lng,
                    });

                    if (!isMounted) {
                        return;
                    }

                    const place = geocode?.[0] || {};
                    const parts = [
                        place?.name !== place?.street ? place?.name : null,
                        place?.district,
                        place?.streetNumber,
                        place?.street,
                        place?.city,
                        place?.subregion !== place?.city ? place?.subregion : null,
                        place?.region,
                        place?.postalCode,
                        place?.country,
                    ].filter(Boolean);

                    const cleanParts = parts.map(p => String(p).trim()).filter(Boolean);
                    const uniqueParts = [];
                    for (const part of cleanParts) {
                        if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
                            uniqueParts.push(part);
                        }
                    }

                    const resolvedName = uniqueParts.join(", ") || "your current area";
                    setLocationPlaceName(resolvedName);
                    setGpsPlaceName(resolvedName);
                } catch (geocodeError) {
                    if (!isMounted) {
                        return;
                    }
                    setLocationPlaceName("your current area");
                    setGpsPlaceName("your current area");
                }

                setLocationStatus("granted");
            } catch (locationError) {
                if (!isMounted) {
                    return;
                }
                setLocationStatus("denied");
                console.error("Location permission/fetch error:", locationError);
            }
        };

        getUserLocation();

        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch rich address suggestions via OpenStreetMap Nominatim
    // — returns neighbourhood/area-level results (e.g. "Laxmipuri, Kolhapur, Maharashtra")
    const fetchLocationSuggestions = useCallback(async (query) => {
        const trimmed = (query || "").trim();
        if (!trimmed) {
            setLocationSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        setSuggestionsLoading(true);
        try {
            const params = new URLSearchParams({
                q: trimmed,
                format: "json",
                addressdetails: "1",
                limit: "8",
                "accept-language": "en",
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                {
                    headers: {
                        "User-Agent": "GoloCustomerApp/1.0",
                        "Accept": "application/json",
                    },
                }
            );

            if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

            const data = await response.json();

            const suggestions = (data || []).map((item, idx) => {
                const addr = item.address || {};
                const parts = [
                    addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.building || addr.place,
                    addr.house_number,
                    addr.road || addr.pedestrian || addr.footway || addr.street,
                    addr.neighbourhood,
                    addr.suburb,
                    addr.quarter,
                    addr.city_district,
                    addr.village,
                    addr.town,
                    addr.city,
                    addr.district,
                    addr.county,
                    addr.state_district,
                    addr.state,
                    addr.postcode,
                    addr.country,
                ].filter(Boolean);

                const cleanParts = parts.map(p => String(p).trim()).filter(Boolean);
                const uniqueParts = [];
                for (const part of cleanParts) {
                    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
                        uniqueParts.push(part);
                    }
                }
                const resolvedLabel = uniqueParts.join(", ");

                return {
                    id: `${item.place_id || idx}`,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    label: resolvedLabel || item.display_name || trimmed,
                };
            });

            // Deduplicate by label
            const seen = new Set();
            const unique = suggestions.filter((s) => {
                if (seen.has(s.label)) return false;
                seen.add(s.label);
                return true;
            });

            setLocationSuggestions(unique);
        } catch (err) {
            console.error("Location suggestion error:", err);
            setLocationSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }
    }, []);

    const handleLocationQueryChange = useCallback((text) => {
        setLocationQuery(text);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        // 400ms debounce — responsive but avoids hammering Nominatim
        debounceTimer.current = setTimeout(() => {
            fetchLocationSuggestions(text);
        }, 400);
    }, [fetchLocationSuggestions]);

    const handleStartEditingLocation = useCallback(() => {
        setIsEditingLocation(true);
        setLocationQuery("");
        setLocationSuggestions([]);
        setTimeout(() => locationInputRef.current?.focus(), 100);
    }, []);

    const handleCancelEditingLocation = useCallback(() => {
        setIsEditingLocation(false);
        setLocationQuery("");
        setLocationSuggestions([]);
        Keyboard.dismiss();
    }, []);

    const handleSelectSuggestion = useCallback(async (suggestion) => {
        Keyboard.dismiss();
        setIsEditingLocation(false);
        setLocationQuery("");
        setLocationSuggestions([]);

        const newCoords = { lat: suggestion.lat, lng: suggestion.lng };
        setUserCoordinates(newCoords);
        setLocationPlaceName(suggestion.label);
        setLocationStatus("granted");
    }, []);

    const handleResetToGPS = useCallback(() => {
        if (gpsCoordinates) {
            setUserCoordinates(gpsCoordinates);
            setLocationPlaceName(gpsPlaceName);
        }
        handleCancelEditingLocation();
    }, [gpsCoordinates, gpsPlaceName, handleCancelEditingLocation]);

    const fetchOffers = React.useCallback(async () => {
        setLoading(true);

        try {
            setError("");
            const offersData = await fetchAllOffers({
                limit: 100,
                page: 1,
                radiusKm: radius,
                offerTypes: selectedOfferTypes || undefined,
                category: selectedCategory || undefined,
                lat: userCoordinates?.lat,
                lng: userCoordinates?.lng,
            });
            setOffers(offersData);
        } catch (err) {
            setOffers([]);
            setError(err?.message || "Unable to load offers right now");
            console.error("Fetch offers error:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, userCoordinates?.lat, userCoordinates?.lng, radius, selectedOfferTypes]);

    // Fetch ALL offers without location filter — used only for search results
    const fetchAllOffersForSearch = React.useCallback(async () => {
        setSearchOffersLoading(true);
        try {
            const offersData = await fetchAllOffers({
                limit: 500,
                page: 1,
                // Intentionally no lat/lng so the backend returns all offers globally
            });
            setAllOffersForSearch(offersData);
        } catch (err) {
            console.error("Fetch all offers for search error:", err);
            // Fall back to the location-filtered pool so search still works
            setAllOffersForSearch([]);
        } finally {
            setSearchOffersLoading(false);
        }
    }, []);

    // Trigger global fetch whenever user starts a search
    useEffect(() => {
        if (searchQuery) {
            fetchAllOffersForSearch();
        }
    }, [searchQuery, fetchAllOffersForSearch]);

    useFocusEffect(
        React.useCallback(() => {
            let isMounted = true;
            const loadFiltersAndFetch = async () => {
                let currentRadius = DEFAULT_RADIUS_KM;
                let currentOfferTypes = "";
                try {
                    const savedRadius = await AsyncStorage.getItem("GOLO_FILTER_RADIUS");
                    const savedOfferTypes = await AsyncStorage.getItem("GOLO_FILTER_OFFER_TYPES");

                    if (savedRadius !== null) {
                        currentRadius = Number(savedRadius);
                    }
                    if (savedOfferTypes !== null) {
                        currentOfferTypes = savedOfferTypes;
                    }
                } catch (e) {
                    console.error("Failed to load filters from AsyncStorage", e);
                }

                if (!isMounted) return;

                setRadius(currentRadius);
                setSelectedOfferTypes(currentOfferTypes);

                setLoading(true);
                try {
                    setError("");
                    const offersData = await fetchAllOffers({
                        limit: 100,
                        page: 1,
                        radiusKm: currentRadius,
                        offerTypes: currentOfferTypes || undefined,
                        category: selectedCategory || undefined,
                        lat: userCoordinates?.lat,
                        lng: userCoordinates?.lng,
                    });
                    if (isMounted) {
                        setOffers(offersData);
                    }
                } catch (err) {
                    if (isMounted) {
                        setOffers([]);
                        setError(err?.message || "Unable to load offers right now");
                    }
                    console.error("Fetch offers error:", err);
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };

            loadFiltersAndFetch();

            return () => {
                isMounted = false;
            };
        }, [selectedCategory, userCoordinates?.lat, userCoordinates?.lng])
    );

    const offerMatchesSearch = (offer, q) => {
        const needle = String(q || "").trim().toLowerCase();
        if (!needle) return true;
        const title = String(offer?.bannerTitle || offer?.title || "").toLowerCase();
        if (title.includes(needle)) return true;

        const products = Array.isArray(offer?.selectedProducts)
            ? offer.selectedProducts
            : Array.isArray(offer?.products)
                ? offer.products
                : [];

        for (let i = 0; i < products.length; i++) {
            const p = products[i] || {};
            const name = String(p?.productName || p?.name || p?.title || "").toLowerCase();
            if (name.includes(needle)) return true;
        }

        return false;
    };

    const locationLabel =
        locationStatus === "granted"
            ? locationPlaceName
                ? locationPlaceName
                : "Current location"
            : locationStatus === "loading"
                ? "Checking your location..."
                : "Tap to set location";

    const query = String(searchQuery || "").trim().toLowerCase();

    const activeOffers = offers.filter(
        (offer) =>
            isOfferCurrentlyActive(offer) &&
            categoryMatches(offer, selectedCategory) &&
            offerTypeMatches(offer, selectedOfferTypes)
    );

    // For search: use the full (non-location-filtered) pool; fall back to activeOffers
    // if the global pool hasn't loaded yet.
    const searchPool = query
        ? (allOffersForSearch.length > 0
            ? allOffersForSearch.filter(isOfferCurrentlyActive)
            : activeOffers)
        : activeOffers;

    const searchResultsOffers = [];
    const searchResultsMerchantsMap = new Map();
    const searchResultsProducts = [];

    const seenOfferIds = new Set();
    const seenProductIds = new Set();

    if (query) {
        // 1. Incorporate backend unified search offers
        unifiedOffers.forEach((offer, offerIdx) => {
            const id = offer?.requestId || offer?._id || offer?.offerId || `unified-offer-${offerIdx}`;
            if (!seenOfferIds.has(id)) {
                seenOfferIds.add(id);
                searchResultsOffers.push({
                    type: 'offer',
                    offer,
                    id,
                    sortDistance: offer?.distanceKm,
                    sortDate: offer?.createdAt || offer?.updatedAt,
                });
            }
        });

        // 2. Incorporate backend unified search merchants
        unifiedMerchants.forEach((m, mIdx) => {
            const merchantId = m.userId || m._id || `merchant-${mIdx}`;
            const merchantName = m.storeName || m.name || "Merchant";
            const merchantCategory = m.storeCategory || m.category || "";
            const merchantAddress = m.storeLocation || m.address || "";
            const merchantLogo = m.profilePhoto || m.shopPhoto || m.logo || m.imageUrl;
            const lat = Number(m.storeLocationLatitude ?? m.latitude);
            const lng = Number(m.storeLocationLongitude ?? m.longitude);
            let distanceText = null;
            if (Number.isFinite(lat) && Number.isFinite(lng) && userCoordinates?.lat && userCoordinates?.lng) {
                const dist = calculateDistanceKm(userCoordinates.lat, userCoordinates.lng, lat, lng);
                if (dist !== null) {
                    distanceText = getDistanceText(dist);
                }
            }

            searchResultsMerchantsMap.set(String(merchantId).toLowerCase(), {
                id: merchantId,
                merchantId,
                name: merchantName,
                category: merchantCategory,
                address: merchantAddress,
                logo: merchantLogo,
                distanceText,
                merchantObj: m,
            });
        });

        // 3. Incorporate backend unified search products
        unifiedProducts.forEach((prod, prodIdx) => {
            const prodId = prod._id || `unified-prod-${prodIdx}`;
            if (!seenProductIds.has(prodId)) {
                seenProductIds.add(prodId);
                searchResultsProducts.push({
                    type: 'product',
                    product: prod,
                    offer: {
                        ...prod,
                        _id: prod._id,
                        merchantId: prod.merchantId,
                        title: prod.name || prod.productName || "Product",
                        imageUrl: prod.imageUrl || (Array.isArray(prod.images) ? prod.images[0] : null),
                        displayPrice: formatPrice(prod.offerPrice ?? prod.discountedPrice ?? prod.salePrice ?? prod.price),
                        merchantName: prod.merchantName || prod.storeName,
                        merchant: { merchantId: prod.merchantId, name: prod.merchantName || prod.storeName },
                    },
                    id: prodId,
                    sortDate: prod.createdAt || prod.updatedAt,
                });
            }
        });

        // 4. Combine with in-memory offers if they match
        searchPool.forEach((offer, offerIdx) => {
            // ── Build a comprehensive text blob for the offer ──────────────────
            const offerTitle = String(offer?.bannerTitle || offer?.title || "").toLowerCase();
            const subtitle = String(getOfferSubtitle(offer)).toLowerCase();
            const offerType = String(offer?.bannerCategory || offer?.offerType || offer?.category || "").toLowerCase();
            const desc = String(offer?.description || offer?.details || offer?.shortDescription || "").toLowerCase();
            const discountText = String(offer?.discountText || offer?.discountLabel || offer?.discount || "").toLowerCase();
            const tags = (Array.isArray(offer?.tags) ? offer.tags : []).map(t => String(t).toLowerCase()).join(" ");
            const locationStr = String(offer?.location || offer?.address || offer?.city || offer?.area || offer?.pincode || "").toLowerCase();
            const validity = String(offer?.validity || offer?.validityText || "").toLowerCase();
            const termsText = String(offer?.termsAndConditions || offer?.terms || "").toLowerCase();

            // Merchant sub-fields available directly on the offer
            const merchantName = getOfferSubtitle(offer);
            const rawMerchantName = String(
                offer?.merchantName || offer?.storeName || offer?.shopName ||
                offer?.businessName || offer?.sellerName || offer?.merchant?.name ||
                offer?.merchant?.storeName || ""
            ).toLowerCase();
            const merchantCategory = offer?.merchant?.storeCategory || offer?.merchant?.category || offer?.bannerCategory || offer?.category || "";
            const merchantAddress = offer?.merchant?.address || offer?.merchantAddress || offer?.location || offer?.address || "";
            const merchantCity = String(offer?.merchant?.city || offer?.city || "").toLowerCase();
            const merchantPincode = String(offer?.merchant?.pincode || offer?.pincode || "").toLowerCase();
            const merchantPhone = String(offer?.merchant?.phone || offer?.merchant?.mobile || offer?.merchantPhone || "").toLowerCase();
            const merchantEmail = String(offer?.merchant?.email || offer?.merchantEmail || "").toLowerCase();
            const merchantWebsite = String(offer?.merchant?.website || offer?.merchantWebsite || "").toLowerCase();
            const merchantDesc = String(offer?.merchant?.description || offer?.merchant?.about || "").toLowerCase();
            const merchantTags = (Array.isArray(offer?.merchant?.tags) ? offer.merchant.tags : []).map(t => String(t).toLowerCase()).join(" ");

            // Products on this offer
            const products = Array.isArray(offer?.selectedProducts) && offer.selectedProducts.length
                ? offer.selectedProducts
                : (Array.isArray(offer?.products) ? offer.products : []);

            const productsBlobParts = products.map(p => [
                p?.productName || p?.name || p?.title || "",
                p?.description || "",
                p?.category || p?.productCategory || "",
                p?.brand || "",
                p?.sku || p?.skuCode || "",
                p?.variant || p?.variantName || "",
                (Array.isArray(p?.tags) ? p.tags : []).join(" "),
            ].join(" ").toLowerCase());
            const productsBlob = productsBlobParts.join(" ");

            const isOfferMatch =
                offerTitle.includes(query) ||
                subtitle.includes(query) ||
                offerType.includes(query) ||
                desc.includes(query) ||
                discountText.includes(query) ||
                tags.includes(query) ||
                locationStr.includes(query) ||
                validity.includes(query) ||
                termsText.includes(query);

            const isProductBlobMatch = productsBlob.includes(query);

            const isMerchantDirectMatch =
                merchantName.toLowerCase().includes(query) ||
                rawMerchantName.includes(query) ||
                merchantCategory.toLowerCase().includes(query) ||
                merchantAddress.toLowerCase().includes(query) ||
                merchantCity.includes(query) ||
                merchantPincode.includes(query) ||
                merchantPhone.includes(query) ||
                merchantEmail.includes(query) ||
                merchantWebsite.includes(query) ||
                merchantDesc.includes(query) ||
                merchantTags.includes(query);

            const isMerchantMatch = isMerchantDirectMatch || isOfferMatch || isProductBlobMatch;

            const offerId = offer?.requestId || offer?._id || offer?.offerId || `offer-${offerIdx}`;
            if (isOfferMatch && !seenOfferIds.has(offerId)) {
                seenOfferIds.add(offerId);
                searchResultsOffers.push({
                    type: 'offer',
                    offer,
                    id: offerId,
                    sortDistance: offer?.distanceKm,
                    sortDate: offer?.createdAt || offer?.updatedAt,
                });
            }

            const merchantId = offer?.merchantId || offer?.merchant?._id || offer?.merchant?.id || merchantName;
            const merchantLogo = offer?.merchant?.logo || offer?.merchant?.imageUrl || offer?.merchant?.image || getOfferImage(offer);
            const distanceText = getDistanceText(offer?.distanceKm);

            if (isMerchantMatch && merchantId) {
                const key = String(merchantId).toLowerCase();
                if (!searchResultsMerchantsMap.has(key)) {
                    searchResultsMerchantsMap.set(key, {
                        id: merchantId,
                        merchantId: offer?.merchantId || offer?.merchant?._id || offer?.merchant?.id,
                        name: merchantName,
                        category: merchantCategory,
                        address: merchantAddress,
                        logo: merchantLogo,
                        distanceText,
                        merchantObj: offer?.merchant,
                        offer,
                    });
                }
            }

            if (products.length > 0) {
                products.forEach((prod, prodIdx) => {
                    const prodName = String(prod?.productName || prod?.name || prod?.title || "").toLowerCase();
                    const prodDesc = String(prod?.description || "").toLowerCase();
                    const prodCategory = String(prod?.category || prod?.productCategory || "").toLowerCase();
                    const prodBrand = String(prod?.brand || "").toLowerCase();
                    const prodSku = String(prod?.sku || prod?.skuCode || "").toLowerCase();
                    const prodVariant = String(prod?.variant || prod?.variantName || "").toLowerCase();
                    const prodTags = (Array.isArray(prod?.tags) ? prod.tags : []).map(t => String(t).toLowerCase()).join(" ");

                    const isProdMatch =
                        isOfferMatch ||
                        prodName.includes(query) ||
                        prodDesc.includes(query) ||
                        prodCategory.includes(query) ||
                        prodBrand.includes(query) ||
                        prodSku.includes(query) ||
                        prodVariant.includes(query) ||
                        prodTags.includes(query);

                    const prodId = `${offer?.requestId || offer?._id || offer?.offerId || offerIdx}_prod_${prod?._id || prod?.productId || prodIdx}`;
                    if (isProdMatch && !seenProductIds.has(prodId)) {
                        seenProductIds.add(prodId);
                        searchResultsProducts.push({
                            type: 'product',
                            product: prod,
                            offer,
                            id: prodId,
                            sortDistance: offer?.distanceKm,
                            sortDate: offer?.createdAt || offer?.updatedAt,
                        });
                    }
                });
            } else if (isOfferMatch) {
                const prodId = `${offer?.requestId || offer?._id || offer?.offerId || offerIdx}_prod_self`;
                if (!seenProductIds.has(prodId)) {
                    seenProductIds.add(prodId);
                    searchResultsProducts.push({
                        type: 'product',
                        product: null,
                        offer,
                        id: prodId,
                        sortDistance: offer?.distanceKm,
                        sortDate: offer?.createdAt || offer?.updatedAt,
                    });
                }
            }
        });
    }

    const searchResultsMerchants = Array.from(searchResultsMerchantsMap.values());

    const displayCards = [];
    if (!query) {
        activeOffers.forEach((offer, offerIdx) => {
            displayCards.push({
                type: 'offer',
                offer,
                id: offer?.requestId || offer?._id || offer?.offerId || `offer-${offerIdx}`,
                sortDistance: offer?.distanceKm,
                sortDate: offer?.createdAt || offer?.updatedAt,
            });
        });

        displayCards.sort((itemA, itemB) => {
            const distanceA = Number(itemA?.sortDistance);
            const distanceB = Number(itemB?.sortDistance);
            const hasDistanceA = Number.isFinite(distanceA);
            const hasDistanceB = Number.isFinite(distanceB);

            if (hasDistanceA && hasDistanceB) {
                return distanceA - distanceB;
            }
            if (hasDistanceA) return -1;
            if (hasDistanceB) return 1;

            return (
                new Date(itemB?.sortDate || 0).getTime() -
                new Date(itemA?.sortDate || 0).getTime()
            );
        });
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar2 />

            {/* ---- Location Section ---- */}
            {isEditingLocation ? (
                <View style={[styles.locationSection, styles.locationEditingSection, { position: "relative", zIndex: 100 }]}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationLeftGroup}>
                            <Ionicons name="location-outline" size={16} color="#c47a00" />
                            <TextInput
                                ref={locationInputRef}
                                style={styles.locationInput}
                                placeholder="Type a city or area..."
                                placeholderTextColor="#888"
                                value={locationQuery}
                                onChangeText={handleLocationQueryChange}
                                returnKeyType="search"
                                autoCorrect={false}
                                autoCapitalize="words"
                            />
                        </View>
                        <TouchableOpacity onPress={handleCancelEditingLocation} style={styles.locationCancelBtn}>
                            <Ionicons name="close-circle" size={18} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {(suggestionsLoading || locationSuggestions.length > 0) && (
                        <View style={styles.suggestionsContainer}>
                            {suggestionsLoading ? (
                                <View style={styles.suggestionLoading}>
                                    <ActivityIndicator size="small" color="#c47a00" />
                                    <Text style={styles.suggestionLoadingText}>Searching...</Text>
                                </View>
                            ) : (
                                locationSuggestions.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectSuggestion(s)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="location-sharp" size={14} color="#c47a00" style={{ marginRight: 8 }} />
                                        <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                            {gpsCoordinates && (
                                <TouchableOpacity
                                    style={[styles.suggestionItem, styles.gpsResetItem]}
                                    onPress={handleResetToGPS}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="navigate" size={14} color="#157a4f" style={{ marginRight: 8 }} />
                                    <Text style={[styles.suggestionText, { color: "#157a4f" }]}>Use my current GPS location</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.locationSection}
                    onPress={handleStartEditingLocation}
                    activeOpacity={0.75}
                >
                    <View style={styles.locationRow}>
                        <View style={styles.locationLeftGroup}>
                            <Ionicons name="location-outline" size={16} color="#000000" />
                            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                                {locationLabel}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={14} color="#555" />
                    </View>
                </TouchableOpacity>
            )}


            <View style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between", paddingHorizontal: 16
            }}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity
                        onPress={() => setSearchQuery(searchInput.trim())}
                        activeOpacity={0.7}
                    >
                        <EvilIcons name="search" size={24} color="#555" />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Search offers or products"
                        value={searchInput}
                        onChangeText={setSearchInput}
                        onSubmitEditing={() => setSearchQuery(searchInput.trim())}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                    {searchInput.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchInput("");
                                setSearchQuery("");
                            }}
                            style={{ padding: 8 }}
                        >
                            <Ionicons name="close-circle" size={18} color="#555" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterbtn} onPress={() => navigation.navigate("FilterPage")}>
                    <Ionicons name="options-outline" size={18} />

                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchOffers} />
                }
                showsVerticalScrollIndicator={false}
            >

                {/* ---- Category Strip (First 4 Categories + See All) ---- */}
                <View style={styles.categorySection}>
                    <View style={styles.categoryStripRow}>
                        {STRIP_CATEGORIES.map((item, index) => {
                            const { bg, dark } = CATEGORY_COLORS[item.label] || { bg: "#f0f0f0", dark: "#555" };
                            const isActive = selectedCategory === item.label;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.stripChip}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (selectedCategory === item.label) {
                                            setSelectedCategory(null);
                                        } else {
                                            setSelectedCategory(item.label);
                                        }
                                    }}
                                >
                                    <View style={[styles.stripIconCircle, { backgroundColor: bg }]}>
                                        <Ionicons name={item.icon} size={18} color={dark} />
                                    </View>
                                    <Text style={[styles.stripText, { color: dark }]} numberOfLines={2}>
                                        {item.displayLabel}
                                    </Text>
                                    {isActive && <View style={styles.chipUnderline} />}
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={styles.stripChip}
                            activeOpacity={0.8}
                            onPress={() => setAllCategoriesModalOpen(true)}
                        >
                            <View style={[styles.stripIconCircle, { backgroundColor: "#f2f2f2" }]}>
                                <Ionicons name="grid" size={18} color="#444" />
                            </View>
                            <Text style={[styles.stripText, { color: "#444" }]} numberOfLines={1}>
                                See All
                            </Text>
                            {selectedCategory && !STRIP_CATEGORIES.some(c => c.label === selectedCategory) && (
                                <View style={styles.chipUnderline} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {loading && !offers.length ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="small" color="#157a4f" />
                        <Text style={styles.helperText}>Loading live offers...</Text>
                    </View>
                ) : query ? (
                    <View style={styles.searchResultsContainer}>
                        {searchLoading && searchResultsOffers.length === 0 && searchResultsMerchants.length === 0 && searchResultsProducts.length === 0 && (
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20 }}>
                                <ActivityIndicator size="small" color="#157a4f" style={{ marginRight: 8 }} />
                                <Text style={{ ...styles.helperText, color: "#157a4f" }}>Searching offers, stores & products...</Text>
                            </View>
                        )}
                        {/* ---- Section 1: Offers ---- */}
                        {searchResultsOffers.length > 0 && (
                            <View style={styles.sectionBlock}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionHeaderTitle}>Offers ({searchResultsOffers.length})</Text>
                                </View>
                                <View style={styles.cardsGrid}>
                                    {searchResultsOffers.slice(0, offersLimit).map((item, index) => (
                                        <OfferCard
                                            key={item?.id || `search-offer-${index}`}
                                            item={item}
                                            navigation={navigation}
                                        />
                                    ))}
                                </View>
                                {(searchResultsOffers.length > offersLimit || hasMoreOffers) && (
                                    <TouchableOpacity
                                        style={styles.loadMoreBtn}
                                        onPress={() => {
                                            if (searchResultsOffers.length > offersLimit) {
                                                setOffersLimit((prev) => prev + 6);
                                            } else if (hasMoreOffers) {
                                                loadMoreOffers();
                                            }
                                        }}
                                        disabled={loadingMoreOffers}
                                        activeOpacity={0.8}
                                    >
                                        {loadingMoreOffers ? (
                                            <ActivityIndicator size="small" color="#157a4f" />
                                        ) : (
                                            <>
                                                <Text style={styles.loadMoreBtnText}>Load More Offers</Text>
                                                <Ionicons name="chevron-down" size={16} color="#157a4f" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* ---- Section 2: Merchant / Stores ---- */}
                        {searchResultsMerchants.length > 0 && (
                            <View style={styles.sectionBlock}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionHeaderTitle}>Stores ({searchResultsMerchants.length})</Text>
                                </View>
                                <View style={styles.cardsGrid}>
                                    {searchResultsMerchants.slice(0, merchantsLimit).map((merchant, index) => (
                                        <MerchantCard
                                            key={merchant.id || `search-merchant-${index}`}
                                            merchant={merchant}
                                            navigation={navigation}
                                        />
                                    ))}
                                </View>
                                {(searchResultsMerchants.length > merchantsLimit || hasMoreMerchants) && (
                                    <TouchableOpacity
                                        style={styles.loadMoreBtn}
                                        onPress={() => {
                                            if (searchResultsMerchants.length > merchantsLimit) {
                                                setMerchantsLimit((prev) => prev + 6);
                                            } else if (hasMoreMerchants) {
                                                loadMoreMerchants();
                                            }
                                        }}
                                        disabled={loadingMoreMerchants}
                                        activeOpacity={0.8}
                                    >
                                        {loadingMoreMerchants ? (
                                            <ActivityIndicator size="small" color="#157a4f" />
                                        ) : (
                                            <>
                                                <Text style={styles.loadMoreBtnText}>Load More Stores</Text>
                                                <Ionicons name="chevron-down" size={16} color="#157a4f" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* ---- Section 3: Products Cards ---- */}
                        {searchResultsProducts.length > 0 && (
                            <View style={styles.sectionBlock}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionHeaderTitle}>Products Cards ({searchResultsProducts.length})</Text>
                                </View>
                                <View style={styles.cardsGrid}>
                                    {searchResultsProducts.slice(0, productsLimit).map((item, index) => (
                                        <OfferCard
                                            key={item?.id || `search-product-${index}`}
                                            item={item}
                                            navigation={navigation}
                                        />
                                    ))}
                                </View>
                                {(searchResultsProducts.length > productsLimit || hasMoreProducts) && (
                                    <TouchableOpacity
                                        style={styles.loadMoreBtn}
                                        onPress={() => {
                                            if (searchResultsProducts.length > productsLimit) {
                                                setProductsLimit((prev) => prev + 6);
                                            } else if (hasMoreProducts) {
                                                loadMoreProducts();
                                            }
                                        }}
                                        disabled={loadingMoreProducts}
                                        activeOpacity={0.8}
                                    >
                                        {loadingMoreProducts ? (
                                            <ActivityIndicator size="small" color="#157a4f" />
                                        ) : (
                                            <>
                                                <Text style={styles.loadMoreBtnText}>Load More Products</Text>
                                                <Ionicons name="chevron-down" size={16} color="#157a4f" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Empty search state */}
                        {!searchLoading &&
                            searchResultsOffers.length === 0 &&
                            searchResultsMerchants.length === 0 &&
                            searchResultsProducts.length === 0 && (
                                <View style={styles.centerState}>
                                    <Ionicons name="search-outline" size={48} color="#aaa" />
                                    <Text style={styles.emptyTitle}>No results found for "{searchQuery}"</Text>
                                    <Text style={styles.helperText}>Try searching with a different keyword</Text>
                                </View>
                            )}
                    </View>
                ) : displayCards.length ? (
                    <View style={styles.cardsGrid}>
                        {displayCards.map((item, index) => (
                            <OfferCard
                                key={item?.id || `card-${index}`}
                                item={item}
                                navigation={navigation}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.centerState}>
                        <Text style={styles.emptyTitle}>
                            {error || "No offers found"}
                        </Text>
                        <Text style={styles.helperText}>
                            Pull down to refresh
                        </Text>
                        {error ? (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={fetchOffers}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            </ScrollView>

            {/* ---- All Categories Modal ---- */}
            <Modal
                visible={allCategoriesModalOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setAllCategoriesModalOpen(false)}
                statusBarTranslucent
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
                    <LinearGradient
                        colors={["#f8a812", "#fad081", "#ffffff"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.modalHeaderGradient}
                    >
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>All Categories</Text>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setAllCategoriesModalOpen(false)}
                            >
                                <Ionicons name="close" size={16} color="#333" style={{ marginRight: 2 }} />
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Modal Search Input */}
                        <View style={styles.modalSearchContainer}>
                            <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search categories..."
                                placeholderTextColor="#888"
                                value={categorySearchQuery}
                                onChangeText={setCategorySearchQuery}
                                style={styles.modalSearchInput}
                            />
                            {categorySearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setCategorySearchQuery("")}>
                                    <Ionicons name="close-circle" size={18} color="#888" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </LinearGradient>

                    {/* Scrollable grid content */}
                    <ScrollView
                        contentContainerStyle={styles.modalGridContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.modalGridRow}>
                            {MAIN_STORE_CATEGORIES.filter((cat) =>
                                cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
                            ).map((cat) => {
                                const { bg, dark } = CATEGORY_COLORS[cat] || { bg: "#f0f0f0", dark: "#555" };
                                const iconName = CATEGORY_ICONS[cat] || "grid-outline";
                                const isSelected = selectedCategory === cat;

                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.modalGridCard,
                                            { backgroundColor: bg },
                                            isSelected && {
                                                borderWidth: 1.5,
                                                borderColor: dark,
                                                shadowOpacity: 0.15,
                                                elevation: 5,
                                            },
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setAllCategoriesModalOpen(false);
                                            setCategorySearchQuery("");
                                            if (selectedCategory === cat) {
                                                setSelectedCategory(null);
                                            } else {
                                                setSelectedCategory(cat);
                                            }
                                        }}
                                    >
                                        <View style={[
                                            styles.modalCardIconCircle,
                                            isSelected && {
                                                borderWidth: 1,
                                                borderColor: dark,
                                            },
                                        ]}>
                                            <Ionicons name={iconName} size={22} color={dark} />
                                        </View>
                                        <Text style={[
                                            styles.modalCardText,
                                            isSelected && { color: dark, ...textPresets.label },
                                        ]} numberOfLines={2}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
                <GoloBottom />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const CategoryChip = ({ icon, label, isActive, onPress }) => {
    const { bg, dark } = CATEGORY_COLORS[label] || { bg: "#f0f0f0", dark: "#555555" };
    return (
        <TouchableOpacity onPress={onPress} style={styles.chip}>
            <View style={[styles.chipIconCircle, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={20} color={dark} />
            </View>
            <Text style={[styles.chipText, { color: dark }]} numberOfLines={2}>
                {label}
            </Text>
            {isActive && <View style={styles.chipUnderline} />}
        </TouchableOpacity>
    );
};

const MerchantCard = ({ merchant, navigation }) => {
    const logoUri = resolveImageUrl(merchant?.logo);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.merchantCard}
            onPress={() =>
                navigation.navigate("StorePage", {
                    merchantId: merchant.merchantId,
                    passedMerchant: merchant.merchantObj,
                })
            }
        >
            <View style={styles.merchantCardInner}>
                {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.merchantLogo} resizeMode="cover" />
                ) : (
                    <View style={[styles.merchantLogo, styles.merchantLogoFallback]}>
                        <Ionicons name="storefront" size={26} color="#f8a812" />
                    </View>
                )}
                <View style={styles.merchantContent}>
                    <Text style={styles.merchantName} numberOfLines={1}>
                        {merchant.name}
                    </Text>
                    {merchant.category ? (
                        <Text style={styles.merchantCategory} numberOfLines={1}>
                            {merchant.category}
                        </Text>
                    ) : null}
                    {merchant.distanceText ? (
                        <Text style={styles.merchantDistance} numberOfLines={1}>
                            📍 {merchant.distanceText}
                        </Text>
                    ) : null}
                    <View style={styles.visitStoreBadge}>
                        <Text style={styles.visitStoreText}>Visit Store</Text>
                        <Ionicons name="chevron-forward" size={12} color="#157a4f" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const OfferCard = ({ item, navigation }) => {
    const parentOffer = item?.type ? item.offer : item;
    const isProd = item?.type === "product";

    let productImage, title, subtitle, offerType, endDate, displayPrice;

    if (isProd) {
        const prod = item.product;
        const rawImg = prod?.imageUrl || prod?.image?.url || (Array.isArray(prod?.images) ? prod.images[0] : null) || getOfferImage(parentOffer);
        productImage = resolveImageUrl(rawImg);
        title = prod?.productName || prod?.name || prod?.title || "Product";
        subtitle = getOfferSubtitle(parentOffer);
        offerType = parentOffer?.bannerCategory || parentOffer?.offerType || parentOffer?.category || "-";
        endDate = parentOffer?.endDate || parentOffer?.validTo || null;
        const prodPrice = prod?.offerPrice ?? prod?.discountedPrice ?? prod?.salePrice ?? prod?.finalPrice ?? prod?.price;
        const prodOrigPrice = prod?.originalPrice ?? prod?.mrp;
        displayPrice = formatPrice(prodPrice) || formatPrice(prodOrigPrice) || getOfferDisplayPrice(parentOffer);
    } else {
        productImage = resolveImageUrl(getOfferImage(parentOffer));
        title = getOfferTitle(parentOffer);
        subtitle = getOfferSubtitle(parentOffer);
        offerType = parentOffer?.bannerCategory || parentOffer?.offerType || parentOffer?.category || "-";
        endDate = parentOffer?.endDate || parentOffer?.validTo || null;
        displayPrice = getOfferDisplayPrice(parentOffer);
    }

    const distanceText = getDistanceText(parentOffer?.distanceKm);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => {
                if (isProd && item.product) {
                    // Navigate to dedicated product details page
                    navigation.navigate("ProductDetail", {
                        product: item.product,
                        productId: item.product?.productId || item.product?._id || item.product?.id,
                        offerId: parentOffer?.requestId || parentOffer?._id || parentOffer?.offerId,
                        offerData: parentOffer,
                    });
                } else {
                    navigation.navigate("OfferDetails", { offerData: parentOffer });
                }
            }}
        >
            <View style={styles.cardInner}>
                {productImage ? (
                    <Image source={{ uri: productImage }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.imageFallback]}>
                        <Ionicons name="image-outline" size={28} color="#8a8a8a" />
                    </View>
                )}

                <View style={styles.cardContent}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        {displayPrice ? (
                            <Text style={styles.discountPrice} numberOfLines={1}>
                                {displayPrice}
                            </Text>
                        ) : null}

                        {distanceText ? <Text style={styles.distanceMetaText}>{distanceText}</Text> : null}
                    </View>

                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>

                    <Text style={styles.subtitle} numberOfLines={1}>
                        By {subtitle}
                    </Text>

                    <Text style={styles.metaText} numberOfLines={1}>Offer Type: {offerType}</Text>

                    <Text style={styles.validText} numberOfLines={1}>
                        Expires on: {endDate ? new Date(endDate).toDateString() : "-"}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        paddingBottom: 80
    },
    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    topRow: {
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
    },
    locationSection: {
        backgroundColor: "#ffffffe5",
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 40,           // fixed height, same in both states
        justifyContent: "center",
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: "#f8a812",
    },
    locationEditingSection: {
        backgroundColor: "#fff8ec",
        borderWidth: 1,
        borderColor: "#f8a812",
        zIndex: 100,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",   // pushes chevron/close button to the end
    },
    locationLeftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flex: 1,
        marginRight: 8,    // breathing room before the trailing icon
    },
    locationText: {
        ...textPresets.label,
        flexShrink: 1,
    },
    locationInput: {
        flex: 1,
        ...textPresets.label,
        color: "#222",
        paddingVertical: 0,
        paddingHorizontal: 4,
    },
    locationCancelBtn: {
        paddingLeft: 4,
    },
    suggestionsContainer: {
        position: "absolute",
        top: "100%",          // right below locationSection's bottom edge
        left: 0,
        right: 0,
        marginTop: 6,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5c47a",
        overflow: "hidden",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        zIndex: 200,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f5e9cf",
    },
    gpsResetItem: {
        backgroundColor: "#f0faf5",
        borderBottomWidth: 0,
    },
    suggestionText: {
        flex: 1,
        ...textPresets.label,
        color: "#333",
    },
    suggestionLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
    },
    suggestionLoadingText: {
        ...textPresets.label,
        color: "#888",
    },
    locationHint: {
        marginTop: 4,
        ...textPresets.label,
    },
    filterbtn: {
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 12,
        justifyContent: "center",
    },
    categorySection: {
        marginTop: 6,
        marginBottom: 4,
    },
    categoryStripRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    stripChip: {
        alignItems: "center",
        width: "18%",
    },
    stripIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 5,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    stripText: {
        textAlign: "center",
        minHeight: 32,
        ...textPresets.caption
    },
    chipUnderline: {
        marginTop: 4,
        width: 24,
        height: 2,
        backgroundColor: "#000000",
    },
    // ─── Modal styling ───────────────────────────────
    modalHeaderGradient: {
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    modalHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 16,
    },
    modalTitle: {
        color: "#111",
        ...textPresets.subtitle,
    },
    modalCloseBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        paddingVertical: 6,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    modalCloseText: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        color: "#333",
    },
    modalSearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e2e2",
        paddingHorizontal: 12,
        paddingVertical: 5,
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    modalSearchInput: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        color: "#222",
        paddingVertical: 6,
        top: 3
    },
    modalGridContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 40,
    },
    modalGridRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    modalGridCard: {
        width: "48%",
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    modalCardIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    modalCardText: {
        ...textPresets.label,
        textAlign: "center",
        color: "#111",
    },
    card: {
        width: "48%",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ececec",
        elevation: 5,
        backgroundColor: "#fff",
        overflow: "hidden",
        marginBottom: 18,
    },
    cardInner: {
        flexDirection: "column",
    },
    image: {
        width: "100%",
        height: 110,
        backgroundColor: "#b8b8b8",
    },
    imageFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    title: {
        flex: 1,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    subtitle: {
        marginTop: 5,
        color: "#666",
        ...textPresets.label,
    },
    metaText: {
        marginTop: 5,
        ...textPresets.label,
        color: "#666"
    },
    validText: {
        marginTop: 6,
        color: "#555",
        ...textPresets.caption,
    },
    distanceMetaText: {
        ...textPresets.label,
        alignSelf: "flex-end"
    },
    statusText: {
        textTransform: "capitalize",
        ...textPresets.label,
    },
    statusPositive: {
        color: "green",
    },
    statusPending: {
        color: "#b7791f",
    },
    statusNegative: {
        color: "red",
    },
    discountPrice: {
        color: "green",
        marginRight: 10,
        ...textPresets.label,
    },
    centerState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    emptyTitle: {
        textAlign: "center",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    helperText: {
        textAlign: "center",
        marginTop: 8,
        color: "#666",
        ...textPresets.label,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#157a4f",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 14,
    },
    retryButtonText: {
        color: "#ffffff",
        ...textPresets.label,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginVertical: 6,
        paddingHorizontal: 6,
        width: "86%"
    },
    searchInput: {
        flex: 1,
        paddingLeft: 5,
        paddingVertical: 10,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        top: 3
    },
    voiceButton: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    voiceErrorText: {
        color: "#c23b4d",
        ...textPresets.caption,
        marginLeft: 16,
        marginTop: 4,
        marginBottom: 2,
    },
    merchantCard: {
        width: "48%",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ececec",
        elevation: 3,
        backgroundColor: "#fff",
        overflow: "hidden",
        marginBottom: 18,
    },
    merchantCardInner: {
        flexDirection: "column",
    },
    merchantLogo: {
        width: "100%",
        height: 100,
        backgroundColor: "#f5f5f5",
    },
    merchantLogoFallback: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff8ec",
    },
    merchantContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    merchantName: {
        ...textPresets.label,
        color: "#111",
    },
    merchantCategory: {
        marginTop: 4,
        color: "#666",
        ...textPresets.caption,
    },
    merchantDistance: {
        marginTop: 4,
        color: "#157a4f",
        ...textPresets.caption,
    },
    visitStoreBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#eaf7f0",
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    visitStoreText: {
        color: "#157a4f",
        ...textPresets.label,
        marginRight: 2,
    },
    searchResultsContainer: {
        width: "100%",
        marginTop: 10,
    },
    sectionBlock: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingHorizontal: 2,
    },
    sectionHeaderTitle: {
        ...textPresets.subtitle,
        color: "#111",
    },
    loadMoreBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0faf5",
        borderWidth: 1,
        borderColor: "#b6e5d0",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        marginTop: 4,
        alignSelf: "center",
    },
    loadMoreBtnText: {
        color: "#157a4f",
        ...textPresets.label,
        marginRight: 6,
    },
});