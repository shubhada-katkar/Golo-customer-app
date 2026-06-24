import React, { useCallback, useContext, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
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
import { fetchMyClaimedOffers } from "../services/voucherService";
import { LinearGradient } from "expo-linear-gradient";

export default function Claimed({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [claimedOffers, setClaimedOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

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

    const activeClaimedOffers = claimedOffers.filter(
        (item) => !isOfferExpired(item) && isValidClaimedDeal(item)
    );

    const loadClaimedOffers = useCallback(async ({ isRefresh = false } = {}) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            const data = await fetchMyClaimedOffers({ limit: 100 });
            const normalizedOffers = Array.isArray(data)
                ? data.filter((item) => !isOfferExpired(item) && isValidClaimedDeal(item))
                : [];
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
             colors={["#f8a812", "#fad081",  "#f8f6f265"]}
             start={{ x: 0, y: 0 }}
             end={{ x: 0, y: 1 }}
             style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
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
                <View style={{flexDirection:"column"}}>
                <Text style={{ fontSize: 20, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.5) }}>Claimed Offers</Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical: 6}} />

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadClaimedOffers({ isRefresh: true })}
                            tintColor={colors.text}
                        />
                    }
                >
                    {error ? (
                        <Text style={[styles.infoText, { color: "#D32F2F" }]}>{error}</Text>
                    ) : null}

                    {!error && activeClaimedOffers.length === 0 ? (
                        <Text style={[styles.infoText, { color: colors.text }]}> 
                            No active claimed offers yet.
                        </Text>
                    ) : null}

                    {activeClaimedOffers.map((item, index) => {
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

                        return (
                            <TouchableOpacity
                                key={displayItem?.offerId || displayItem?._id || displayItem?.requestId || item?.id || `claimed-${index}`}
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
                                    <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text, lineHeight: Math.round(16 * 1.5) }} numberOfLines={1}>
                                        {offerTitle}
                                    </Text>

                                    <Text style={{ fontSize: 12, color: colors.text, lineHeight: Math.round(12 * 1.5), fontFamily:"Medium" }} numberOfLines={1}>
                                        Deal by {merchantName}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginHorizontal: 14,
        marginTop: 14,
        borderRadius: 12,
        backgroundColor:"#ffffff",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },
    offerImage: {
        width: 80,
        height: 80,
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
        fontFamily: "Medium",
        paddingHorizontal: 20,
    },
})