import React, { useCallback, useContext, useRef, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    Share,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
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
    submitOfferReview,
} from "../services/voucherService";
import { isFavoriteOfferId, toggleFavoriteOffer } from "../services/offerFavoritesService";

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

const getProductsList = (offerData) => {
    const products = offerData?.selectedProducts || offerData?.products || [];
    return Array.isArray(products) ? products : [];
};

const getTermsAndConditions = (offerData) => {
    return (
        offerData?.termsAndConditions ||
        offerData?.terms ||
        offerData?.tc ||
        "No specific terms and conditions provided."
    );
};

export default function OfferDetails({ navigation, route }) {
    const { colors } = useContext(ThemeContext);
    const [showQR, setShowQR] = useState(false);
    const [voucher, setVoucher] = useState(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimCheckLoading, setClaimCheckLoading] = useState(false);
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
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
        offerData?.merchant?.contactNumber ||
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

    const products = getProductsList(offerData);
    const termsAndConditions = getTermsAndConditions(offerData);

    const handleCallMerchant = () => {
        if (!phoneNumber) {
            Alert.alert("Not Available", "Merchant phone number is not available.");
            return;
        }
        Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
            Alert.alert("Error", "Unable to open phone dialer.")
        );
    };

    const resolveVoucherId = (voucherLike) =>
        voucherLike?.voucherId || voucherLike?._id || "";

    const isVoucherRedeemed = (voucherLike) =>
        String(voucherLike?.status || "").toLowerCase() === "redeemed";

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
            const loadFavoriteState = async () => {
                const currentOfferId =
                    offerData?.offerId || offerData?._id || offerData?.requestId || "";
                if (!currentOfferId) {
                    setIsFavorite(false);
                    return;
                }
                const favoriteValue = await isFavoriteOfferId(currentOfferId);
                setIsFavorite(favoriteValue);
            };
            loadFavoriteState();
        }, [syncOfferClaimState])
    );

    const handleToggleFavorite = async () => {
        try {
            const result = await toggleFavoriteOffer(offerData);
            setIsFavorite(result.isFavorite);
            if (result.isFavorite) {
                Alert.alert("Saved", "Offer added to favorites.");
            } else {
                Alert.alert("Removed", "Offer removed from favorites.");
            }
        } catch (error) {
            Alert.alert("Favorite Error", error?.message || "Unable to update favorites right now.");
        }
    };

    const handleShareOffer = async () => {
        try {
            const shareTitle = title || "Shared Offer";
            const shareMessage = [
                `Offer: ${title}`,
                `By: ${merchant}`,
                offerType ? `Type: ${offerType}` : null,
                discountedPrice ? `Price: ${discountedPrice}` : null,
                validTill ? `Valid Till: ${new Date(validTill).toDateString()}` : null,
                locationText ? `Location: ${locationText}` : null,
                details ? `Details: ${details}` : null,
            ]
                .filter(Boolean)
                .join("\n");

            await Share.share({
                title: shareTitle,
                message: shareMessage,
            });
        } catch (error) {
            Alert.alert("Share Error", error?.message || "Unable to share this offer right now.");
        }
    };

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

    const submitReview = async () => {
        const content = String(reviewText || "").trim();
        if (!content) {
            Alert.alert("Write a review", "Please enter your feedback before submitting.");
            return;
        }

        if (!isVoucherRedeemed(voucher)) {
            Alert.alert(
                "Review unavailable",
                "Reviews can only be submitted after your voucher has been redeemed."
            );
            return;
        }

        const voucherId = resolveVoucherId(voucher);
        if (!voucherId) {
            Alert.alert("Unable to submit", "Voucher information is not available.");
            return;
        }

        setReviewLoading(true);
        try {
            await submitOfferReview(voucherId, { rating: reviewRating, content });
            setReviewText("");
            setReviewRating(5);
            await syncOfferClaimState();
            Alert.alert("Thank you!", "Your review has been submitted.");
        } catch (error) {
            Alert.alert(
                "Submit failed",
                String(error?.message || "Unable to submit review right now.")
            );
        } finally {
            setReviewLoading(false);
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
                        <TouchableOpacity onPress={handleToggleFavorite}>
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={22}
                                color={isFavorite ? "#e74c3c" : "#111"}
                                style={styles.icon}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShareOffer}>
                            <Ionicons name="share-social-outline" size={22} />
                        </TouchableOpacity>
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

                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{locationText}</Text>

                            {products.length > 0 && (
                                <>
                                    <Text style={styles.label}>Products Included</Text>
                                    <View style={styles.productsContainer}>
                                        {products.map((product, index) => {
                                            const productImage =
                                                product?.imageUrl ||
                                                product?.image?.url ||
                                                product?.images?.[0] ||
                                                null;
                                            const productName = product?.productName || product?.name || product?.title || `Product ${index + 1}`;

                                            return (
                                                <View key={index} style={styles.productCard}>
                                                    {productImage ? (
                                                        <Image
                                                            source={{ uri: productImage }}
                                                            style={styles.productImage}
                                                        />
                                                    ) : (
                                                        <View style={styles.productImagePlaceholder}>
                                                            <Ionicons
                                                                name="image-outline"
                                                                size={24}
                                                                color="#9a9a9a"
                                                            />
                                                        </View>
                                                    )}
                                                    <Text style={styles.productName} numberOfLines={2}>
                                                        {productName}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {termsAndConditions && termsAndConditions !== "No specific terms and conditions provided." && (
                                <>
                                    <Text style={styles.label}>Terms & Conditions</Text>
                                    <Text style={styles.value}>{termsAndConditions}</Text>
                                </>
                            )}
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
                            <TouchableOpacity 
                                style={[styles.dirBtn, !phoneNumber && styles.disabledCallBtn]} 
                                onPress={handleCallMerchant}
                                disabled={!phoneNumber}
                            >
                                <Ionicons name="call" size={18} color="#fff" />
                                <Text style={styles.bottomText}>
                                    {phoneNumber ? ` Call ${phoneNumber}` : " Number unavailable"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isVoucherRedeemed(voucher) ? (
                            <View style={styles.reviewContainer}>
                                <Text style={styles.reviewLabel}>Write a review</Text>
                                <Text style={styles.ratingLabel}>Rate your experience</Text>
                                <View style={styles.ratingRow}>
                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                        <TouchableOpacity
                                            key={starIndex}
                                            onPress={() => !reviewLoading && setReviewRating(starIndex + 1)}
                                            disabled={reviewLoading}
                                        >
                                            <Ionicons
                                                name={starIndex < reviewRating ? "star" : "star-outline"}
                                                size={28}
                                                color={starIndex < reviewRating ? "#fbbf24" : "#9ca3af"}
                                                style={styles.ratingStar}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Write your review for the merchant or offer..."
                                    placeholderTextColor="#6b7280"
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                    multiline
                                    editable={!reviewLoading}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.reviewButton,
                                        reviewLoading ? styles.disabledBtn : null,
                                    ]}
                                    onPress={submitReview}
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.reviewButtonText}>Submit Review</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : null}
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

                        {voucher?.verificationCode && (
                            <View style={styles.verificationCodeContainer}>
                                <Text style={styles.verificationCodeLabel}>Or use this code if QR doesn't work:</Text>
                                <Text style={styles.verificationCode}>{voucher.verificationCode}</Text>
                                <Text style={styles.verificationCodeHint}>Share this code with the merchant</Text>
                            </View>
                        )}

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
        backgroundColor: "#157a4f",
        padding: 12,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    disabledCallBtn: {
        opacity: 0.5,
    },
    bottomText: {
        color: "#fff",
        fontFamily: "SemiBold",
        lineHeight: Math.round(14 * 1.5),
        fontSize: 14,
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
    verificationCodeContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#f0fdf4",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#bbf7d0",
        alignItems: "center",
        width: "100%",
    },
    verificationCodeLabel: {
        fontSize: 12,
        fontFamily: "Medium",
        color: "#059669",
        marginBottom: 8,
        textAlign: "center",
        lineHeight: Math.round(12 * 1.5),
    },
    verificationCode: {
        fontSize: 16,
        fontFamily: "SemiBold",
        color: "#047857",
        letterSpacing: 2,
        marginBottom: 6,
        lineHeight: Math.round(16 * 1.5),
    },
    verificationCodeHint: {
        fontSize: 11,
        fontFamily: "Regular",
        color: "#6b7280",
        textAlign: "center",
        lineHeight: Math.round(11 * 1.5),
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
    productsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 8,
    },
    productCard: {
        width: "48%",
        backgroundColor: "#f9fafb",
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        resizeMode: "cover",
    },
    productImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
    },
    productName: {
        fontSize: 12,
        fontFamily: "Medium",
        textAlign: "center",
        color: "#333",
        lineHeight: 16,
    },
    reviewContainer: {
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    reviewLabel: {
        fontFamily: "SemiBold",
        marginBottom: 10,
        color: "#111827",
    },
    ratingLabel: {
        fontFamily: "SemiBold",
        marginBottom: 8,
        color: "#111827",
    },
    ratingRow: {
        flexDirection: "row",
        marginBottom: 12,
    },
    ratingStar: {
        marginHorizontal: 2,
    },
    reviewInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        backgroundColor: "#f9fafb",
        padding: 12,
        color: "#111827",
        textAlignVertical: "top",
    },
    reviewButton: {
        marginTop: 12,
        backgroundColor: "#f5b849",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    reviewButtonText: {
        fontFamily: "Bold",
        color: "#fff",
        fontSize: 14,
        lineHeight: Math.round(14 * 1.5),
    },
});
