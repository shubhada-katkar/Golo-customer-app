import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteAd, getAdAnalytics } from "../services/analyticsService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomeAlertModal";

const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.card}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
);

// Circular progress ring — actually renders a filled arc proportional to `value` (0-100),
// instead of a flat static border like the old version.
const RateCircle = ({ label, value, color = "#f8a812" }) => {
    const size = 88;
    const strokeWidth = 9;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <View style={styles.rateBox}>
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    {/* track */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#eee"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* filled progress arc */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <View style={styles.rateTextWrap}>
                    <Text style={[styles.rateText, { color }]}>{pct.toFixed(1)}%</Text>
                </View>
            </View>
            <Text style={styles.rateLabel}>{label}</Text>
        </View>
    );
};

const InsightCard = ({ title, value, tip, color, icon }) => (
    <View style={styles.insightCard}>
        <View style={[styles.insightIconWrap, { backgroundColor: `${color}1A` }]}>
            <MaterialIcons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <Text style={styles.insightTitle}>{title}</Text>
                <Text style={[styles.insightValue, { color }]}>{value}</Text>
            </View>
            <Text style={styles.insightTip}>{tip}</Text>
        </View>
    </View>
);

export default function AdAnalytics({ navigation, route }) {
    const routeParams = route?.params || {};
    const adId = routeParams.adId;
    const [analytics, setAnalytics] = useState(null);
    const analyticsRef = useRef(analytics);
    analyticsRef.current = analytics;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "error",
        showCancelButton: false,
        cancelText: "Cancel",
        buttonText: "OK",
        onConfirm: null,
        onClose: null,
    });

    const showAlert = (title, message, type = "error", extraProps = {}) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            showCancelButton: false,
            buttonText: "OK",
            cancelText: "Cancel",
            onConfirm: null,
            onClose: null,
            ...extraProps,
        });
    };

    const hideAlert = () => {
        if (alertConfig.onClose) {
            const cb = alertConfig.onClose;
            setAlertConfig({ visible: false, title: "", message: "", type: "error", showCancelButton: false, cancelText: "Cancel", buttonText: "OK", onConfirm: null, onClose: null });
            cb();
        } else {
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }
    };

    const fetchAnalytics = useCallback(async (isSilent = false) => {
        if (!adId) {
            setLoading(false);
            setError("Ad id not found");
            return;
        }

        if (!isSilent && !analyticsRef.current) {
            setLoading(true);
        }

        try {
            const data = await getAdAnalytics(adId);
            setAnalytics(data || null);
            setError("");
        } catch (err) {
            if (!analyticsRef.current) {
                setError(err?.message || "Failed to load ad analytics");
            }
        } finally {
            setLoading(false);
        }
    }, [adId]);

    useFocusEffect(
        useCallback(() => {
            fetchAnalytics(false);
            const interval = setInterval(() => {
                fetchAnalytics(true);
            }, 30000);

            return () => clearInterval(interval);
        }, [fetchAnalytics]),
    );

    const data = useMemo(() => {
        const adViews = Number(analytics?.ad?.views ?? analytics?.ad?.uniqueVisitors ?? analytics?.ad?.viewHistory?.length ?? 0);
        return {
            clicks: Number(analytics?.stats?.clicks ?? adViews),
            visitors: Number(analytics?.stats?.visitors ?? analytics?.ad?.uniqueVisitors ?? adViews),
            contacts: Number(analytics?.stats?.contacts ?? analytics?.ad?.contactClicks ?? 0),
            wishlist: Number(analytics?.stats?.wishlist ?? analytics?.ad?.wishlistCount ?? 0),
        };
    }, [analytics]);

    const rates = useMemo(() => {
        const adCardClicks = Number(data.clicks || 0);
        const contactClicks = Number(data.contacts || 0);
        const wishlistSaves = Number(data.wishlist || 0);
        const uniqueVisitors = Number(data.visitors || 0);

        // CTR = (Contact clicks / Ad card clicks count) * 100
        const ctr = adCardClicks > 0
            ? Number(((contactClicks / adCardClicks) * 100).toFixed(1))
            : Number(analytics?.rates?.ctr ?? analytics?.ad?.clickThroughRate ?? 0);

        // Wishlist Rate = (Wishlist count / Ad card clicks count) * 100
        const wishlistRate = adCardClicks > 0
            ? Number(((wishlistSaves / adCardClicks) * 100).toFixed(1))
            : Number(analytics?.rates?.wishlistRate ?? analytics?.ad?.wishlistRate ?? 0);

        const visitorsRate = adCardClicks > 0
            ? Number(((uniqueVisitors / adCardClicks) * 100).toFixed(1))
            : Number(analytics?.rates?.visitorsRate ?? 0);

        return {
            ctr,
            visitorsRate,
            wishlistRate,
        };
    }, [data, analytics]);
    const adInfo = analytics?.ad || {};
    const resolvedAdId = adInfo?.adId || adId;

    const postedDateValue = adInfo.createdAt || routeParams.postedDate;
    const postedDate = postedDateValue
        ? new Date(postedDateValue).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
        : "-";

    const handleDeleteAd = useCallback(() => {
        if (!resolvedAdId) {
            showAlert("Error", "Ad ID is missing", "error");
            return;
        }

        showAlert(
            "Delete Ad",
            `Are you sure you want to delete "${adInfo.title || routeParams.adName || "this ad"}"? This action cannot be undone.`,
            "warning",
            {
                showCancelButton: true,
                buttonText: "Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    hideAlert();
                    try {
                        setIsDeleting(true);
                        await deleteAd(resolvedAdId);
                        showAlert("Success", "Ad deleted successfully", "success", {
                            onClose: () => navigation.goBack()
                        });
                    } catch (err) {
                        showAlert("Error", err?.message || "Failed to delete ad", "error");
                    } finally {
                        setIsDeleting(false);
                    }
                },
            }
        );
    }, [resolvedAdId, adInfo.title, routeParams.adName, navigation]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f6f2" }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} />
                </TouchableOpacity>
                <Text style={{ flex: 1, ...textPresets.title }}>Ad Analytics</Text>
                <TouchableOpacity onPress={handleDeleteAd} disabled={isDeleting} style={styles.deleteBtn}>
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#d14343" />
                    ) : (
                        <MaterialIcons name="delete-outline" size={22} color="#d14343" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", height: 1, marginVertical: 6, backgroundColor: "#000" }} />

            <ScrollView style={styles.container}
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}>

                {/* HEADER CARD */}
                <View style={styles.headerCard}>
                    <Text style={styles.headerTitle} numberOfLines={2}>{adInfo.title || routeParams.adName || "Ad"}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <MaterialIcons name="event" size={14} color="#888" />
                        <Text style={[styles.sub, { marginLeft: 4 }]}>Posted {postedDate}</Text>
                    </View>

                    {loading && (
                        <View style={styles.loadingPill}>
                            <ActivityIndicator size="small" color="#157a4f" />
                            <Text style={styles.loadingPillText}>Refreshing live data...</Text>
                        </View>
                    )}

                    {!!error && (
                        <View style={styles.errorPill}>
                            <MaterialIcons name="error-outline" size={16} color="#d14343" />
                            <Text style={styles.errorPillText}>{error}</Text>
                        </View>
                    )}
                </View>

                {/* STATS */}
                <View style={styles.row}>
                    <StatCard title="Ad Card Clicks" value={data.clicks} icon="ads-click" color="#f8a812" />
                    <StatCard title="Contact Clicks" value={data.contacts} icon="call" color="#157a4f" />
                    <StatCard title="Wishlist Saves" value={data.wishlist} icon="favorite-border" color="#d14343" />
                </View>

                {/* PERFORMANCE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Rates</Text>

                    <View style={styles.row}>
                        <RateCircle label="CTR" value={rates.ctr} color="#f5b849" />
                        <RateCircle label="Wishlist Rate" value={rates.wishlistRate} color="#157a4f" />
                    </View>
                </View>

                {/* INSIGHTS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Insights</Text>

                    <InsightCard
                        title="Click-Through Rate"
                        value={`${Number(rates.ctr || 0).toFixed(1)}%`}
                        tip="Connect with buyers directly."
                        color="#f5b849"
                        icon="ads-click"
                    />

                    <InsightCard
                        title="Wishlist Rate"
                        value={`${Number(rates.wishlistRate || 0).toFixed(1)}%`}
                        tip="Better photos can boost saves."
                        color="#157a4f"
                        icon="favorite-border"
                    />
                </View>
            </ScrollView>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <ChojaBottom />
            </SafeAreaView>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                showCancelButton={alertConfig.showCancelButton}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onClose={hideAlert}
                onCancel={hideAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 8,
        paddingBottom: 6,
    },
    backBtn: {
        padding: 10,
    },
    deleteBtn: {
        padding: 8,
    },
    container: {
        flex: 1,
        paddingHorizontal: 14,
    },
    headerCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginVertical: 14,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    headerTitle: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    loadingPill: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        alignSelf: "flex-start",
        backgroundColor: "#eafaf1",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    loadingPillText: {
        marginLeft: 8,
        color: "#157a4f",
        ...textPresets.caption,
    },
    errorPill: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        alignSelf: "flex-start",
        backgroundColor: "#fdecec",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    errorPillText: {
        marginLeft: 6,
        color: "#d14343",
        ...textPresets.caption,
    },
    row: {
        flexDirection: "row",
        marginHorizontal: -6, // cancels out each card's 6px margin so edges align with section padding
    },
    card: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 14,
        margin: 6,
        alignItems: "center",
        justifyContent: "center", // vertically centers content so cards match height
        minHeight: 100, // keeps all 3 the same height even with 1 vs 2-line titles
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    value: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    title: {
        marginTop: 4,
        ...textPresets.label,
        color: "#555",
        textAlign: "center",
    },
    sub: {
        color: "#888",
        ...textPresets.caption,
    },
    section: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        marginTop: 14,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    sectionTitle: {
        marginBottom: 14,
        ...textPresets.subtitle,
    },
    rateBox: {
        alignItems: "center",
        flex: 1,
    },
    rateTextWrap: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    rateText: {
        ...textPresets.body,
    },
    rateLabel: {
        marginTop: 8,
        ...textPresets.label,
        color: "#555",
        textAlign: "center",
    },
    insightCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#fafafa",
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
    },
    insightIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    insightValue: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    insightTitle: {
        ...textPresets.label,
        color: "#333",
    },
    insightTip: {
        ...textPresets.caption,
        color: "#777",
        marginTop: 2,
    },
});