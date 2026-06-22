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
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar2 from "../components/Topbar2";
import GoloBottom from "../components/GoloBottom";
import { fetchAllOffers } from "../services/offersService";
import { LinearGradient } from "expo-linear-gradient";

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

const DEFAULT_RADIUS_KM = 50;

export default function GoloHome() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [locationPlaceName, setLocationPlaceName] = useState("");
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

                try {
                    const geocode = await Location.reverseGeocodeAsync({
                        latitude: coords.lat,
                        longitude: coords.lng,
                    });

                    if (!isMounted) {
                        return;
                    }

                    const place = geocode?.[0] || {};
                    const placeText = [
                        place?.name,
                        place?.street,
                        place?.city,
                        place?.subregion,
                        place?.region,
                        place?.country,
                    ]
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(", ");

                    setLocationPlaceName(placeText || "your current area");
                } catch (geocodeError) {
                    if (!isMounted) {
                        return;
                    }
                    setLocationPlaceName("your current area");
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

    const fetchOffers = React.useCallback(async () => {
        setLoading(true);

        try {
            setError("");
            const offersData = await fetchAllOffers({
                limit: 100,
                page: 1,
                radiusKm: DEFAULT_RADIUS_KM,
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
    }, [selectedCategory, userCoordinates?.lat, userCoordinates?.lng]);

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

    const locationLabel =
        locationStatus === "granted"
            ? locationPlaceName
                ? `Location: ${locationPlaceName}`
                : "Current location"
            : locationStatus === "loading"
                ? "Checking your location..."
                : "No access to location";

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
            <LinearGradient
                         colors={["#f8a812", "#fad081",  "#f8f6f265"]}
                         start={{ x: 0, y: 0 }}
                         end={{ x: 0, y: 1 }}
                         style={{height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                    />
            <Topbar2 />

                <View style={{flexDirection:"row", alignItems:"center",
                    justifyContent:"space-between", paddingHorizontal:16, paddingVertical:5
                }}>
                <View style={styles.locationSection}>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color="#000000" />
                        <Text style={[styles.locationText]}
                        numberOfLines={1} ellipsizeMode="tail">
                            {locationLabel}
                        </Text>
                    </View>               
                </View>

                <TouchableOpacity style={styles.filterbtn} onPress={() => navigation.navigate("FilterPage")}>
                <Feather name="filter" size={18}/>

                </TouchableOpacity>
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
                                  
           <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchOffers} />
                }
                showsVerticalScrollIndicator={false}
            >

                  <View style={styles.categorySection}>
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
                                                scrollRef.current?.scrollTo({ x: 0, animated: true });
                                            }
                                        }}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
                
                {loading && !offers.length ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="small" color="#157a4f" />
                        <Text style={styles.helperText}>Loading live offers...</Text>
                    </View>
                ) : filteredOffers.length ? (
                    <View style={styles.cardsGrid}>
                        {filteredOffers.map((item, index) => (
                            <OfferCard
                                key={item?.requestId || item?._id || item?.offerId || `offer-${index}`}
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
    <TouchableOpacity onPress={onPress} style={styles.chip}>
        <Ionicons
            name={icon}
            size={20}
            color={isActive ? "#157a4f" : "#000000"}
        />
        <Text
            style={[
                styles.chipText,
                { color: isActive ? "#157a4f" : "#000000" },
            ]}
            numberOfLines={2}
        >
            {label}
        </Text>
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
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        {distanceText ? <Text style={styles.distanceMetaText}>{distanceText}</Text> : null}
                    </View>

                    <Text style={styles.subtitle} numberOfLines={1}>
                        By {subtitle}
                    </Text>

                    <Text style={styles.metaText} numberOfLines={1}>Offer Type: {offerType}</Text>

                    <Text style={styles.validText} numberOfLines={1}>
                        Valid Till: {endDate ? new Date(endDate).toDateString() : "-"}
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
        paddingBottom:100
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
       backgroundColor:"#f5b949e5",
       borderRadius:12,
       padding:10,
       width:"88%"
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        flexShrink: 1,
    },
    locationHint: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },
    filterbtn:{
        alignItems:"center",
        borderRadius:10,
        backgroundColor:"#f5b949e5",
        padding:10,
        justifyContent:"center"
    },
    categorySection: {
        marginBottom:8
    },
    categoryStrip: {
        flexDirection: "row",
        alignItems: "center",
    },
    chipsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap:16
    },
    chip: {
        alignItems: "center",
        width:80,
    },
    chipText: {
        fontSize: 11,
        fontFamily: "Medium",
        lineHeight: Math.round(11 * 1.5),
        textAlign: "center",
        minHeight:32
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
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap:10
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontFamily: "Bold",
        lineHeight: Math.round(15 * 1.4),
    },
    subtitle: {
        marginTop: 5,
        color: "#666",
        fontFamily: "Medium",
        fontSize: 13,
        lineHeight: Math.round(13 * 1.5),
    },
    metaText: {
        marginTop: 10,
        fontFamily: "Medium",
        fontSize: 12,
        lineHeight: Math.round(12 * 1.5),
    },
    validText: {
        fontSize: 12,
        marginTop: 6,
        color: "#555",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },
    distanceMetaText: {
        fontSize: 12,
        color: "#157a4f",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
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
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginHorizontal:16,
        marginVertical:6
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontFamily: "Medium",
        fontSize: 14,
    },
});