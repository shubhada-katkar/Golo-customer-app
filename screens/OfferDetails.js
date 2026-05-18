import React, { useCallback, useContext, useRef, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import {
    claimOfferVoucher,
    fetchVoucherById,
    findVoucherForOffer,
} from "../services/voucherService";

const getOfferImage = (item) =>
    item?.imageUrl ||
    item?.selectedProducts?.[0]?.imageUrl ||
    item?.products?.[0]?.images?.[0] ||
    item?.products?.[0]?.image?.url ||
    "";

const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `Rs ${numericValue}` : String(value);
};

const isMongoObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

export default function OfferDetails({ navigation, route }) {
    const { colors } = useContext(ThemeContext);
    const [showQR, setShowQR] = useState(false);
    const [voucher, setVoucher] = useState(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimCheckLoading, setClaimCheckLoading] = useState(false);
    const qrRef = useRef();

    const offerData = route?.params?.offerData || {};
    const hasRequestId = Boolean(String(offerData?.requestId || "").trim());
    const offerId =
        (offerData?.offerId && isMongoObjectId(offerData.offerId) && offerData.offerId) ||
        (hasRequestId && offerData?._id && isMongoObjectId(offerData._id) && offerData._id) ||
        (hasRequestId && isMongoObjectId(offerData?.requestId) && offerData.requestId) ||
        "";
    const canClaimVoucher = Boolean(offerId);
    const offerImage = getOfferImage(offerData);
    const title = offerData?.bannerTitle || offerData?.title || "Untitled Offer";
    const merchant =
        offerData?.shopName ||
        offerData?.merchantName ||
        offerData?.businessName ||
        offerData?.sellerName ||
        offerData?.storeName ||
        offerData?.merchant?.name ||
        offerData?.merchant?.storeName ||
        "Nearby merchant";
    const discountedPrice =
        formatPrice(
            offerData?.discountedPrice ||
            offerData?.offerPrice ||
            offerData?.salePrice ||
            offerData?.finalPrice
        ) || "Offer price unavailable";
    const originalPrice = formatPrice(
        offerData?.originalPrice || offerData?.mrp || offerData?.price || offerData?.regularPrice
    );
    const validTill = offerData?.endDate || offerData?.validTo;
    const offerType = offerData?.bannerCategory || offerData?.offerType || offerData?.category;
    const details =
        offerData?.description ||
        offerData?.bannerDescription ||
        offerData?.selectedProducts?.[0]?.description ||
        "Offer details will be available soon.";
    const phoneNumber =
        offerData?.contactNumber ||
        offerData?.phoneNumber ||
        offerData?.merchantPhone ||
        offerData?.mobile ||
        null;
    const locationText =
        offerData?.address ||
        offerData?.shopAddress ||
        offerData?.location ||
        offerData?.city ||
        offerData?.merchant?.address ||
        offerData?.merchant?.storeLocation ||
        "Location not available";

    const resolveVoucherId = (voucherLike) =>
        voucherLike?.voucherId || voucherLike?._id || "";

    const hydrateVoucher = async (voucherLike) => {
        const fallbackVoucher = voucherLike || null;
        const voucherId = resolveVoucherId(voucherLike);

        if (!voucherId) {
            return fallbackVoucher;
        }

        try {
            const fullVoucher = await fetchVoucherById(voucherId);
            return fullVoucher || fallbackVoucher;
        } catch (error) {
            return fallbackVoucher;
        }
    };

    const syncOfferClaimState = useCallback(async () => {
        if (!offerId) {
            setVoucher(null);
            return;
        }

        setClaimCheckLoading(true);
        try {
            const existingVoucher = await findVoucherForOffer(offerId);
            if (!existingVoucher) {
                setVoucher(null);
                return;
            }

            const hydratedVoucher = await hydrateVoucher(existingVoucher);
            setVoucher(hydratedVoucher || existingVoucher);
        } catch (error) {
            console.error("Failed to check claim state:", error);
        } finally {
            setClaimCheckLoading(false);
        }
    }, [offerId]);

    useFocusEffect(
        useCallback(() => {
            syncOfferClaimState();
        }, [syncOfferClaimState])
    );

    const handleClaim = async () => {
        if (!canClaimVoucher) {
            Alert.alert(
                "Not Available",
                "This offer does not support voucher claim yet."
            );
            return;
        }

        if (voucher) {
            setShowQR(true);
            return;
        }

        setClaimLoading(true);
        try {
            const claimResult = await claimOfferVoucher(offerId);
            const hydratedVoucher = await hydrateVoucher(claimResult);
            setVoucher(hydratedVoucher || claimResult);
            setShowQR(true);
            Alert.alert("Claimed", "Offer claimed successfully.");
        } catch (error) {
            const message = String(error?.message || "Unable to claim offer right now");
            const alreadyClaimed = message.toLowerCase().includes("already claimed");

            if (alreadyClaimed) {
                try {
                    const existingVoucher = await findVoucherForOffer(offerId);
                    const hydratedVoucher = await hydrateVoucher(existingVoucher);
                    if (existingVoucher || hydratedVoucher) {
                        setVoucher(hydratedVoucher || existingVoucher);
                        setShowQR(true);
                        Alert.alert("Already Claimed", "Showing your existing QR code.");
                        return;
                    }
                } catch (syncError) {
                    console.error("Failed to sync existing voucher:", syncError);
                }
            }

            Alert.alert("Claim Failed", message);
        } finally {
            setClaimLoading(false);
        }
    };

    const downloadQR = async () => {
        if (!voucher?.qrCode && !voucher?.qrImage) {
            Alert.alert("QR unavailable", "Please claim this offer first.");
            return;
        }

        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Storage permission is needed to save QR.");
            return;
        }

        try {
            const uri = await qrRef.current?.capture();
            if (!uri) {
                Alert.alert("Error", "Could not generate QR image.");
                return;
            }
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert("Saved", "QR code saved to gallery");
        } catch (error) {
            Alert.alert("Error", "Could not save QR code");
        }
    };

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Topbar />
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        onPress={() => navigation.goBack()}
                        style={{ paddingLeft: 6 }}
                    />
                    <View style={styles.headerRight}>
                        <Ionicons name="heart-outline" size={22} style={styles.icon} />
                        <Ionicons name="share-social-outline" size={22} />
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.imageContainer}>
                        {offerImage ? (
                            <Image source={{ uri: offerImage }} style={styles.offerImage} />
                        ) : (
                            <View style={styles.fakeImage}>
                                <Ionicons name="image-outline" size={44} color="#9a9a9a" />
                            </View>
                        )}
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>

                        <View style={styles.priceRow}>
                            <Text style={styles.discount}>{discountedPrice}</Text>
                            {originalPrice ? <Text style={styles.original}>{originalPrice}</Text> : null}
                        </View>

                        <Text style={styles.by}>By {merchant}</Text>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Offer Details</Text>

                            <Text style={styles.label}>Offer Type</Text>
                            <Text style={styles.value}>{offerType || "-"}</Text>

                            <Text style={styles.label}>Valid Till</Text>
                            <Text style={styles.value}>
                                {validTill ? new Date(validTill).toDateString() : "-"}
                            </Text>

                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.value}>{details}</Text>

                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{locationText}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.buyBtn,
                                voucher ? styles.claimedBtn : null,
                                !canClaimVoucher ? styles.unavailableBtn : null,
                                claimLoading ? styles.disabledBtn : null,
                            ]}
                            onPress={handleClaim}
                            disabled={!canClaimVoucher || claimLoading || claimCheckLoading}
                        >
                            {claimLoading || claimCheckLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buyText}>
                                    {voucher ? "Claimed" : canClaimVoucher ? "Claim Now" : "Not Available"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.bottomBar}>
                            <TouchableOpacity style={styles.callBtn}>
                                <Ionicons name="call" size={18} color="#fff" />
                                <Text style={styles.bottomText}>
                                    {phoneNumber ? ` Call ${phoneNumber}` : " Call/Text"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.dirBtn}>
                                <Ionicons name="navigate" size={18} color="#000" />
                                <Text style={styles.dirText}> Direction</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <SafeAreaView
                    edges={["bottom"]}
                    style={{ position: "absolute", bottom: 0, width: "100%" }}
                >
                    <GoloBottom />
                </SafeAreaView>
            </SafeAreaView>

            <Modal visible={showQR} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.qrCard}>
                        <Text style={styles.qrTitle}>Show this QR to Merchant</Text>

                        <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>
                            <View style={{ padding: 20, backgroundColor: "white" }}>
                                {voucher?.qrImage ? (
                                    <Image source={{ uri: voucher.qrImage }} style={styles.qrImage} />
                                ) : (
                                    <QRCode value={voucher?.qrCode || "Unavailable"} size={220} />
                                )}
                            </View>
                        </ViewShot>

                        <Text style={styles.tokenText}>
                            Voucher: {voucher?.voucherId || voucher?._id || "-"}
                        </Text>

                        <TouchableOpacity style={styles.downloadBtn} onPress={downloadQR}>
                            <Text style={styles.downloadText}>Download QR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowQR(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    headerRight: {
        flexDirection: "row",
        gap: 12,
    },
    icon: {
        marginRight: 12,
    },
    imageContainer: {
        backgroundColor: "#eee",
        height: 260,
        justifyContent: "center",
        alignItems: "center",
    },
    offerImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    fakeImage: {
        width: 160,
        height: 160,
        backgroundColor: "#ccc",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    title: {
        fontSize: 20,
        fontFamily: "Bold",
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
    },
    discount: {
        color: "green",
        fontFamily: "SemiBold",
    },
    original: {
        color: "#999",
        textDecorationLine: "line-through",
        fontFamily: "Medium",
    },
    by: {
        marginTop: 4,
        color: "#666",
        fontFamily: "Medium",
    },
    card: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
    },
    cardTitle: {
        fontFamily: "Bold",
        marginBottom: 8,
    },
    label: {
        marginTop: 8,
        fontFamily: "SemiBold",
    },
    value: {
        color: "#444",
        marginTop: 2,
        fontFamily: "Medium",
        lineHeight: 20,
    },
    buyBtn: {
        marginTop: 20,
        backgroundColor: "#FBBF24",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buyText: {
        fontFamily: "Bold",
        color: "#fff",
        fontSize: 14,
        lineHeight: Math.round(14 * 1.5),
    },
    claimedBtn: {
        backgroundColor: "#157a4f",
    },
    unavailableBtn: {
        backgroundColor: "#9ca3af",
    },
    disabledBtn: {
        opacity: 0.65,
    },
    bottomBar: {
        flexDirection: "row",
        paddingTop: 12,
        gap: 10,
    },
    callBtn: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#065f46",
        padding: 12,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    dirBtn: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#FBBF24",
        padding: 12,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    bottomText: {
        color: "#fff",
        fontFamily: "SemiBold",
    },
    dirText: {
        fontFamily: "SemiBold",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    qrCard: {
        width: 300,
        backgroundColor: "white",
        borderRadius: 14,
        padding: 20,
        alignItems: "center",
    },
    qrTitle: {
        fontSize: 18,
        fontFamily: "Medium",
        lineHeight: Math.round(18 * 1.5),
    },
    tokenText: {
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },
    downloadBtn: {
        marginTop: 15,
        backgroundColor: "#065f46",
        padding: 10,
        borderRadius: 8,
    },
    downloadText: {
        fontSize: 14,
        color: "#fff",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    closeText: {
        marginTop: 10,
        fontSize: 14,
        color: "#f94741",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    qrImage: {
        width: 220,
        height: 220,
        resizeMode: "contain",
    },
});
