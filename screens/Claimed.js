import React, { useCallback, useContext, useMemo, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchMyClaimedOffers, getCachedClaimedOffers } from "../services/voucherService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { ClaimedSkeleton } from "../components/Skeleton";

const isOfferExpired = (offer) => {
    if (!offer) return false;

    const displayItem = offer?.offer || offer;
    const status = String(
        offer?.status ||
        offer?.voucherStatus ||
        displayItem?.status ||
        displayItem?.voucherStatus ||
        ""
    ).toLowerCase();
    if (status === "expired" || status === "expired_offer") {
        return true;
    }

    const expiryValue =
        offer?.endDate ||
        offer?.validTo ||
        offer?.expiresAt ||
        offer?.expiryDate ||
        offer?.expiry ||
        displayItem?.endDate ||
        displayItem?.validTo ||
        displayItem?.expiresAt ||
        displayItem?.expiryDate ||
        displayItem?.expiry ||
        displayItem?.offer?.endDate ||
        displayItem?.offer?.validTo ||
        displayItem?.offer?.expiresAt ||
        displayItem?.offer?.expiryDate ||
        displayItem?.offer?.expiry;

    if (!expiryValue) {
        return false;
    }

    const expiryDate = new Date(expiryValue);
    if (Number.isNaN(expiryDate.getTime())) {
        return false;
    }

    return expiryDate.getTime() < Date.now();
};

const getClaimDisplayItem = (item) => item?.offer || item;

const isValidClaimedDeal = (item) => {
    const displayItem = getClaimDisplayItem(item);
    return Boolean(
        displayItem?.offerId ||
        displayItem?._id ||
        displayItem?.requestId ||
        displayItem?.id
    );
};

const ClaimedOfferCard = React.memo(({ item, navigation, colors }) => {
    const displayItem = getClaimDisplayItem(item);
    const offerTitle = displayItem?.title || displayItem?.bannerTitle || "Untitled Offer";
    const merchantName =
        displayItem?.merchantName ||
        displayItem?.shopName ||
        displayItem?.businessName ||
        displayItem?.storeName ||
        displayItem?.merchant?.name ||
        "Unknown Merchant";
    const imageUri =
        displayItem?.image ||
        displayItem?.imageUrl ||
        displayItem?.offerImage ||
        displayItem?.selectedProducts?.[0]?.imageUrl ||
        null;

    const expired = isOfferExpired(item);
    const isRedeemed = item.status === "redeemed";

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate("OfferDetails", { offerData: displayItem })}
            activeOpacity={0.8}
            style={styles.card}
        >
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.offerImage} />
            ) : (
                <View style={styles.imagePlaceholder} />
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ flex: 1, marginRight: 8, ...textPresets.body, lineHeight: Math.round(14 * 1.5) }} numberOfLines={1}>
                        {offerTitle}
                    </Text>
                    {isRedeemed ? (
                        <View style={[styles.badge, { backgroundColor: "#e8f5e9" }]}>
                            <Text style={[styles.badgeText, { color: "#2e7d32" }]}>REDEEMED</Text>
                        </View>
                    ) : expired ? (
                        <View style={[styles.badge, { backgroundColor: "#ffebee" }]}>
                            <Text style={[styles.badgeText, { color: "#c62828" }]}>EXPIRED</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: "#e3f2fd" }]}>
                            <Text style={[styles.badgeText, { color: "#1565c0" }]}>ACTIVE</Text>
                        </View>
                    )}
                </View>

                <Text style={{ ...textPresets.caption, color: colors.text, marginTop: 2 }} numberOfLines={1}>
                    Deal by {merchantName}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

export default function Claimed({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [claimedOffers, setClaimedOffers] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("all"); // "active" | "all" | "redeemed" | "expired"
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadClaimedOffers = useCallback(async ({ isRefresh = false } = {}) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                // Stale-While-Revalidate: Show cached data immediately if available
                const cached = await getCachedClaimedOffers();
                if (Array.isArray(cached) && cached.length > 0) {
                    setClaimedOffers(cached);
                    setLoading(false);
                } else {
                    setLoading(true);
                }
            }

            setError("");
            const data = await fetchMyClaimedOffers({ limit: 100 });
            const normalizedOffers = Array.isArray(data) ? data : [];
            setClaimedOffers(normalizedOffers);
        } catch (err) {
            const message = String(err?.message || "Unable to load claimed offers");
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadClaimedOffers();
        }, [loadClaimedOffers]),
    );

    const activeSavingsCount = useMemo(
        () => claimedOffers.filter((item) => item.status === "active" && !isOfferExpired(item) && isValidClaimedDeal(item)).length,
        [claimedOffers]
    );

    const claimedCodesCount = useMemo(
        () => claimedOffers.filter(isValidClaimedDeal).length,
        [claimedOffers]
    );

    const totalRedeemedCount = useMemo(
        () => claimedOffers.filter((item) => item.status === "redeemed" && isValidClaimedDeal(item)).length,
        [claimedOffers]
    );

    const expiredCount = useMemo(
        () => claimedOffers.filter((item) => (item.status === "expired" || isOfferExpired(item)) && isValidClaimedDeal(item)).length,
        [claimedOffers]
    );

    const filteredOffers = useMemo(() => {
        return claimedOffers.filter((item) => {
            if (!isValidClaimedDeal(item)) return false;
            if (selectedFilter === "active") {
                return item.status === "active" && !isOfferExpired(item);
            }
            if (selectedFilter === "redeemed") {
                return item.status === "redeemed";
            }
            if (selectedFilter === "expired") {
                return item.status === "expired" || isOfferExpired(item);
            }
            return true; // "all"
        });
    }, [claimedOffers, selectedFilter]);

    const renderItem = useCallback(({ item }) => (
        <ClaimedOfferCard item={item} navigation={navigation} colors={colors} />
    ), [navigation, colors]);

    const keyExtractor = useCallback((item, index) => {
        const displayItem = getClaimDisplayItem(item);
        return String(displayItem?.offerId || displayItem?._id || displayItem?.requestId || item?.id || `claimed-${index}`);
    }, []);

    const ListHeader = useMemo(() => (
        <>
            <View style={styles.metricsGrid}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedFilter("all")}
                    style={[
                        styles.metricCard,
                        selectedFilter === "all" && styles.metricCardActive,
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: "#eff6ff" }]}>
                        <MaterialIcons name="qr-code" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.metricTextWrap}>
                        <Text style={styles.metricCount}>{claimedCodesCount}</Text>
                        <Text style={styles.metricLabel}>Claimed Codes</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedFilter("redeemed")}
                    style={[
                        styles.metricCard,
                        selectedFilter === "redeemed" && styles.metricCardActive,
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: "#fffbeb" }]}>
                        <MaterialIcons name="check-circle" size={20} color="#d97706" />
                    </View>
                    <View style={styles.metricTextWrap}>
                        <Text style={styles.metricCount}>{totalRedeemedCount}</Text>
                        <Text style={styles.metricLabel}>Total Redeemed</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedFilter("expired")}
                    style={[
                        styles.metricCard,
                        selectedFilter === "expired" && styles.metricCardActive,
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: "#fef2f2" }]}>
                        <MaterialIcons name="history" size={20} color="#ef4444" />
                    </View>
                    <View style={styles.metricTextWrap}>
                        <Text style={styles.metricCount}>{expiredCount}</Text>
                        <Text style={styles.metricLabel}>Expired</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {error ? (
                <Text style={[styles.infoText, { color: "#D32F2F" }]}>{error}</Text>
            ) : null}

            {!error && !loading && filteredOffers.length === 0 ? (
                <Text style={[styles.infoText, { color: colors.text }]}>
                    {selectedFilter === "active" && "No active claimed offers."}
                    {selectedFilter === "redeemed" && "No redeemed offers."}
                    {selectedFilter === "expired" && "No expired offers."}
                    {selectedFilter === "all" && "No claimed offers found."}
                </Text>
            ) : null}
        </>
    ), [selectedFilter, claimedCodesCount, totalRedeemedCount, expiredCount, error, loading, filteredOffers.length, colors.text]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: "column" }}>
                    <Text style={{ ...textPresets.title }}>Claimed Offers</Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical: 6 }} />

            {loading ? (
                <ClaimedSkeleton count={4} />
            ) : (
                <FlatList
                    data={filteredOffers}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ paddingBottom: 90 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadClaimedOffers({ isRefresh: true })}
                            tintColor={colors.text}
                        />
                    }
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <GoloBottom />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14
    },
    metricsGrid: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingHorizontal: 4,
        marginTop: 10,
    },
    metricCard: {
        width: "30%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: "transparent",
    },
    metricCardActive: {
        borderColor: "#f8a812",
        backgroundColor: "#fffdf9",
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    metricTextWrap: {
        marginLeft: 10,
        flex: 1,
    },
    metricCount: {
        ...textPresets.body,
        color: "#111827",
    },
    metricLabel: {
        ...textPresets.caption,
        color: "#6b7280",
        marginTop: 1,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        ...textPresets.caption,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginHorizontal: 14,
        marginTop: 14,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    imagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },
    offerImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },
    centerWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    infoText: {
        marginTop: 24,
        textAlign: "center",
        ...textPresets.caption,
        paddingHorizontal: 20,
    },
});