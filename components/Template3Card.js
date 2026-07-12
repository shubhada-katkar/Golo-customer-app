import React, { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Share,
    ActivityIndicator
} from "react-native";
import { Ionicons, Entypo, MaterialIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from "../services/favoritesService";
import { trackAdCardClick, trackContactClick } from "../services/analyticsService";
import { BASE_URL } from "../config";
import { ensureAuthenticated } from "../services/authService";

const GENERIC_SELLER_NAMES = new Set(["seller", "user", "anonymous", "unknown"]);

const getAdSellerName = (ad) =>
    ad?.sellerName ||
    ad?.user?.name ||
    ad?.contactInfo?.name ||
    ad?.contactInfo?.sellerName ||
    ad?.name ||
    null;

const isGenericSellerName = (name) => {
    if (!name) return true;
    const text = String(name).trim().toLowerCase();
    return GENERIC_SELLER_NAMES.has(text);
};

export default function Template3Card({ ad, navigation }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [sellerName, setSellerName] = useState(() => getAdSellerName(ad) || "Seller");

    useEffect(() => {
        const initialName = getAdSellerName(ad);
        if (initialName && !isGenericSellerName(initialName)) {
            setSellerName(initialName);
            return;
        }

        const sellerId = ad?.userId || ad?.user?.id;
        if (!sellerId) {
            setSellerName(initialName || "Seller");
            return;
        }

        const fetchSellerName = async () => {
            try {
                const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(sellerId)}`);
                const json = await response.json();
                if (json?.success && json?.data?.name) {
                    setSellerName(json.data.name);
                } else {
                    setSellerName(initialName || "Seller");
                }
            } catch (error) {
                console.warn("Template3Card: failed to fetch seller name", error);
                setSellerName(initialName || "Seller");
            }
        };

        fetchSellerName();
    }, [ad]);

    useEffect(() => {
        const loadFavoriteState = async () => {
            const adId = getAdId(ad);
            if (!adId) return;
            const value = await isFavoriteAdId(adId);
            setIsFavorite(value);
        };

        loadFavoriteState();
    }, [ad]);

    const handleFavoriteToggle = async () => {
        if (favoriteLoading) return;
        setFavoriteLoading(true);
        try {
            const result = await toggleFavoriteAd(ad);
            setIsFavorite(result.isFavorite);
        } catch (error) {
            console.log("favorite toggle failed", error.message);
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleOpenChat = async () => {
        try {
            await ensureAuthenticated(navigation);
        } catch {
            return;
        }

        const adIdentifier = ad?.adId || ad?._id;
        if (adIdentifier) {
            trackContactClick(adIdentifier).catch((error) => {
                console.warn('[Template3Card] Failed to track contact click:', error.message);
            });
        }

        navigation.navigate("ChatScreen", {
            adId: adIdentifier,
            sellerId: ad?.userId || ad?.user?.id,
            sellerName,
            adRef: {
                adId: adIdentifier,
                image: ad?.images?.[0] || null,
            },
        });
    };

    const handleShareToChat = () => {
        navigation.navigate("ChatPage", {
            shareAd: {
                adId: ad?.adId || ad?._id,
                _id: ad?._id,
                title: ad?.title,
                description: ad?.description,
                price: ad?.price,
                image: ad?.images?.[0] || null,
            },
        });
    };

    const handleShareExternally = async () => {
        try {
            const adIdentifier = ad?.adId || ad?._id;
            if (!adIdentifier) return;

            const shareUrl = `${BASE_URL}/ads/share/${encodeURIComponent(adIdentifier)}`;
            const deepLink = `golo://ad/${encodeURIComponent(adIdentifier)}`;

            await Share.share({
                title: ad?.title || "Shared Ad",
                message: `Check this ad on GOLO: ${ad?.title || "Ad"}\n${shareUrl}\nApp link: ${deepLink}`,
                url: shareUrl,
            });
        } catch (error) {
            Alert.alert("Share Error", error?.message || "Unable to share this ad right now");
        }
    };

    const handleShare = () => {
        handleShareExternally();
    };

    const handleCall = (phone) => {
        if (!phone) return;

        const cleanedNumber = phone.replace("+91", "");

        Linking.openURL(`tel:${cleanedNumber}`);
    };
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
                const currentAdId = ad?.adId || ad?._id;
                navigation.navigate("AdDetails", { adId: currentAdId });
            }}
            style={styles.card}
        >

            <View style={styles.row}>
                <Text style={styles.timeText}>
                    {new Date(ad.createdAt || Date.now()).toLocaleString()}
                </Text>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={handleFavoriteToggle} disabled={favoriteLoading}>
                        {favoriteLoading ? (
                            <ActivityIndicator size="small" color="#e74c3c" />
                        ) : (
                            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#e74c3c" : "#222"} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{ad.title}</Text>

            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.desc}>
                {ad.description}
            </Text>

            <Text style={styles.priceText}>
                {ad.price ? `₹${ad.price}` : ""}
            </Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Entypo name="location-pin" size={16} color="#d62c2cff" />
                    <Text numberOfLines={1} ellipsizeMode="tail"
                        style={[styles.metaText, { width: '60%' }]}>{ad.location || ad.city}</Text>
                </View>
                <View style={styles.metaItem}>
                    <MaterialIcons name="account-circle" size={16} color="#f5b849" />
                    <Text numberOfLines={1} ellipsizeMode="tail"
                        style={[styles.metaText, { width: '50%' }]}>{sellerName}</Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat}>
                    <Text style={styles.btnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(ad.contactInfo?.phone)}
                >
                    <Text style={styles.btnText}>Call</Text>
                </TouchableOpacity>
            </View>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    timeText: {
        fontSize: 12,
        color: "#777",
        marginTop: 6,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    title: {
        fontSize: 16,
        marginTop: 8,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    desc: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5)
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        color: "#444",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    priceText: {
        color: "#157a4f",
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        marginVertical: 4
    },
    chatBtn: {
        backgroundColor: "#f5b849",
        flex: 1,
        marginRight: 8,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    callBtn: {
        backgroundColor: "#157a4f",
        flex: 1,
        marginLeft: 8,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5)
    },
});