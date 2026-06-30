import React, { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Image, Alert,
    Share, ActivityIndicator
} from "react-native";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from "../services/favoritesService";
import { trackAdCardClick, trackContactClick } from "../services/analyticsService";
import { BASE_URL } from "../config";

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

export default function Template2Card({ ad, navigation }) {
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
                console.warn("Template2Card: failed to fetch seller name", error);
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

    const handleOpenChat = () => {
        const adIdentifier = ad?.adId || ad?._id;
        if (adIdentifier) {
            trackContactClick(adIdentifier).catch((error) => {
                console.warn('[Template2Card] Failed to track contact click:', error.message);
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

            <View style={styles.timerow}>
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

            <View style={styles.row}>
                {ad.images?.length > 0 ? (
                    <Image source={{ uri: ad.images[0] }} style={styles.image} />
                ) : (
                    <View style={styles.image} />
                )}

                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                        {ad.title}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail"
                        style={styles.desc}>
                        {ad.description}
                    </Text>
                    <Text style={styles.price}>{ad.price ? `₹${ad.price}` : ""}</Text>
                </View>

            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Entypo name="location-pin" size={16} color="#d62c2cff" />
                    <Text numberOfLines={1} ellipsizeMode="tail"
                        style={[styles.metaText, { width: "60%" }]}>{ad.location || ad.city}</Text>
                </View>
                <View style={styles.metaItem}>
                    <MaterialIcons name="account-circle" size={16} color="#f5b849" />
                    <Text numberOfLines={1} ellipsizeMode="tail"
                        style={[styles.metaText, { width: "50%" }]}>{sellerName}</Text>
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
    timerow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    timeText: {
        fontSize: 12,
        color: "#777",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        alignSelf: "flex-start",
    },
    row: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    image: {
        height: 110,
        width: 165,
        borderRadius: 10,
        backgroundColor: "#ddd",
    },
    title: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    desc: {
        fontSize: 13,
        color: "#666",
        marginTop: 5,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5)
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
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
        lineHeight: Math.round(12 * 1.5),
    },
    price: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        marginTop: 5,
        color: "#157a4f"
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