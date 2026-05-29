import React, { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Share,
    TextInput, Modal, ScrollView, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from "../services/favoritesService";
import { trackAdCardClick, trackContactClick } from "../services/analyticsService";
import { submitReport } from "../services/reportService";
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

const REPORT_REASONS = [
    { label: "Spam or Misleading", value: "spam" },
    { label: "Inappropriate Content", value: "inappropriate" },
    { label: "Fraud or Scam", value: "fraud" },
    { label: "Duplicate Posting", value: "duplicate" },
    { label: "Other", value: "other" },
];

export default function Template3Card({ ad, navigation }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [details, setDetails] = useState("");
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

    const handleOpenChat = () => {
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

    const handleSubmitReport = async () => {
        if (!selectedReason) {
            Alert.alert("Error", "Please select a reason before submitting.");
            return;
        }

        const adIdentifier = ad?.adId || ad?._id;
        if (!adIdentifier) {
            Alert.alert("Error", "Ad ID is missing.");
            return;
        }

        try {
            await submitReport("AD", adIdentifier, selectedReason, details);
            Alert.alert("Report Submitted", "Thank you. We will review this ad shortly.", [
                {
                    text: "OK",
                    onPress: () => {
                        setShowReportModal(false);
                        setSelectedReason(null);
                        setDetails("");
                    },
                },
            ]);
        } catch (err) {
            Alert.alert("Error", err.message || "Failed to submit report. Please try again.");
        }
    };

    const handleCall = (phone) => {
        if (!phone) return;

        const cleanedNumber = phone.replace("+91", "");

        Linking.openURL(`tel:${cleanedNumber}`);
    };
    return (
        <>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    const currentAdId = ad?.adId || ad?._id;
                    navigation.navigate("AdDetails", { adId: currentAdId });
                }}
                style={styles.card}
            >
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={handleFavoriteToggle} disabled={favoriteLoading}>
                        {favoriteLoading ? (
                            <ActivityIndicator size="small" color="#e74c3c" />
                        ) : (
                            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? "#e74c3c" : "#222"} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowReportModal(true)}>
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
                        <Text style={styles.metaText}>{sellerName}</Text>
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


            <Modal visible={showReportModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled">

                            <Text style={styles.modalTitle}>Report This Ad</Text>
                            <Text style={styles.modalSubtitle}>Help us review suspicious listings.</Text>


                            <Text style={styles.title}>Why are you reporting this ad?</Text>

                            {REPORT_REASONS.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.option}
                                    onPress={() => setSelectedReason(reason.value)}
                                >
                                    <Text
                                        style={{ fontSize: 12, lineHeight: Math.round(12 * 1.5), fontFamily: "Medium" }}
                                    >{reason.label}</Text>
                                    <View style={[
                                        styles.radio,
                                        selectedReason === reason.value && styles.radioSelected
                                    ]} />
                                </TouchableOpacity>
                            ))}

                            <Text style={{
                                fontSize: 12,
                                lineHeight: Math.round(12 * 1.5),
                                fontFamily: "Medium", marginTop: 10
                            }}>Additional Details</Text>

                            <TextInput
                                placeholder="Please provide more details..."
                                value={details}
                                onChangeText={setDetails}
                                multiline
                                style={styles.textArea}
                            />

                            <View style={{ flexDirection: "row", marginTop: 12 }}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowReportModal(false)}
                                >
                                    <Text style={{
                                        fontFamily: "SemiBold",
                                        lineHeight: Math.round(14 * 1.2), fontSize: 14
                                    }}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.submitBtn, !selectedReason && { backgroundColor: '#ccc' }]}
                                    onPress={handleSubmitReport}
                                    disabled={!selectedReason}
                                >
                                    <Text style={{
                                        fontFamily: "SemiBold",
                                        lineHeight: Math.round(14 * 1.2), fontSize: 14,
                                        color: '#000000'
                                    }}>Submit Report</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                    </View>
                </View>
            </Modal>

        </>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },

    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        lineHeight: Math.round(18 * 1.5),
        fontFamily: "Medium",
    },

    modalSubtitle: {
        color: "#666",
        marginBottom: 10,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        fontSize: 12,
    },

    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 10,
        marginTop: 8,
    },

    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#000000",
    },

    radioSelected: {
        backgroundColor: "#157a4f",
        borderColor: "#157a4f",
    },

    textArea: {
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 10,
        padding: 10,
        height: 80,
        marginTop: 8,
        fontSize: 12,
        lineHeight: Math.round(12 * 1.5),
        fontFamily: "Medium",
    },

    cancelBtn: {
        flex: 1,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 10,
        marginRight: 6,
    },

    submitBtn: {
        flex: 1,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 10,
        marginRight: 6,
    },
});