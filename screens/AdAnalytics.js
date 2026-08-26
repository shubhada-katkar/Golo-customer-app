import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteAd, getAdAnalytics } from "../services/analyticsService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomeAlertModal";

const StatCard = ({ title, value, subtitle }) => (
    <View style={styles.card}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
);

const RateCircle = ({ label, value }) => (
    <View style={styles.rateBox}>
        <View style={styles.circle}>
            <Text style={styles.rateText}>{value}</Text>
        </View>
        <Text style={styles.rateLabel}>{label}</Text>
    </View>
);

const InsightCard = ({ title, value, tip, color }) => (
    <View style={[styles.insightCard, { borderColor: color }]}>
        <Text style={[styles.insightValue, { color }]}>{value}</Text>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightTip}>{tip}</Text>
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

        // Wishlist Rate = (Ad card clicks count / Wishlist count) * 100
        const wishlistRate = wishlistSaves > 0
            ? Number(((adCardClicks / wishlistSaves) * 100).toFixed(1))
            : (adCardClicks > 0
                ? Number(((wishlistSaves / adCardClicks) * 100).toFixed(1))
                : Number(analytics?.rates?.wishlistRate ?? analytics?.ad?.wishlistRate ?? 0));

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
        <SafeAreaView style={{ flex: 1 }}>
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
                            style={{ padding: 10 }}
                            size={22}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ flex: 1, ...textPresets.title }}>Ad Analytics</Text>
                <TouchableOpacity onPress={handleDeleteAd} disabled={isDeleting} style={styles.deleteBtn}>
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#d14343" />
                    ) : (
                        <MaterialIcons name="delete-outline" size={24} color="#d14343" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", height: 1, marginVertical: 6, backgroundColor: "#000" }} />


            <ScrollView style={styles.container}
                contentContainerStyle={{ paddingBottom: 110 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{adInfo.title || routeParams.adName || "Ad"}</Text>
                    <Text style={styles.sub}>Posted {postedDate}</Text>
                </View>

                {loading && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <ActivityIndicator size="small" color="#157a4f" />
                        <Text style={{
                            marginLeft: 8, color: "#666",
                            ...textPresets.body, lineHeight: Math.round(14 * 1.5)
                        }}>Refreshing live data...</Text>
                    </View>
                )}

                {!!error && <Text style={{
                    color: "#d14343", marginBottom: 8, ...textPresets.label
                }}>{error}</Text>}

                {/* STATS */}
                {/* <View style={styles.row}> */}
                {/* <StatCard title="Unique Visitors" value={data.visitors} /> */}
                {/* </View> */}

                <View style={styles.row}>
                    <StatCard title="Ad Card Clicks" value={data.clicks} />
                    <StatCard title="Contact Clicks" value={data.contacts} />
                    <StatCard title="Wishlist Saves" value={data.wishlist} />
                </View>


                {/* PERFORMANCE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Rates</Text>

                    <View style={styles.row}>
                        <RateCircle label="CTR" value={`${Number(rates.ctr || 0).toFixed(1)}%`} />
                        <RateCircle label="Visitors" value={`${Number(rates.visitorsRate || 0).toFixed(1)}%`} />
                        <RateCircle label="Wishlist" value={`${Number(rates.wishlistRate || 0).toFixed(1)}%`} />
                    </View>
                </View>

                {/* INSIGHTS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Insights</Text>

                    <InsightCard
                        title="Click-Through Rate"
                        value={`${Number(rates.ctr || 0).toFixed(1)}%`}
                        tip="Try a clearer call-to-action."
                        color="#f59e0b"
                    />

                    <InsightCard
                        title="Wishlist Rate"
                        value={`${Number(rates.wishlistRate || 0).toFixed(1)}%`}
                        tip="Better photos can boost saves."
                        color="#ef4444"
                    />

                    <InsightCard
                        title="Unique Reach"
                        value={`${Number(rates.visitorsRate || 0).toFixed(1)}%`}
                        tip="Promote to reach more users."
                        color="#8b5cf6"
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
        paddingHorizontal: 14
    },
    deleteBtn: {
        padding: 8,
    },
    container: {
        flex: 1,
        padding: 12,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    row: {
        flexDirection: "row",
        marginHorizontal: -6, // cancels out each card's 6px margin so edges align with section padding
    },
    card: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 12,
        margin: 6,
        alignItems: "center",
        justifyContent: "center", // add this — vertically centers content so cards match height
        borderWidth: 1,
        borderColor: "#afafaf",
        minHeight: 90, // add this — keeps all 3 the same height even with 1 vs 2-line titles
    },
    value: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    title: {
        marginTop: 6,
        ...textPresets.label,
        color: "#555",
    },
    sub: {
        color: "#555",
        ...textPresets.caption,
    },
    section: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    sectionTitle: {
        marginBottom: 10,
        ...textPresets.subtitle
    },
    rateBox: {
        alignItems: "center",
        flex: 1,
    },
    circle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 6,
        borderColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    rateText: {
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body,
    },
    rateLabel: {
        marginTop: 6,
        ...textPresets.label,
    },
    insightCard: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    insightValue: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    insightTitle: {
        ...textPresets.label,
        marginTop: 4,
    },
    insightTip: {
        ...textPresets.caption,
        color: "#555",
        marginTop: 4,
    },
});