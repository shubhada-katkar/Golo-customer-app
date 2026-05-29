import React, { useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { fetchAllOffers } from "../services/offersService";

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

const getDiscountPrice = (item) =>
    formatPrice(
        item?.discountedPrice ||
        item?.offerPrice ||
        item?.salePrice ||
        item?.finalPrice ||
        item?.displayPrice
    );

const getOriginalPrice = (item) =>
    formatPrice(
        item?.originalPrice ||
        item?.mrp ||
        item?.price ||
        item?.regularPrice ||
        item?.totalPrice
    );

const getDistanceText = (value) => {
    const distance = Number(value);
    if (!Number.isFinite(distance) || distance < 0) {
        return null;
    }

    return distance < 1
        ? `${Math.round(distance * 1000)} m away`
        : `${distance.toFixed(1)} km away`;
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

export default function GoloHome() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDistanceKm, setSelectedDistanceKm] = useState(5);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const scrollRef = useRef(null);

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

    const sortedCategories = selectedCategory
        ? [
            categories.find((c) => c.label === selectedCategory),
            ...categories.filter((c) => c.label !== selectedCategory),
        ].filter(Boolean)
        : categories;

    useEffect(() => {
        let isMounted = true;

        const getUserLocation = async () => {
            try {
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

                setUserCoordinates({
                    lat: current?.coords?.latitude,
                    lng: current?.coords?.longitude,
                });
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

    const fetchOffers = React.useCallback(async () => {
        setLoading(true);

        try {
            setError("");
            const offersData = await fetchAllOffers({
                limit: 100,
                page: 1,
                radiusKm: selectedDistanceKm,
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
    }, [selectedCategory, selectedDistanceKm, userCoordinates?.lat, userCoordinates?.lng]);

    useFocusEffect(
        React.useCallback(() => {
            fetchOffers();
        }, [fetchOffers])
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

    const filteredOffers = offers
        .filter(
            (offer) =>
                isOfferCurrentlyActive(offer) &&
                categoryMatches(offer, selectedCategory) &&
                offerMatchesSearch(offer, searchQuery)
        )
        .sort((offerA, offerB) => {
            const distanceA = Number(offerA?.distanceKm);
            const distanceB = Number(offerB?.distanceKm);
            const hasDistanceA = Number.isFinite(distanceA);
            const hasDistanceB = Number.isFinite(distanceB);

            if (hasDistanceA && hasDistanceB) {
                return distanceA - distanceB;
            }

            if (hasDistanceA) {
                return -1;
            }

            if (hasDistanceB) {
                return 1;
            }

            return (
                new Date(offerB?.createdAt || offerB?.updatedAt || 0).getTime() -
                new Date(offerA?.createdAt || offerA?.updatedAt || 0).getTime()
            );
        });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchOffers} />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topRow}>
                    <View style={styles.headerRow}>
                        <Ionicons name="star-outline" size={16} style={{ color: colors.text }} />
                        <Text style={[styles.headerText, { color: colors.text }]}>
                            Discover What's Nearby</Text>
                    </View>
                </View>

                <View style={styles.distanceSection}>
                    <View style={styles.distanceHeaderRow}>
                        <Text style={[styles.distanceTitle, { color: colors.text }]}>Distance</Text>
                        <Text style={styles.distanceValue}>Selected: {selectedDistanceKm} km</Text>
                    </View>

                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={50}
                            step={1}
                            value={selectedDistanceKm}
                            onValueChange={(value) => setSelectedDistanceKm(Math.round(value))}
                            minimumTrackTintColor="#157a4f"
                            maximumTrackTintColor="#d9d9d9"
                            thumbTintColor="#157a4f"
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6}}>
                            <Text style={{ fontSize: 12, fontFamily: "Medium", color: colors.text,
                                lineHeight: Math.round(12 * 1.5) }}>1 km</Text>
                            <Text style={{ fontSize: 12, fontFamily: "Medium", color: colors.text,
                                lineHeight: Math.round(12 * 1.5) }}>50 km</Text>
                        </View>
                    </View>

                    {locationStatus !== "granted" ? (
                        <Text style={[styles.distanceHint, { color: colors.text }]}>
                            Location is off. Showing all deals.
                        </Text>
                    ) : (
                        <Text style={[styles.distanceHint, { color: colors.text }]}>
                            Showing offers within {selectedDistanceKm} km from your location.
                        </Text>
                    )}
                </View>

                <View style={styles.searchContainer}>
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

                <View style={styles.categorySection}>
                    {!showAllCategories ? (
                        <View style={styles.categoryStrip}>
                            <ScrollView
                                ref={scrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            >
                                <View style={styles.chipsRow}>
                                    {sortedCategories.map((item, index) => (
                                        <CategoryChip
                                            key={`${item.label}-${index}`}
                                            icon={item.icon}
                                            label={item.label}
                                            isActive={selectedCategory === item.label}
                                            onPress={() => {
                                                if (selectedCategory === item.label) {
                                                    setSelectedCategory(null);
                                                } else {
                                                    setSelectedCategory(item.label);
                                                    setShowAllCategories(false);
                                                    scrollRef.current?.scrollTo({ x: 0, animated: true });
                                                }
                                            }}
                                        />
                                    ))}
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={() => setShowAllCategories(true)}>
                                <Text style={[styles.seeAllText, { color: colors.text }]}>See All</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <TouchableOpacity
                                onPress={() => setShowAllCategories(false)}
                                style={styles.hideCategoriesButton}
                            >
                                <Text style={[styles.headerText, { color: colors.text }]}>
                                    Hide Categories
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.categoryGrid}>
                                {sortedCategories.map((item, index) => (
                                    <TouchableOpacity 
                                        key={`${item.label}-${index}`}
                                        onPress={() => {
                                            if (selectedCategory === item.label) {
                                                setSelectedCategory(null);
                                            } else {
                                                setSelectedCategory(item.label);
                                                setShowAllCategories(false);
                                                scrollRef.current?.scrollTo({ x: 0, animated: true });
                                            }
                                        }}
                                        style={[
                                            styles.gridItem,
                                            selectedCategory === item.label && styles.gridItemActive,
                                        ]}
                                    >
                                        <Ionicons
                                        style={{ marginRight: 6 }}
                                            name={item.icon}
                                            size={18}
                                            color={selectedCategory === item.label ? "#000" : "#000000"}
                                        />
                                        <Text
                                            style={[
                                                styles.gridText,
                                                { color: selectedCategory === item.label ? "#000" : "#000000" },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {loading && !offers.length ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="small" color="#157a4f" />
                        <Text style={styles.helperText}>Loading live offers...</Text>
                    </View>
                ) : filteredOffers.length ? (
                    filteredOffers.map((item, index) => (
                        <OfferCard
                            key={item?.requestId || item?._id || item?.offerId || `offer-${index}`}
                            item={item}
                            navigation={navigation}
                        />
                    ))
                ) : (
                    <View style={styles.centerState}>
                        <Text style={styles.emptyTitle}>
                            {error || "No offers found"}
                        </Text>
                        <Text style={styles.helperText}>
                            Pull down to refresh and check for new nearby deals.
                        </Text>
                    </View>
                )}
            </ScrollView>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
                <GoloBottom />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const CategoryChip = ({ icon, label, isActive, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.chip,
            isActive && { backgroundColor: "#f1d94e", borderColor: "#000", borderWidth: 1.5 },
        ]}
    >
        <Ionicons name={icon} size={16} color={isActive ? "#000" : "#000000"} />
        <Text style={[styles.chipText, { color: isActive ? "#000" : "#000000" }]}>{label}</Text>
    </TouchableOpacity>
);

const OfferCard = ({ item, navigation }) => {
    const productImage = getOfferImage(item);
    const title = getOfferTitle(item);
    const subtitle = getOfferSubtitle(item);
    const offerType = item?.bannerCategory || item?.offerType || item?.category || "-";
    const endDate = item?.endDate || item?.validTo || null;
    const requestStatus = item?.status || "active";
    const normalizedStatus = String(requestStatus).replace(/_/g, " ");
    const discountPrice = getDiscountPrice(item);
    const originalPrice = getOriginalPrice(item);
    const distanceText = getDistanceText(item?.distanceKm);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => navigation.navigate("OfferDetails", { offerData: item })}
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
                    <View style={styles.rowBetween}>
                        <Text style={styles.title} numberOfLines={2}>
                            {title}
                        </Text>
                    </View>

                    <Text style={styles.subtitle} numberOfLines={1}>
                        By {subtitle}
                    </Text>

                    <Text style={styles.metaText}>Offer Type: {offerType}</Text>

                    <Text style={styles.validText}>
                        Valid Till: {endDate ? new Date(endDate).toDateString() : "-"}
                    </Text>

                    <View style={{  alignSelf: "flex-end", justifyContent: "center" 
                    }} >

                    {distanceText ? <Text style={styles.distanceMetaText}>{distanceText}</Text> : null}

                    </View>

                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 90,
    },
    topRow: {
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 10,
    },
    distanceSection: {
        marginBottom: 14,
    },
    distanceHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    distanceTitle: {
        fontSize: 14,
        fontFamily: "Medium",
    },
    distanceValue: {
        fontSize: 13,
        color: "#157a4f",
        fontFamily: "Medium",
    },
    distanceChipsRow: {
        paddingBottom: 6,
    },
    distanceChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#d9d9d9",
        marginRight: 8,
        backgroundColor: "#fff",
    },
    distanceChipActive: {
        backgroundColor: "#157a4f",
        borderColor: "#157a4f",
    },
    distanceChipText: {
        color: "#1f1f1f",
        fontFamily: "Medium",
        fontSize: 12,
    },
    distanceChipTextActive: {
        color: "#fff",
    },
    distanceHint: {
        marginTop: 4,
        color: "#3d3d3d",
        fontSize: 12,
        fontFamily: "Medium",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerText: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
        paddingVertical: 5,
    },
    categorySection: {
        marginTop: 12,
        marginBottom: 12,
        paddingHorizontal:6,
        paddingVertical:6
    },
    categoryStrip: {
        height: 45,
        flexDirection: "row",
        alignItems: "center",
    },
    chipsRow: {
        flexDirection: "row",
        marginBottom: 10,
        alignItems: "center",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderColor: "#000000",
        borderWidth: 1,
    },
    chipText: {
        marginLeft: 6,
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.4),
    },
    seeAllText: {
        fontSize: 16,
        fontFamily: "Medium",
        paddingLeft: 10,
        marginTop: -10,
    },
    hideCategoriesButton: {
        alignSelf: "flex-end",
        marginRight: 6,
        bottom: 5,
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        justifyContent: "space-around",
    },
    gridItem: {
        width: "49%",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        paddingVertical: 8,
        marginBottom: 10,
        alignItems: "center",
        flexDirection: "row",
        borderColor: "#000000",
        borderWidth: 1,
        paddingLeft: 6,
        paddingRight: 22,
    },
    gridItemActive: {
        backgroundColor: "#FFD700",
    },
    gridText: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        textAlign: "center",
    },
    card: {
        borderRadius: 10,
        minHeight: 120,
        borderWidth: 1,
        borderColor: "#ececec",
        elevation: 5,
        backgroundColor: "#fff",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 18,
    },
    cardInner: {
        flexDirection: "row",
    },
    image: {
        width: 120,
        height: 130,
        backgroundColor: "#b8b8b8",
        borderRadius: 12,
    },
    imageFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 10,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontFamily: "Bold",
        lineHeight: Math.round(18 * 1.5),
    },
    subtitle: {
        marginTop: 5,
        color: "#666",
        fontFamily: "Medium",
        fontSize: 13,
        lineHeight: Math.round(13 * 1.5),
    },
    metaText: {
        marginTop: 5,
        fontFamily: "Medium",
        fontSize: 12,
        lineHeight: Math.round(12 * 1.5),
    },
    validText: {
        fontSize: 12,
        marginTop: 6,
        color: "#555",
        fontFamily: "Medium",
    },
    distanceMetaText: {
        fontSize: 14,
        marginTop: 4,
        color: "#157a4f",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    statusText: {
        textTransform: "capitalize",
        fontFamily: "Medium",
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
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 6,
    },
    discountPrice: {
        color: "green",
        marginRight: 10,
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    originalPrice: {
        color: "red",
        textDecorationLine: "line-through",
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.4),
    },
    centerState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    emptyTitle: {
        textAlign: "center",
        fontSize: 16,
        fontFamily: "Medium",
    },
    helperText: {
        textAlign: "center",
        marginTop: 8,
        color: "#666",
        fontFamily: "Medium",
    },
    searchContainer: {
        top:-5,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f1f1",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontFamily: "Medium",
        fontSize: 14,
    },
});