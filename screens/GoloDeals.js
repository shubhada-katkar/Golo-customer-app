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
import { Feather, Ionicons, EvilIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar2 from "../components/Topbar2";
import GoloBottom from "../components/GoloBottom";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

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

export default function GoloDeals() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);

    // ─── Location state ──────────────────────────────────────
    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [gpsPlaceName, setGpsPlaceName] = useState("");
    const [locationPlaceName, setLocationPlaceName] = useState("");
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
        setLocationStatus("granted");
    }, []);

    const handleResetToGPS = useCallback(() => {
        if (gpsCoordinates) {
            setUserCoordinates(gpsCoordinates);
            setLocationPlaceName(gpsPlaceName);
        }
        handleCancelEditingLocation();
    }, [gpsCoordinates, gpsPlaceName, handleCancelEditingLocation]);

    // ─── Fetch banners from backend ──────────────────────────
    const fetchBanners = useCallback(async () => {
        if (!BASE_URL) {
            setBannersLoading(false);
            return;
        }

        try {
            setBannersLoading(true);
            const response = await fetch(`${BASE_URL}/banners/promotions/active?limit=10`);
            const payload = await response.json().catch(() => ({}));
            if (response.ok && Array.isArray(payload?.data)) {
                setBanners(payload.data);
            } else {
                setBanners([]);
            }
        } catch (err) {
            console.error("Failed to fetch banners:", err);
            setBanners([]);
        } finally {
            setBannersLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchBanners();
        }, [fetchBanners])
    );

    // ─── Auto-scroll banners ─────────────────────────────────
    useEffect(() => {
        if (banners.length <= 1) return;

        autoScrollTimer.current = setInterval(() => {
            setCurrentBannerIndex((prev) => {
                const nextIndex = (prev + 1) % banners.length;
                bannerFlatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                return nextIndex;
            });
        }, AUTO_SCROLL_INTERVAL);

        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
        };
    }, [banners.length]);

    const onBannerScroll = useCallback((event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (SCREEN_WIDTH - 32));
        setCurrentBannerIndex(index);
    }, []);

    const onBannerScrollBeginDrag = useCallback(() => {
        // Pause auto-scroll when user swipes
        if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    }, []);

    const onBannerScrollEndDrag = useCallback(() => {
        // Resume auto-scroll after user stops swiping
        if (banners.length <= 1) return;
        autoScrollTimer.current = setInterval(() => {
            setCurrentBannerIndex((prev) => {
                const nextIndex = (prev + 1) % banners.length;
                bannerFlatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                return nextIndex;
            });
        }, AUTO_SCROLL_INTERVAL);
    }, [banners.length]);

    const locationLabel =
        locationStatus === "granted"
            ? locationPlaceName
                ? locationPlaceName
                : "Current location"
            : locationStatus === "loading"
                ? "Checking your location..."
                : "Tap to set location";

    // ─── Render banner item ──────────────────────────────────
    const renderBannerItem = useCallback(({ item }) => {
        return (
            <View style={styles.bannerSlide}>
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                />
                {/* Optional overlay title */}
                {item.bannerTitle ? (
                    <View style={styles.bannerOverlay}>
                        <Text style={styles.bannerTitle} numberOfLines={1}>
                            {item.bannerTitle}
                        </Text>
                        {item.bannerCategory ? (
                            <Text style={styles.bannerCategory} numberOfLines={1}>
                                {item.bannerCategory}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        );
    }, []);

    const getItemLayout = useCallback((data, index) => ({
        length: SCREEN_WIDTH - 32,
        offset: (SCREEN_WIDTH - 32) * index,
        index,
    }), []);

    // ─── Render static deals sections ─────────────────────────
    const renderDealSection = (title) => {
        const isHot = title === "Flash Deals" || title === "Trending Deals";
        const badgeText = isHot ? "HOT DEAL" : "50% OFF";

        const mockCards = [
            {
                id: `card-${title}-1`,
                title: "Local Shop 1",
                description: "High-quality local products available at a special price",
                badge: badgeText,
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
            },
            {
                id: `card-${title}-2`,
                title: "Local Shop 2",
                description: "High-quality local products available at a special price",
                badge: badgeText,
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=60",
            }
        ];

        return (
            <View style={styles.sectionContainer} key={title}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("GoloHome")} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>See All</Text>
                        <Ionicons name="arrow-forward" size={14} color="#555" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>

                <View style={styles.dealCardsRow}>
                    {mockCards.map((card) => (
                        <TouchableOpacity
                            key={card.id}
                            style={styles.dealCard}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate("GoloHome")}
                        >
                            <View style={styles.dealCardImageContainer}>
                                <Image source={{ uri: card.image }} style={styles.dealCardImage} />
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{card.badge}</Text>
                                </View>
                            </View>
                            <View style={styles.dealCardContent}>
                                <Text style={styles.dealCardTitle} numberOfLines={1}>
                                    {card.title}
                                </Text>
                                <Text style={styles.dealCardDescription} numberOfLines={2}>
                                    {card.description}
                                </Text>
                                <TouchableOpacity
                                    style={styles.viewDealButton}
                                    onPress={() => navigation.navigate("GoloHome")}
                                >
                                    <Text style={styles.viewDealButtonText}>View Deal</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
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
                    <EvilIcons name="search" size={24} color="#555" />
                    <TextInput
                        placeholder="Search offers or products"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 8 }}>
                            <Ionicons name="close-circle" size={18} color="#555" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ---- Main scrollable content ---- */}
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={bannersLoading} onRefresh={fetchBanners} />
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
                                    <Text style={[styles.stripText, { color: dark }]} numberOfLines={1}>
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
                            <ActivityIndicator size="small" color="#f8a812" />
                            <Text style={styles.bannerLoaderText}>Loading banners...</Text>
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
                                data={banners}
                                keyExtractor={(item) => item.requestId || item._id || String(Math.random())}
                                renderItem={renderBannerItem}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={onBannerScroll}
                                onScrollBeginDrag={onBannerScrollBeginDrag}
                                onScrollEndDrag={onBannerScrollEndDrag}
                                scrollEventThrottle={16}
                                getItemLayout={getItemLayout}
                                snapToInterval={SCREEN_WIDTH - 32}
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

                {/* ---- Five Deals Sections ---- */}
                {renderDealSection("Flash Deals")}
                {renderDealSection("Nearby Deals")}
                {renderDealSection("Recommended Deals")}
                {renderDealSection("Bestseller")}
                {renderDealSection("Trending Deals")}

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        paddingBottom: 100,
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
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        flexShrink: 1,
    },
    locationInput: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Medium",
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
        fontSize: 13,
        fontFamily: "Medium",
        color: "#333",
        lineHeight: 18,
    },
    suggestionLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
    },
    suggestionLoadingText: {
        fontSize: 13,
        fontFamily: "Medium",
        color: "#888",
    },

    // ─── Search ──────────────────────────────────────────────
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
        paddingVertical: 6,
        fontFamily: "Medium",
        fontSize: 14,
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
        fontSize: 10,
        fontFamily: "SemiBold",
        textAlign: "center",
    },

    // ─── Banner Carousel ─────────────────────────────────────
    bannerSection: {
        marginTop: 14,
        marginBottom: 10,
    },
    bannerSectionTitle: {
        fontSize: 17,
        fontFamily: "Bold",
        lineHeight: Math.round(17 * 1.5),
        color: "#1a1a1a",
        marginBottom: 10,
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
    bannerOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    bannerTitle: {
        color: "#fff",
        fontSize: 15,
        fontFamily: "Bold",
        lineHeight: Math.round(15 * 1.4),
    },
    bannerCategory: {
        color: "#ffffffcc",
        fontSize: 12,
        fontFamily: "Medium",
        marginTop: 2,
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
        fontFamily: "Medium",
        fontSize: 13,
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
        fontFamily: "Medium",
        fontSize: 13,
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
        fontSize: 17,
        fontFamily: "Bold",
        color: "#1a1a1a",
    },
    viewAllBtn: {
        flexDirection: "row",
        alignItems: "center",
    },
    viewAllText: {
        fontSize: 12,
        color: "#555",
        fontFamily: "SemiBold",
        lineHeight: Math.round(12 * 1.4),
    },
    dealCardsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dealCard: {
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
    badgeContainer: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "#ff4d4d",
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgeText: {
        color: "#ffffff",
        fontSize: 9,
        fontFamily: "Bold",
    },
    dealCardContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    dealCardTitle: {
        fontSize: 14,
        fontFamily: "Bold",
        color: "#111",
        marginBottom: 3,
    },
    dealCardDescription: {
        fontSize: 11,
        fontFamily: "Medium",
        color: "#666",
        lineHeight: 15,
        height: 30,
        marginBottom: 8,
    },
    viewDealButton: {
        backgroundColor: "#157a4f",
        borderRadius: 6,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    viewDealButtonText: {
        color: "#ffffff",
        fontSize: 12,
        fontFamily: "Bold",
        lineHeight: Math.round(12 * 1.4),
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
        fontSize: 20,
        fontFamily: "Bold",
        color: "#111",
        lineHeight: Math.round(20 * 1.4),
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
        fontSize: 13,
        fontFamily: "SemiBold",
        color: "#333",
        lineHeight: Math.round(13 * 1.4),
    },
    modalSearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e2e2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: "Medium",
        color: "#222",
        paddingVertical: 0,
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
        marginBottom: 16,
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
        fontSize: 12,
        fontFamily: "Bold",
        textAlign: "center",
        color: "#111",
        lineHeight: 16,
    },
});
