import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
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
    View, KeyboardAvoidingView, Platform, Dimensions
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import CustomAlertModal from "../components/CustomeAlertModal";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    claimOfferVoucher,
    fetchVoucherById,
    findVoucherForOffer,
    submitOfferReview,
} from "../services/voucherService";
import {
    fetchOfferDetails,
    fetchPublicMerchantProfile,
} from "../services/offersService";
import { isFavoriteOfferId, toggleFavoriteOffer } from "../services/offerFavoritesService";
import { LinearGradient } from "expo-linear-gradient";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MEDIA_CONTAINER_WIDTH = SCREEN_WIDTH - 20;

const getOfferImage = (item) =>
    item?.imageUrl ||
    item?.offerImage ||
    item?.selectedProducts?.[0]?.imageUrl ||
    item?.products?.[0]?.images?.[0] ||
    item?.products?.[0]?.image?.url ||
    "";

const getOfferVideo = (item) =>
    item?.videoUrl ||
    item?.video ||
    item?.offerVideo ||
    (typeof item?.video === "object" ? item?.video?.url || item?.video?.uri : null) ||
    item?.selectedProducts?.[0]?.videoUrl ||
    "";

const getOfferMediaList = (item) => {
    const media = [];
    const imageUri = getOfferImage(item);
    const videoUri = getOfferVideo(item);

    if (imageUri) {
        media.push({ type: "image", uri: imageUri });
    }
    if (videoUri) {
        media.push({ type: "video", uri: videoUri });
    }
    return media;
};

const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? `Rs ${numericValue}` : String(value);
};

const isMongoObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

const getOfferIdFromData = (data) => {
    if (!data || typeof data !== "object") {
        return "";
    }

    return (
        data?.offerId ||
        data?._id ||
        data?.requestId ||
        data?.id ||
        data?.offer?.offerId ||
        data?.offer?._id ||
        data?.offer?.requestId ||
        data?.offer?.id ||
        ""
    );
};

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

const normalizeGender = (gender) => {
    if (!gender || typeof gender !== "string") return "";
    const normalized = gender.trim().toLowerCase();
    if (normalized === "male" || normalized === "m") return "male";
    if (normalized === "female" || normalized === "f") return "female";
    return normalized;
};

const getAgeFromDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
        age -= 1;
    }
    return age >= 0 ? age : null;
};

const faqData = [
    {
        question: "How do I claim this deal?",
        answer: "Click the 'Claim Now' button on this screen. A unique QR code and verification code will be generated for you. You can save or download this code to your gallery."
    },
    {
        question: "Do I need to visit the store to use it?",
        answer: "Yes, present your digital QR code or show the verification code to the merchant at their store location during your visit to redeem the offer."
    },
    {
        question: "When do I earn loyalty points?",
        answer: "Loyalty points are automatically credited to your account once the merchant successfully scans and verifies your voucher code at the store."
    },
    {
        question: "Can I use the same deal more than once?",
        answer: "Each claimed voucher code is valid for a single use. Check the terms and conditions of this specific offer for any merchant-specific reuse limits."
    }
];

export default function OfferDetails({ navigation, route }) {
    const scrollViewRef = useRef(null);
    const [showQR, setShowQR] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error", onClose: null });

    const showAlert = (title, message, type = "error", extraProps = {}) => {
        setAlertConfig({ visible: true, title, message, type, onClose: null, ...extraProps });
    };

    const hideAlert = () => {
        if (alertConfig.onClose) {
            const cb = alertConfig.onClose;
            setAlertConfig({ visible: false, title: "", message: "", type: "error", onClose: null });
            cb();
        } else {
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }
    };
    const [voucher, setVoucher] = useState(null);
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimCheckLoading, setClaimCheckLoading] = useState(false);
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [remoteOfferData, setRemoteOfferData] = useState(null);
    const [offerLoading, setOfferLoading] = useState(false);
    const [merchantProfile, setMerchantProfile] = useState(null);
    const [merchantProfileLoading, setMerchantProfileLoading] = useState(false);
    const [claimLatitude, setClaimLatitude] = useState(null);
    const [claimLongitude, setClaimLongitude] = useState(null);
    const [claimLocationLabel, setClaimLocationLabel] = useState("");
    const [customerAge, setCustomerAge] = useState(null);
    const [customerGender, setCustomerGender] = useState("");
    const qrRef = useRef();

    const [activeIndex, setActiveIndex] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const sliderRef = useRef(null);
    const videoRef = useRef(null);
    const autoSlideTimerRef = useRef(null);

    const routeOfferData = route?.params?.offerData || {};
    const offerData = remoteOfferData || routeOfferData;
    const offerMedia = getOfferMediaList(offerData);

    const scrollToNextSlide = useCallback(() => {
        if (!offerMedia || offerMedia.length <= 1) return;
        setActiveIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % offerMedia.length;
            sliderRef.current?.scrollTo({
                x: nextIndex * MEDIA_CONTAINER_WIDTH,
                animated: true,
            });
            return nextIndex;
        });
    }, [offerMedia]);

    const startAutoSlide = useCallback(() => {
        if (autoSlideTimerRef.current) {
            clearInterval(autoSlideTimerRef.current);
        }
        if (offerMedia.length > 1) {
            autoSlideTimerRef.current = setInterval(() => {
                const currentItem = offerMedia[activeIndex];
                if (currentItem?.type !== "video" || !videoPlaying) {
                    scrollToNextSlide();
                }
            }, 4000);
        }
    }, [offerMedia, activeIndex, videoPlaying, scrollToNextSlide]);

    const stopAutoSlide = useCallback(() => {
        if (autoSlideTimerRef.current) {
            clearInterval(autoSlideTimerRef.current);
            autoSlideTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const currentItem = offerMedia[activeIndex];

        if (currentItem?.type === "image") {
            startAutoSlide();
        } else if (currentItem?.type === "video") {
            stopAutoSlide();
            if (videoRef.current) {
                videoRef.current.replayAsync().catch(() => { });
            }
        }

        return () => stopAutoSlide();
    }, [activeIndex, offerMedia.length]);

    const handleVideoStatusUpdate = (status) => {
        if (!status.isLoaded) return;
        setVideoPlaying(status.isPlaying);

        if (status.didJustFinish) {
            scrollToNextSlide();
        }
    };

    const offerIdFromRouteParams = route?.params?.offerId || route?.params?.id || "";
    const routeOfferId = getOfferIdFromData(routeOfferData) || offerIdFromRouteParams;
    const remoteOfferId = getOfferIdFromData(remoteOfferData);
    const offerId = remoteOfferId || routeOfferId;
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
        merchantProfile?.storeName ||
        merchantProfile?.merchantName ||
        merchantProfile?.name ||
        "Nearby merchant";
    const discountedPrice =
        formatPrice(
            offerData?.discountedPrice ||
            offerData?.offerPrice ||
            offerData?.salePrice ||
            offerData?.finalPrice
        ) || "Offer price unavailable";

    const getOfferValidTill = (data) =>
        data?.endDate ||
        data?.validTo ||
        data?.endsAt ||
        data?.expiryDate ||
        data?.expiry ||
        data?.expiresAt ||
        data?.offer?.endDate ||
        data?.offer?.validTo ||
        data?.offer?.endsAt ||
        data?.offer?.expiryDate ||
        data?.offer?.expiry ||
        data?.offer?.expiresAt ||
        null;

    const validTill = getOfferValidTill(offerData);
    const offerType = offerData?.bannerCategory || offerData?.offerType || offerData?.category;
    const details =
        offerData?.description ||
        offerData?.bannerDescription ||
        offerData?.selectedProducts?.[0]?.description ||
        "Offer details will be available soon.";
    const merchantId =
        offerData?.merchant?.merchantId ||
        offerData?.merchantId ||
        offerData?.merchant?._id ||
        offerData?.merchant?.userId ||
        offerData?.merchant?.id ||
        "";

    const phoneNumber =
        offerData?.merchant?.contactNumber ||
        offerData?.merchant?.phone ||
        offerData?.merchant?.phoneNumber ||
        offerData?.merchant?.mobile ||
        offerData?.merchant?.mobileNumber ||
        offerData?.merchant?.merchantPhone ||
        offerData?.merchant?.storePhone ||
        offerData?.merchant?.phoneNo ||
        offerData?.merchant?.phone_number ||
        offerData?.merchant?.mobile_no ||
        offerData?.contactNumber ||
        offerData?.phoneNumber ||
        offerData?.phone ||
        offerData?.merchantPhone ||
        offerData?.mobile ||
        merchantProfile?.contactNumber ||
        merchantProfile?.phone ||
        merchantProfile?.phoneNumber ||
        merchantProfile?.mobile ||
        merchantProfile?.mobileNumber ||
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
            showAlert("Not Available", "Merchant phone number is not available.", "error");
            return;
        }
        Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
            showAlert("Error", "Unable to open phone dialer.", "error")
        );
    };

    const resolveVoucherId = (voucherLike) => {
        if (!voucherLike || typeof voucherLike !== "object") {
            return "";
        }

        if (voucherLike?._id) {
            return String(voucherLike._id);
        }

        if (voucherLike?.id) {
            return String(voucherLike.id);
        }

        if (voucherLike?.voucherId) {
            return String(voucherLike.voucherId);
        }

        return "";
    };

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

    const loadRemoteOfferData = useCallback(async () => {
        if (!routeOfferId || remoteOfferData) {
            return;
        }

        const hasDetailFields = Boolean(
            routeOfferData?.description ||
            routeOfferData?.bannerDescription ||
            routeOfferData?.termsAndConditions ||
            (Array.isArray(routeOfferData?.selectedProducts) && routeOfferData.selectedProducts.length > 0) ||
            (Array.isArray(routeOfferData?.products) && routeOfferData.products.length > 0)
        );

        const hasMerchantContact = Boolean(
            routeOfferData?.merchant?.contactNumber ||
            routeOfferData?.merchant?.phone ||
            routeOfferData?.merchant?.phoneNumber ||
            routeOfferData?.merchant?.mobile ||
            routeOfferData?.contactNumber ||
            routeOfferData?.phoneNumber ||
            routeOfferData?.phone ||
            routeOfferData?.merchantPhone ||
            routeOfferData?.mobile
        );

        if (hasDetailFields && hasMerchantContact) {
            return;
        }

        setOfferLoading(true);
        try {
            const fetchedOffer = await fetchOfferDetails(routeOfferId);
            if (fetchedOffer) {
                setRemoteOfferData(fetchedOffer);
            }
        } catch (error) {
            // Keep the original route offer data if remote fetch fails.
        } finally {
            setOfferLoading(false);
        }
    }, [routeOfferId, remoteOfferData, routeOfferData]);

    useEffect(() => {
        if (!merchantId || merchantProfile) {
            return;
        }

        const loadMerchantProfile = async () => {
            setMerchantProfileLoading(true);
            try {
                const profile = await fetchPublicMerchantProfile(merchantId);
                if (profile) {
                    setMerchantProfile(profile);
                }
            } catch (error) {
                console.error("Failed to fetch merchant profile:", error);
            } finally {
                setMerchantProfileLoading(false);
            }
        };

        loadMerchantProfile();
    }, [merchantId, merchantProfile]);

    useFocusEffect(
        useCallback(() => {
            syncOfferClaimState();
            loadRemoteOfferData();
            const loadFavoriteState = async () => {
                const currentOfferId = getOfferIdFromData(routeOfferData);
                if (!currentOfferId) {
                    setIsFavorite(false);
                    return;
                }
                const favoriteValue = await isFavoriteOfferId(currentOfferId);
                setIsFavorite(favoriteValue);
            };
            loadFavoriteState();
        }, [syncOfferClaimState, loadRemoteOfferData, routeOfferData])
    );

    useEffect(() => {
        const loadCustomerClaimMetadata = async () => {
            try {
                const storedCustomerData = await AsyncStorage.getItem("customerData");
                if (storedCustomerData) {
                    const parsed = JSON.parse(storedCustomerData);
                    const dob = parsed?.profile?.dateOfBirth || parsed?.dateOfBirth || parsed?.profile?.dob || parsed?.dob;
                    const ageValue = parsed?.age || getAgeFromDate(dob);
                    const genderValue = normalizeGender(parsed?.profile?.gender || parsed?.gender || parsed?.profile?.sex || parsed?.sex);
                    if (Number.isFinite(Number(ageValue))) {
                        setCustomerAge(Number(ageValue));
                    }
                    if (genderValue) {
                        setCustomerGender(genderValue);
                    }
                }
            } catch (error) {
                console.warn("Failed to load customer metadata:", error);
            }

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    return;
                }

                const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const latitude = position?.coords?.latitude;
                const longitude = position?.coords?.longitude;
                if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                    setClaimLatitude(latitude);
                    setClaimLongitude(longitude);
                }

                try {
                    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                    const place = Array.isArray(geocode) ? geocode[0] : null;
                    if (place) {
                        const placeText = [
                            place.name,
                            place.street,
                            place.streetNumber,
                            place.city,
                            place.subregion,
                            place.region,
                            place.country,
                        ]
                            .filter(Boolean)
                            .slice(0, 4)
                            .join(", ");
                        if (placeText) {
                            setClaimLocationLabel(placeText);
                        }
                    }
                } catch (geocodeError) {
                    console.warn("Reverse geocode failed:", geocodeError);
                }
            } catch (locationError) {
                console.warn("Location permission or fetch failed:", locationError);
            }
        };

        loadCustomerClaimMetadata();
    }, []);

    const handleToggleFavorite = async () => {
        if (favoriteLoading) return;
        setFavoriteLoading(true);
        try {
            const result = await toggleFavoriteOffer(offerData);
            setIsFavorite(result.isFavorite);
            if (result.isFavorite) {
                showAlert("Saved", "Offer added to favorites.", "success");
            } else {
                showAlert("Removed", "Offer removed from favorites.", "info");
            }
        } catch (error) {
            showAlert("Favorite Error", error?.message || "Unable to update favorites right now.", "error");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleShareOffer = async () => {
        try {
            const shareTitle = title || "Shared Offer";

            const getAbsoluteImageUrl = (url) => {
                if (!url) return null;
                if (url.startsWith("data:")) {
                    return null;
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return url;
                }
                const baseUrlClean = BASE_URL.replace(/\/+$/, "");
                const urlClean = url.startsWith("/") ? url : `/${url}`;
                return `${baseUrlClean}${urlClean}`;
            };

            const resolvedOfferId = offerId || "";
            const websiteUrl = `https://golo-frontend-inky.vercel.app/nearby-deals/deal?offerId=${encodeURIComponent(resolvedOfferId)}`;

            const absoluteImage = getAbsoluteImageUrl(offerImage);

            const shareMessage = [
                `${title}`,
                `By: ${merchant}`,
                // offerType ? `Type: ${offerType}` : null,
                //discountedPrice ? `Price: ${discountedPrice}` : null,
                // validTill ? `Valid Till: ${new Date(validTill).toDateString()}` : null,
                // locationText ? `Location: ${locationText}` : null,
                // details ? `Details: ${details}` : null,
                `${websiteUrl}`,
            ]
                .filter(Boolean)
                .join("\n");

            await Share.share({
                title: shareTitle,
                message: shareMessage,
                url: websiteUrl,
            });
        } catch (error) {
            showAlert("Share Error", error?.message || "Unable to share this offer right now.", "error");
        }
    };

    const handleViewStore = () => {
        if (!merchantId && !routeOfferData?.merchant) {
            showAlert("Store unavailable", "Merchant store details are not available right now.", "error");
            return;
        }

        navigation.navigate("StorePage", {
            merchantId,
            merchantProfile: merchantProfile || routeOfferData?.merchant || routeOfferData,
            offerId,
            offerImage,
            merchant: merchant,
        });
    };

    const handleSeeReviews = () => {
        navigation.navigate("ReviewsPage", {
            offerId,
            merchant,
            offerImage,
        });
    };

    const handleClaim = async () => {
        if (!canClaimVoucher) {
            showAlert(
                "Not Available",
                "This offer does not support voucher claim yet.",
                "warning"
            );
            return;
        }

        if (voucher) {
            setShowQR(true);
            return;
        }

        setClaimLoading(true);
        try {
            const claimResult = await claimOfferVoucher(offerId, {
                latitude: claimLatitude,
                longitude: claimLongitude,
                location: claimLocationLabel || locationText,
                age: customerAge,
                gender: customerGender,
            });
            const hydratedVoucher = await hydrateVoucher(claimResult);
            setVoucher(hydratedVoucher || claimResult);
            setShowQR(true);
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
                        showAlert("Already Claimed", "Showing your existing QR code.", "info");
                        return;
                    }
                } catch (syncError) {
                    console.error("Failed to sync existing voucher:", syncError);
                }
            }

            showAlert("Claim Failed", message, "error");
        } finally {
            setClaimLoading(false);
        }
    };

    const submitReview = async () => {
        const content = String(reviewText || "").trim();
        if (!content) {
            showAlert("Write a review", "Please enter your feedback before submitting.", "warning");
            return;
        }

        if (!isVoucherRedeemed(voucher)) {
            showAlert(
                "Review unavailable",
                "Reviews can only be submitted after your voucher has been redeemed.",
                "warning"
            );
            return;
        }

        const voucherId = resolveVoucherId(voucher);
        if (!voucherId) {
            showAlert("Unable to submit", "Voucher information is not available.", "error");
            return;
        }

        setReviewLoading(true);
        try {
            await submitOfferReview(voucherId, { rating: reviewRating, content });
            setReviewText("");
            setReviewRating(5);
            setReviewSubmitted(true);
            await syncOfferClaimState();
            showAlert("Thank you!", "Your review has been submitted.", "success");
        } catch (error) {
            showAlert(
                "Submit failed",
                String(error?.message || "Unable to submit review right now."),
                "error"
            );
        } finally {
            setReviewLoading(false);
        }
    };

    const handlePayOnline = async () => {
        const merchantUpi =
            offerData?.merchant?.upiId ||
            offerData?.merchant?.upi ||
            offerData?.merchant?.vpa ||
            offerData?.upiId ||
            offerData?.upi ||
            merchantProfile?.upiId ||
            merchantProfile?.upi ||
            "";

        const merchantNameParam = encodeURIComponent(merchant || "Merchant");
        const upiUrl = merchantUpi
            ? `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${merchantNameParam}&cu=INR`
            : `upi://pay?pn=${merchantNameParam}&cu=INR`;

        try {
            const supported = await Linking.canOpenURL("upi://pay");
            if (supported) {
                await Linking.openURL(upiUrl);
            } else {
                await Linking.openURL(upiUrl).catch(() => {
                    showAlert(
                        "No Payment App Found",
                        "Please install a UPI payment app (Google Pay, PhonePe, Paytm, etc.) to pay online.",
                        "warning"
                    );
                });
            }
        } catch (error) {
            showAlert(
                "Payment Error",
                "Unable to open payment app. Please ensure a UPI payment app is installed on your phone.",
                "error"
            );
        }
    };

    const downloadQR = async () => {
        if (!voucher?.qrCode && !voucher?.qrImage) {
            showAlert("QR unavailable", "Please claim this offer first.", "warning");
            return;
        }

        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
            showAlert("Permission required", "Storage permission is needed to save QR.", "warning");
            return;
        }

        try {
            const uri = await qrRef.current?.capture();
            if (!uri) {
                showAlert("Error", "Could not generate QR image.", "error");
                return;
            }
            await MediaLibrary.saveToLibraryAsync(uri);
            showAlert("Saved", "QR code saved to gallery", "success");
        } catch (error) {
            showAlert("Error", "Could not save QR code", "error");
        }
    };

    return (
        <>
            <SafeAreaView style={{ flex: 1 }}>
                <LinearGradient
                    colors={["#f8a812", "#fad081", "#f8f6f265"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
                />
                <Topbar />
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={24}
                        onPress={() => navigation.goBack()}
                        style={{ paddingLeft: 6 }}
                    />
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleToggleFavorite} disabled={favoriteLoading}>
                            {favoriteLoading ? (
                                <ActivityIndicator size="small" color="#e74c3c" style={styles.icon} />
                            ) : (
                                <Ionicons
                                    name={isFavorite ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isFavorite ? "#e74c3c" : "#000"}
                                    style={styles.icon}
                                />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShareOffer}>
                            <Ionicons name="share-social-outline" size={22} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.imageContainer}>
                            {offerMedia.length > 1 ? (
                                <View style={{ width: "100%", height: 260, position: "relative" }}>
                                    <ScrollView
                                        ref={sliderRef}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        onMomentumScrollEnd={(e) => {
                                            const index = Math.round(e.nativeEvent.contentOffset.x / MEDIA_CONTAINER_WIDTH);
                                            setActiveIndex(index);
                                        }}
                                        onScrollBeginDrag={stopAutoSlide}
                                        onScrollEndDrag={startAutoSlide}
                                    >
                                        {offerMedia.map((item, index) =>
                                            item.type === "video" ? (
                                                <View
                                                    key={`${item.uri}-${index}`}
                                                    style={{ width: MEDIA_CONTAINER_WIDTH, height: 260, borderRadius: 20, overflow: "hidden", backgroundColor: "#000" }}
                                                >
                                                    <Video
                                                        ref={videoRef}
                                                        source={{ uri: item.uri }}
                                                        style={{ width: "100%", height: "100%" }}
                                                        useNativeControls
                                                        resizeMode={ResizeMode.COVER}
                                                        shouldPlay={activeIndex === index}
                                                        isLooping={false}
                                                        onPlaybackStatusUpdate={handleVideoStatusUpdate}
                                                    />
                                                </View>
                                            ) : (
                                                <Image
                                                    key={`${item.uri}-${index}`}
                                                    source={{ uri: item.uri }}
                                                    style={{ width: MEDIA_CONTAINER_WIDTH, height: 260, resizeMode: "cover", borderRadius: 20 }}
                                                />
                                            )
                                        )}
                                    </ScrollView>

                                    <View style={styles.dotsContainer}>
                                        {offerMedia.map((_, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.dot,
                                                    activeIndex === index ? styles.activeDot : styles.inactiveDot,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ) : offerMedia.length === 1 ? (
                                offerMedia[0].type === "video" ? (
                                    <View style={{ width: "100%", height: 260, borderRadius: 20, overflow: "hidden", backgroundColor: "#000" }}>
                                        <Video
                                            source={{ uri: offerMedia[0].uri }}
                                            style={{ width: "100%", height: "100%" }}
                                            useNativeControls
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={true}
                                            isLooping={true}
                                        />
                                    </View>
                                ) : (
                                    <Image source={{ uri: offerMedia[0].uri }} style={styles.offerImage} />
                                )
                            ) : (
                                <View style={styles.fakeImage}>
                                    <Ionicons name="image-outline" size={44} color="#9a9a9a" />
                                </View>
                            )}
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.title}>{title}</Text>

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
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={styles.productCard}
                                                        activeOpacity={0.8}
                                                        onPress={() => navigation.navigate("ProductDetail", { product })}
                                                    >
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
                                                    </TouchableOpacity>
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

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.secondaryButton} onPress={handleViewStore}>
                                    <Text style={styles.secondaryButtonText}>View Store</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={handleSeeReviews}>
                                    <Text style={styles.secondaryButtonText}>See Reviews</Text>
                                </TouchableOpacity>
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

                            {isVoucherRedeemed(voucher) && !reviewSubmitted ? (
                                <View style={styles.reviewContainer}>
                                    <Text style={styles.reviewLabel}>Write a review</Text>
                                    <View style={styles.ratingRow}>
                                        {Array.from({ length: 5 }).map((_, starIndex) => (
                                            <TouchableOpacity
                                                key={starIndex}
                                                onPress={() => !reviewLoading && setReviewRating(starIndex + 1)}
                                                disabled={reviewLoading}
                                            >
                                                <Ionicons
                                                    name={starIndex < reviewRating ? "star" : "star-outline"}
                                                    size={26}
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

                            {/* How to Redeem Section */}
                            <View style={[styles.card, styles.redeemCard]}>
                                <Text style={{ ...textPresets.subtitle }}>How to Redeem</Text>
                                <View style={styles.redeemRow}>
                                    <View style={styles.redeemStep}>
                                        <Ionicons name="ticket-outline" size={33} color="#157a4f" />
                                        <Text style={styles.redeemStepLabel}>Claim Offer</Text>
                                        <Text style={styles.redeemStepDesc}>Click the claim button to secure your unique voucher code</Text>
                                    </View>
                                    <View style={styles.redeemStep}>
                                        <Ionicons name="phone-portrait-outline" size={33} color="#2563eb" />
                                        <Text style={styles.redeemStepLabel}>Show Code</Text>
                                        <Text style={styles.redeemStepDesc}>Present the digital QR code at the merchant location during visit</Text>
                                    </View>
                                    <View style={styles.redeemStep}>
                                        <Ionicons name="happy-outline" size={33} color="#eab308" />
                                        <Text style={styles.redeemStepLabel}>Enjoy!</Text>
                                        <Text style={styles.redeemStepDesc}>Redeem your discount and enjoy your premium wellness experience</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Frequently Asked Questions Section */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
                                {faqData.map((faq, index) => {
                                    const isExpanded = expandedFaqIndex === index;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.8}
                                            onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                                            style={styles.faqCard}
                                        >
                                            <View style={styles.faqHeader}>
                                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={18}
                                                    color="#666"
                                                />
                                            </View>
                                            {isExpanded && (
                                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <SafeAreaView
                    edges={["bottom"]}
                    style={{ position: "absolute", bottom: 0, width: "100%" }}
                >
                    <GoloBottom />
                </SafeAreaView>
            </SafeAreaView>

            <Modal visible={showQR} transparent animationType="slide" statusBarTranslucent>
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

                        <View style={styles.qrModalBtnRow}>
                            <TouchableOpacity style={styles.payOnlineBtn} onPress={handlePayOnline} activeOpacity={0.85}>
                                <Ionicons name="card" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.payOnlineText}>Pay Online</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.downloadBtn} onPress={downloadQR} activeOpacity={0.85}>
                                <Ionicons name="download-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.downloadText}>Download QR</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowQR(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={hideAlert}
            />
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
        height: 260,
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        borderRadius: 20,
    },
    offerImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderRadius: 20
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
        paddingBottom: 86,
    },
    title: {
        ...textPresets.title,
        marginBottom: 8,
    },
    by: {
        marginTop: 4,
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        marginBottom: 8,
        ...textPresets.subtitle
    },
    label: {
        marginTop: 8,
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
    },
    value: {
        color: "#444",
        marginTop: 2,
        ...textPresets.label
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 18,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#f8a812",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: "#f8a812",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
    },
    buyBtn: {
        marginTop: 20,
        backgroundColor: "#FBBF24",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buyText: {
        color: "#fff",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        ...textPresets.subtitle
    },
    tokenText: {
        ...textPresets.label
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
        color: "#059669",
        marginBottom: 8,
        textAlign: "center",
        ...textPresets.label
    },
    verificationCode: {
        color: "#047857",
        letterSpacing: 2,
        marginBottom: 6,
        ...textPresets.subtitle
    },
    verificationCodeHint: {
        ...textPresets.caption
    },
    qrModalBtnRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
        marginTop: 16,
    },
    payOnlineBtn: {
        flex: 1,
        backgroundColor: "#f5b849",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    payOnlineText: {
        ...textPresets.label,
        color: "#fff",
    },
    downloadBtn: {
        flex: 1,
        backgroundColor: "#065f46",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    downloadText: {
        ...textPresets.label,
        color: "#fff",
    },
    closeText: {
        marginTop: 14,
        color: "#f94741",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "rgba(204, 204, 204, 0)",
        borderRadius: 8,
    },
    productImage: {
        width: 140,
        height: 140,
        borderRadius: 8,
        marginBottom: 8,
        resizeMode: "cover",
    },
    productImagePlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
    },
    productName: {
        ...textPresets.label,
        textAlign: "center",
        color: "#333",
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
        ...textPresets.subtitle,
        color: "#111827",
        marginBottom: 8
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
        ...textPresets.label,
    },
    reviewButton: {
        marginTop: 12,
        backgroundColor: "#f5b849",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    reviewButtonText: {
        color: "#fff",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    redeemCard: {
        marginTop: 16,
    },
    redeemRow: {
        // flexDirection: "row",
    },
    redeemStep: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 4,
        marginTop: 16
    },
    redeemStepLabel: {
        color: "#111",
        marginTop: 8,
        textAlign: "center",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    redeemStepDesc: {
        ...textPresets.label,
        color: "#666",
        marginTop: 4,
        textAlign: "center",
    },
    faqSectionCard: {
        marginTop: 16,
    },
    faqCard: {
        borderWidth: 1,
        padding: 12,
        marginTop: 16,
        borderRadius: 12,
        borderColor: "#eee",
        backgroundColor: "#fff",
    },
    faqHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    faqQuestion: {
        color: "#333",
        flex: 1,
        marginRight: 8,
        ...textPresets.label,
    },
    faqAnswer: {
        color: "#555",
        marginTop: 8,
        ...textPresets.label,
    },
    dotsContainer: {
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        width: 20,
        backgroundColor: "#f8a812",
    },
    inactiveDot: {
        width: 8,
        backgroundColor: "rgba(255, 255, 255, 0.6)",
    },
});
