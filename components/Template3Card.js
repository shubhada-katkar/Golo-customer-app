import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from "../services/favoritesService";

export default function Template3Card({ ad, navigation }) {
    const [isFavorite, setIsFavorite] = useState(false);

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
        try {
            const result = await toggleFavoriteAd(ad);
            setIsFavorite(result.isFavorite);
        } catch (error) {
            console.log("favorite toggle failed", error.message);
        }
    };

    const handleOpenChat = () => {
        navigation.navigate("ChatScreen", {
            adId: ad?.adId || ad?._id,
            sellerId: ad?.userId || ad?.user?.id,
            sellerName: ad?.contactInfo?.name || "Seller",
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

            const baseUrl = process.env.EXPO_PUBLIC_API_URL;
            const shareUrl = `${baseUrl}/ads/share/${encodeURIComponent(adIdentifier)}`;
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
        Alert.alert("Share Ad", "Choose where to share this ad", [
            { text: "In GOLO Chat", onPress: handleShareToChat },
            { text: "WhatsApp / Messages", onPress: handleShareExternally },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleCall = (phone) => {
        if (!phone) return;

        const cleanedNumber = phone.replace("+91", "");

        Linking.openURL(`tel:${cleanedNumber}`);
    };
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AdDetails", { adId: ad._id })}
            style={styles.card}
        >
            <View style={styles.topRow}>
                <TouchableOpacity onPress={handleFavoriteToggle}>
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? "#e74c3c" : "#222"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={18} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="flag-outline" size={20} color="#ce3d3d" />
                </TouchableOpacity>
            </View>

            <Text style={styles.timeText}>
                {new Date(ad.createdAt || Date.now()).toLocaleString()}
            </Text>

            <Text style={styles.title}>{ad.title}</Text>

            <Text numberOfLines={3} style={styles.desc}>
                {ad.description}
            </Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} />
                    <Text style={styles.metaText}>{ad.location || ad.city}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="person" size={14} />
                    <Text style={styles.metaText}>{ad.contactInfo?.name}</Text>
                </View>
            </View>

            <View style={styles.priceStrip}>
                <Text style={styles.priceText}>
                    {ad.price ? `₹${ad.price}` : "Price Not Mentioned"}
                </Text>
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
        marginTop: 10,
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
    priceStrip: {
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 10,
    },
    priceText: {
        color: "#000000",
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
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