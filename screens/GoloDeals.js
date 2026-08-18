import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    RefreshControl,
    Modal,
} from "react-native";
import { Feather, Ionicons, EvilIcons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar2 from "../components/Topbar2";
import GoloBottom from "../components/GoloBottom";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";
import RatingsBox from "../components/RatingsBox";
import { getValidToken } from "../services/authService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = 170;
const AUTO_SCROLL_INTERVAL = 4000; // 4 seconds

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

const staticBanners = [
    { id: "static-1", imageUrl: require("../assets/banner1.png"), isStatic: true },
    { id: "static-2", imageUrl: require("../assets/banner2.png"), isStatic: true },
    { id: "static-3", imageUrl: require("../assets/banner3.png"), isStatic: true },
    { id: "static-4", imageUrl: require("../assets/banner4.png"), isStatic: true },
];

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

const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const getDistanceText = (item, userCoords) => {
    if (item?.distanceKm !== undefined && item?.distanceKm !== null) {
        const dist = Number(item.distanceKm);
        return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
    }
    const coords = item?.locationCoordinates?.coordinates; // [longitude, latitude]
    if (Array.isArray(coords) && coords.length === 2 && userCoords?.lat && userCoords?.lng) {
        const dist = getDistance(userCoords.lat, userCoords.lng, coords[1], coords[0]);
        if (dist !== null) {
            return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
        }
    }
    return null;
};

export default function GoloDeals() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);

    // ─── Location state ──────────────────────────────────────
    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [gpsPlaceName, setGpsPlaceName] = useState("");
    const [locationPlaceName, setLocationPlaceName] = useState("");
    const [customerCity, setCustomerCity] = useState("");
    const [gpsCity, setGpsCity] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Location editing state
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const locationInputRef = useRef(null);
    const debounceTimer = useRef(null);

    // ─── Banner state ────────────────────────────────────────
    const [banners, setBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerFlatListRef = useRef(null);
    const autoScrollTimer = useRef(null);

    // ─── Sections state ──────────────────────────────────────
    const [sections, setSections] = useState([]);
    const [sectionsLoading, setSectionsLoading] = useState(true);

    // ─── Category Modal state ────────────────────────────────
    const [allCategoriesModalOpen, setAllCategoriesModalOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");

    // ─── Location logic (same as GoloHome) ───────────────────
    useEffect(() => {
        let isMounted = true;

        const getUserLocation = async () => {
            try {
                setLocationStatus("loading");
                setLocationPlaceName("");

                const { status } = await Location.requestForegroundPermissionsAsync();

                if (!isMounted) return;

                if (status !== "granted") {
                    setLocationStatus("denied");
                    return;
                }

                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                if (!isMounted) return;

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

                    if (!isMounted) return;

                    const place = geocode?.[0] || {};
                    const resolvedCity = place?.city || place?.subregion || "";
                    setCustomerCity(resolvedCity);
                    setGpsCity(resolvedCity);

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
                    if (!isMounted) return;
                    setLocationPlaceName("your current area");
                    setGpsPlaceName("your current area");
                }

                setLocationStatus("granted");
            } catch (locationError) {
                if (!isMounted) return;
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

        // Extract city from suggestion label
        const parts = suggestion.label.split(",").map(p => p.trim());
        const resolvedCity = parts[parts.length - 3] || parts[parts.length - 2] || "";
        setCustomerCity(resolvedCity);

        setLocationStatus("granted");
    }, []);

    const handleResetToGPS = useCallback(() => {
        if (gpsCoordinates) {
            setUserCoordinates(gpsCoordinates);
            setLocationPlaceName(gpsPlaceName);
            setCustomerCity(gpsCity);
        }
        handleCancelEditingLocation();
    }, [gpsCoordinates, gpsPlaceName, gpsCity, handleCancelEditingLocation]);

    // ─── Fetch banners from backend ──────────────────────────
    const fetchBanners = useCallback(async () => {
        if (!BASE_URL) {
            setBannersLoading(false);
            return;
        }

        try {
            setBannersLoading(true);
            const cityParam = customerCity || "";
            const url = `${BASE_URL}/banners/promotions/active?limit=10&city=${encodeURIComponent(cityParam)}&fullLocation=${encodeURIComponent(locationPlaceName || "")}`;
            const response = await fetch(url);
            const payload = await response.json().catch(() => ({}));
            if (response.ok && Array.isArray(payload?.data)) {
                const merchantBanners = payload.data;
                const merchantCount = merchantBanners.length;
                const staticCountNeeded = Math.max(0, Math.min(4, 10 - merchantCount));
                const neededStaticBanners = staticBanners.slice(0, staticCountNeeded);
                const combinedBanners = [...merchantBanners, ...neededStaticBanners];
                setBanners(combinedBanners);
            } else {
                setBanners(staticBanners);
            }
        } catch (err) {
            console.error("Failed to fetch banners:", err);
            setBanners(staticBanners);
        } finally {
            setBannersLoading(false);
        }
    }, [locationPlaceName, customerCity]);

    // ─── Fetch sections from backend ─────────────────────────
    const fetchSections = useCallback(async () => {
        if (!BASE_URL) {
            setSectionsLoading(false);
            return;
        }

        try {
            setSectionsLoading(true);
            const customerId = await AsyncStorage.getItem("customerId");

            // Attempt to get a valid token; guests (not logged in) will have no token
            let token = null;
            try {
                token = await getValidToken();
            } catch {
                // Guest user — continue without auth
            }

            const params = new URLSearchParams();
            if (userCoordinates?.lat) params.append("lat", String(userCoordinates.lat));
            if (userCoordinates?.lng) params.append("lng", String(userCoordinates.lng));
            if (customerCity) params.append("city", customerCity);
            if (locationPlaceName) params.append("location", locationPlaceName);
            if (customerId) params.append("userId", customerId);

            const url = `${BASE_URL}/recommendations/homepage?${params.toString()}`;
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(url, { headers });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setSections(data);
            } else {
                setSections([]);
            }
        } catch (err) {
            console.error("Failed to fetch sections:", err);
            setSections([]);
        } finally {
            setSectionsLoading(false);
        }
    }, [userCoordinates, customerCity, locationPlaceName]);

    useFocusEffect(
        useCallback(() => {
            fetchBanners();
            fetchSections();
        }, [fetchBanners, fetchSections])
    );

    useEffect(() => {
        fetchBanners();
        fetchSections();
    }, [locationPlaceName, customerCity, fetchBanners, fetchSections]);

    // ─── Auto-scroll banners ─────────────────────────────────
    const startAutoScroll = useCallback(() => {
        if (banners.length <= 1) return;
        autoScrollTimer.current = setInterval(() => {
            setCurrentBannerIndex((prev) => {
                const nextBannerIndex = (prev + 1) % banners.length;
                const targetFlatListIndex = prev === banners.length - 1 ? banners.length + 1 : nextBannerIndex + 1;
                bannerFlatListRef.current?.scrollToIndex({
                    index: targetFlatListIndex,
                    animated: true,
                });
                return nextBannerIndex;
            });
        }, AUTO_SCROLL_INTERVAL);
    }, [banners.length]);

    useEffect(() => {
        if (banners.length > 1) {
            setTimeout(() => {
                bannerFlatListRef.current?.scrollToIndex({
                    index: 1,
                    animated: false,
                });
            }, 100);
            setCurrentBannerIndex(0);
        } else {
            setCurrentBannerIndex(0);
        }
    }, [banners]);

    useEffect(() => {
        startAutoScroll();
        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
        };
    }, [startAutoScroll]);

    const onBannerScroll = useCallback((event) => {
        if (banners.length <= 1) return;
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const itemWidth = SLIDE_WIDTH + BANNER_GAP;
        const index = Math.round(contentOffsetX / itemWidth);

        if (index === 0 && contentOffsetX < 10) {
            bannerFlatListRef.current?.scrollToOffset({
                offset: itemWidth * banners.length,
                animated: false,
            });
            setCurrentBannerIndex(banners.length - 1);
        } else if (index === banners.length + 1) {
            bannerFlatListRef.current?.scrollToOffset({
                offset: itemWidth,
                animated: false,
            });
            setCurrentBannerIndex(0);
        } else {
            setCurrentBannerIndex(index - 1);
        }
    }, [banners.length, SLIDE_WIDTH]);

    const onBannerScrollBeginDrag = useCallback(() => {
        if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    }, []);

    const onBannerScrollEndDrag = useCallback(() => {
        startAutoScroll();
    }, [startAutoScroll]);

    const loopingBanners = banners.length > 1
        ? [banners[banners.length - 1], ...banners, banners[0]]
        : banners;

    const locationLabel =
        locationStatus === "granted"
            ? locationPlaceName
                ? locationPlaceName
                : "Current location"
            : locationStatus === "loading"
                ? "Checking your location..."
                : "Tap to set location";

    // ─── Banner Tracking (Impressions & Clicks as per Backend Logic) ──
    const trackBannerImpression = useCallback((item) => {
        if (!item || item.isStatic || item.trackedImpression || !BASE_URL) return;
        item.trackedImpression = true;
        const bannerId = item.requestId || item.id || item._id;
        if (!bannerId || !item.merchantId) return;

        fetch(`${BASE_URL}/banners/promotions/impression`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bannerId: String(bannerId),
                merchantId: String(item.merchantId),
                city: customerCity || "global",
                slot: item.slot || 1,
                generation: item.generation || 0,
                token: item.token || "",
            }),
        }).catch((err) => console.warn("Impression tracking error:", err));
    }, [customerCity]);

    const handleBannerPress = useCallback((item) => {
        if (item.isStatic) return;

        const bannerId = item.requestId || item.id || item._id;
        if (bannerId && item.merchantId && BASE_URL) {
            fetch(`${BASE_URL}/banners/promotions/click`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bannerId: String(bannerId),
                    merchantId: String(item.merchantId),
                    city: customerCity || "global",
                }),
            }).catch((err) => console.warn("Click tracking error:", err));
        }

        if (item.merchantId) {
            navigation.navigate("StorePage", { merchantId: item.merchantId, bannerData: item });
        }
    }, [navigation, customerCity]);

    // ─── Render banner item ──────────────────────────────────
    const BANNER_GAP = 12;
    const renderBannerItem = useCallback(({ item }) => {
        const imageSource = item.isStatic ? item.imageUrl : { uri: resolveImageUrl(item.imageUrl) };
        if (!item.isStatic) {
            trackBannerImpression(item);
        }
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.bannerSlide, { marginRight: BANNER_GAP }]}
                onPress={() => handleBannerPress(item)}
            >
                <Image
                    source={imageSource}
                    style={styles.bannerImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    }, [handleBannerPress, trackBannerImpression]);

    const SLIDE_WIDTH = SCREEN_WIDTH - 32;
    const getItemLayout = useCallback((data, index) => ({
        length: SLIDE_WIDTH + BANNER_GAP,
        offset: (SLIDE_WIDTH + BANNER_GAP) * index,
        index,
    }), []);

    // ─── Render deals sections dynamically ────────────────────
    const renderDealSection = (section) => {
        const { title, products = [], key } = section;
        const query = String(searchQuery || "").trim().toLowerCase();

        const displayItems = [];

        products.forEach((offer, offerIdx) => {
            if (!query) {
                displayItems.push({
                    type: 'offer',
                    offer,
                    id: offer?._id || offer?.id || offer?.requestId || `offer-${offerIdx}`,
                });
                return;
            }

            const offerTitle = String(getOfferTitle(offer)).toLowerCase();
            const subtitle = String(getOfferSubtitle(offer)).toLowerCase();
            const offerType = String(offer?.bannerCategory || offer?.offerType || offer?.category || "").toLowerCase();
            const isOfferMatch = offerTitle.includes(query) || subtitle.includes(query) || offerType.includes(query);

            const rawProducts = Array.isArray(offer?.selectedProducts) && offer.selectedProducts.length
                ? offer.selectedProducts
                : (Array.isArray(offer?.products) ? offer.products : []);

            const matchingProducts = rawProducts.filter(p => {
                const pName = String(p?.productName || p?.name || p?.title || "").toLowerCase();
                return pName.includes(query);
            });

            if (isOfferMatch) {
                displayItems.push({
                    type: 'offer',
                    offer,
                    id: offer?._id || offer?.id || offer?.requestId || `offer-${offerIdx}`,
                });
            }

            matchingProducts.forEach((p, pIdx) => {
                displayItems.push({
                    type: 'product',
                    product: p,
                    offer,
                    id: `${offer?._id || offer?.id || offer?.requestId || offerIdx}_prod_${p?._id || p?.productId || pIdx}`,
                });
            });
        });

        if (displayItems.length === 0) {
            return null;
        }

        return (
            <View style={styles.sectionContainer} key={key || title}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("GoloHome")} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>See All</Text>
                        <MaterialIcons name="arrow-forward-ios" size={14} color="#555" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 4 }}
                >
                    {displayItems.map((itemObj, index) => {
                        const parentOffer = itemObj.offer;
                        const isProd = itemObj.type === 'product';

                        let itemTitle, subtitle, directPrice, image, offerType, endDate;

                        if (isProd) {
                            const prod = itemObj.product;
                            itemTitle = prod?.productName || prod?.name || prod?.title || "Product";
                            subtitle = getOfferSubtitle(parentOffer);
                            image = prod?.imageUrl || prod?.image?.url || (Array.isArray(prod?.images) ? prod.images[0] : null) || getOfferImage(parentOffer);
                            const prodPrice = prod?.offerPrice ?? prod?.discountedPrice ?? prod?.salePrice ?? prod?.finalPrice ?? prod?.price;
                            const prodOrigPrice = prod?.originalPrice ?? prod?.mrp;
                            directPrice = formatPrice(prodPrice) || formatPrice(prodOrigPrice) || getOfferDisplayPrice(parentOffer);
                            offerType = parentOffer?.bannerCategory || parentOffer?.offerType || parentOffer?.category || "-";
                            endDate = parentOffer?.endDate || parentOffer?.validTo || null;
                        } else {
                            itemTitle = getOfferTitle(parentOffer);
                            subtitle = getOfferSubtitle(parentOffer);
                            image = getOfferImage(parentOffer);
                            directPrice = getOfferDisplayPrice(parentOffer);
                            offerType = parentOffer?.bannerCategory || parentOffer?.offerType || parentOffer?.category || "-";
                            endDate = parentOffer?.endDate || parentOffer?.validTo || null;
                        }

                        const distanceText = getDistanceText(parentOffer, userCoordinates);
                        const imageSource = image ? { uri: resolveImageUrl(image) } : null;

                        return (
                            <TouchableOpacity
                                key={itemObj.id || `card-${key}-${index}`}
                                activeOpacity={0.9}
                                style={[styles.card, { width: 170, marginRight: 12, marginBottom: 8 }]}
                                onPress={() => navigation.navigate("OfferDetails", { offerData: parentOffer })}
                            >
                                <View style={styles.cardInner}>
                                    {imageSource ? (
                                        <Image source={imageSource} style={styles.image} />
                                    ) : (
                                        <View style={[styles.image, styles.imageFallback]}>
                                            <Ionicons name="image-outline" size={28} color="#8a8a8a" />
                                        </View>
                                    )}

                                    <View style={styles.cardContent}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            {directPrice ? (
                                                <Text style={styles.discountPrice} numberOfLines={1}>
                                                    {directPrice}
                                                </Text>
                                            ) : null}

                                            {distanceText ? (
                                                <Text style={styles.distanceMetaText}>{distanceText}</Text>
                                            ) : null}
                                        </View>

                                        <Text style={styles.title} numberOfLines={1}>
                                            {itemTitle}
                                        </Text>

                                        <Text style={styles.subtitle} numberOfLines={1}>
                                            By {subtitle}
                                        </Text>

                                        <Text style={styles.metaText} numberOfLines={1}>
                                            Offer Type: {offerType}
                                        </Text>

                                        {/* <Text style={styles.validText} numberOfLines={1}>
                                            Expires on: {endDate ? new Date(endDate).toDateString() : "-"}
                                        </Text> */}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar2 />

            {/* ---- Location Section (exact from GoloHome) ---- */}
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

            {/* ---- Search bar ---- */}
            <View style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between", paddingHorizontal: 16
            }}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            const q = searchInput.trim();
                            if (q) {
                                navigation.navigate("GoloHome", { searchQuery: q });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <EvilIcons name="search" size={24} color="#555" />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Search offers or products"
                        value={searchInput}
                        onChangeText={setSearchInput}
                        onSubmitEditing={() => {
                            const q = searchInput.trim();
                            if (q) {
                                navigation.navigate("GoloHome", { searchQuery: q });
                            }
                        }}
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
            </View>

            {/* ---- Main scrollable content ---- */}
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={bannersLoading || sectionsLoading}
                        onRefresh={() => {
                            fetchBanners();
                            fetchSections();
                        }}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ---- Category Strip (First 4 Categories + See All) ---- */}
                <View style={styles.categorySection}>
                    <View style={styles.categoryStripRow}>
                        {STRIP_CATEGORIES.map((item, index) => {
                            const { bg, dark } = CATEGORY_COLORS[item.label] || { bg: "#f0f0f0", dark: "#555" };
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.stripChip}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate("GoloHome", { category: item.label })}
                                >
                                    <View style={[styles.stripIconCircle, { backgroundColor: bg }]}>
                                        <Ionicons name={item.icon} size={18} color={dark} />
                                    </View>
                                    <Text style={[styles.stripText, { color: dark }]} numberOfLines={2}>
                                        {item.displayLabel}
                                    </Text>
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
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ---- Banner Carousel Section ---- */}
                <View style={styles.bannerSection}>
                    <Text style={styles.bannerSectionTitle}>Featured Promotions</Text>

                    {bannersLoading && banners.length === 0 ? (
                        <View style={styles.bannerLoaderBox}>
                            {/* <ActivityIndicator size="small" color="#f8a812" />
                            <Text style={styles.bannerLoaderText}>Loading banners...</Text> */}
                        </View>
                    ) : banners.length === 0 ? (
                        <View style={styles.bannerEmptyBox}>
                            <Ionicons name="megaphone-outline" size={32} color="#ccc" />
                            <Text style={styles.bannerEmptyText}>No promotions available right now</Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                ref={bannerFlatListRef}
                                data={loopingBanners}
                                keyExtractor={(item, index) => `${item.requestId || item._id || item.id || 'static'}-${index}`}
                                renderItem={renderBannerItem}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={onBannerScroll}
                                onScrollBeginDrag={onBannerScrollBeginDrag}
                                onScrollEndDrag={onBannerScrollEndDrag}
                                scrollEventThrottle={16}
                                getItemLayout={getItemLayout}
                                snapToInterval={SLIDE_WIDTH + BANNER_GAP}
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingRight: 0 }}
                            />

                            {/* Dot indicators */}
                            {banners.length > 1 && (
                                <View style={styles.dotsContainer}>
                                    {banners.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                currentBannerIndex === index
                                                    ? styles.dotActive
                                                    : styles.dotInactive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* ---- Dynamic Deals Sections ---- */}
                {sectionsLoading && sections.length === 0 ? (
                    <View style={{ marginVertical: 32, alignItems: "center" }}>
                        <ActivityIndicator size="small" color="#f8a812" />
                        <Text style={{ marginTop: 8, color: "#666", ...textPresets.label }}>Loading deals...</Text>
                    </View>
                ) : (
                    sections.map((section) => renderDealSection(section))
                )}

                {/* Small padding space before footer */}
                <View style={{ height: 20 }} />
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

                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.modalGridCard, { backgroundColor: bg }]}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setAllCategoriesModalOpen(false);
                                            setCategorySearchQuery("");
                                            navigation.navigate("GoloHome", { category: cat });
                                        }}
                                    >
                                        <View style={styles.modalCardIconCircle}>
                                            <Ionicons name={iconName} size={22} color={dark} />
                                        </View>
                                        <Text style={styles.modalCardText} numberOfLines={2}>
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
            <RatingsBox />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        paddingBottom: 60,
    },

    // ─── Location (exact copy from GoloHome) ─────────────────
    locationSection: {
        backgroundColor: "#ffffffe5",
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 40,
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
        justifyContent: "space-between",
    },
    locationLeftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flex: 1,
        marginRight: 8,
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
        top: "100%",
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
        ...textPresets.body,
        color: "#888",
        lineHeight: Math.round(14 * 1.5),
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginTop: 6,
        paddingHorizontal: 6,
        width: "100%",
    },
    searchInput: {
        flex: 1,
        paddingLeft: 5,
        paddingVertical: 10,
        ...textPresets.body,
        top: 3,
    },
    // ─── Category Strip ──────────────────────────────────────
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
        ...textPresets.caption,
    },
    // ─── Banner Carousel ─────────────────────────────────────
    bannerSection: {
        marginTop: 14,
        marginBottom: 10,
    },
    bannerSectionTitle: {
        color: "#1a1a1a",
        marginBottom: 10,
        ...textPresets.subtitle,
    },
    bannerSlide: {
        width: SCREEN_WIDTH - 32,
        height: BANNER_HEIGHT,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#e0e0e0",
    },
    bannerImage: {
        width: "100%",
        height: "100%",
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: "#f8a812",
        width: 20,
        borderRadius: 10,
    },
    dotInactive: {
        backgroundColor: "#d4d4d4",
    },
    bannerLoaderBox: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    bannerLoaderText: {
        color: "#888",
        marginTop: 8,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    bannerEmptyBox: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: "#fafafa",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#ececec",
        borderStyle: "dashed",
    },
    bannerEmptyText: {
        color: "#999",
        marginTop: 8,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    // ─── Deal Sections ───────────────────────────────────────
    sectionContainer: {
        marginTop: 18,
        marginBottom: 8,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        color: "#1a1a1a",
        ...textPresets.subtitle
    },
    viewAllBtn: {
        flexDirection: "row",
        alignItems: "center",
    },
    viewAllText: {
        ...textPresets.label,
        color: "#666",
    },
    dealCardsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dealCardImageContainer: {
        width: "100%",
        height: 110,
        backgroundColor: "#f2f2f2",
        position: "relative",
    },
    dealCardImage: {
        width: "100%",
        height: "100%",
    },
    dealCardContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    viewDealButtonText: {
        color: "#ffffff",
        ...textPresets.label,
    },
    card: {
        width: "48%",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eaeaea",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        marginBottom: 12,
    },
    cardInner: {
        width: "100%",
    },
    image: {
        width: "100%",
        height: 110,
        backgroundColor: "#f2f2f2",
    },
    imageFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    discountPrice: {
        ...textPresets.label,
        color: "green",
    },
    distanceMetaText: {
        ...textPresets.label,
    },
    title: {
        ...textPresets.body,
        color: "#111",
        marginTop: 4,
        lineHeight: Math.round(14 * 1.5),
    },
    subtitle: {
        ...textPresets.label,
        color: "#666",
        marginTop: 5,
    },
    metaText: {
        ...textPresets.label,
        color: "#777",
        marginTop: 5,
    },
    validText: {
        ...textPresets.caption,
        color: "#666",
        marginTop: 6
    },
    // ─── Modal styling ───────────────────────────────────────
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
        ...textPresets.subtitle,
        color: "#111",
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
        color: "#333",
        lineHeight: Math.round(14 * 1.5),
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
        elevation: 1
    },
    modalSearchInput: {
        ...textPresets.body,
        color: "#222",
        paddingVertical: 4,
        top: 3,
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
});