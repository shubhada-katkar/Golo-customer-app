import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteAd, getAdAnalytics } from "../services/analyticsService";

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
    const { colors } = useContext(ThemeContext);
    const routeParams = route?.params || {};
    const adId = routeParams.adId;
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        if (!adId) {
            setLoading(false);
            setError("Ad id not found");
            return;
        }

        try {
            const data = await getAdAnalytics(adId);
            setAnalytics(data || null);
            setError("");
        } catch (err) {
            setError(err?.message || "Failed to load ad analytics");
        } finally {
            setLoading(false);
        }
    }, [adId]);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 10000);

        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    const data = useMemo(() => ({
        clicks: analytics?.stats?.clicks || analytics?.ad?.views || 0,
        visitors: analytics?.stats?.visitors || analytics?.ad?.uniqueVisitors || 0,
        contacts: analytics?.stats?.contacts || analytics?.ad?.contactClicks || 0,
        wishlist: analytics?.stats?.wishlist || analytics?.ad?.wishlistCount || 0,
    }), [analytics]);

    const rates = analytics?.rates || {
        ctr: analytics?.ad?.clickThroughRate || 0,
        visitorsRate: 0,
        wishlistRate: analytics?.ad?.wishlistRate || 0,
    };
    const adInfo = analytics?.ad || {};
    const resolvedAdId = adInfo?.adId || adId;

    const postedDateValue = adInfo.createdAt || routeParams.postedDate;
    const postedDate = postedDateValue
        ? new Date(postedDateValue).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
        : "-";

    const handleDeleteAd = useCallback(() => {
        if (!resolvedAdId) {
            Alert.alert("Error", "Ad ID is missing");
            return;
        }

        Alert.alert(
            "Delete Ad",
            `Are you sure you want to delete "${adInfo.title || routeParams.adName || "this ad"}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteAd(resolvedAdId);
                            Alert.alert("Success", "Ad deleted successfully", [
                                { text: "OK", onPress: () => navigation.goBack() },
                            ]);
                        } catch (err) {
                            Alert.alert("Error", err?.message || "Failed to delete ad");
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ],
        );
    }, [resolvedAdId, adInfo.title, routeParams.adName, navigation]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />


            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(22 * 1.5), flex: 1 }}>Ad Analytics</Text>
                <TouchableOpacity onPress={handleDeleteAd} disabled={isDeleting} style={styles.deleteBtn}>
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#d14343" />
                    ) : (
                        <MaterialIcons name="delete-outline" size={24} color="#d14343" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />


            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={{ paddingBottom: 110 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{adInfo.title || routeParams.adName || "Ad"}</Text>
                    <Text style={styles.sub}>Posted {postedDate}</Text>
                </View>

                {loading && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <ActivityIndicator size="small" color="#157a4f" />
                        <Text style={{
                            marginLeft: 8, color: "#666", fontFamily: "Medium",
                            fontSize: 14, lineHeight: Math.round(14 * 1.5)
                        }}>Refreshing live data...</Text>
                    </View>
                )}

                {!!error && <Text style={{
                    color: "#d14343", marginBottom: 8, fontSize: 12,
                    fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                }}>{error}</Text>}

                {/* STATS */}
                <View style={styles.row}>
                    <StatCard title="Ad Card Clicks" value={data.clicks} />
                    <StatCard title="Unique Visitors" value={data.visitors} />
                </View>

                <View style={styles.row}>
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
        fontSize: 18,
        fontFamily: "SemiBold",
        lineHeight: Math.round(18 * 1.2),
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    card: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        margin: 6,
    },

    value: {
        fontSize: 22,
        fontFamily: "Bold",
        lineHeight: Math.round(22 * 1.5),
    },

    title: {
        marginTop: 6,
        fontSize: 13,
        color: "#555",
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5),
    },

    sub: {
        fontSize: 11,
        color: "#999",
        fontFamily: "Medium",
        lineHeight: Math.round(11 * 1.5),
    },

    section: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
    },

    sectionTitle: {
        fontSize: 16,
        fontFamily: "SemiBold",
        lineHeight: Math.round(16 * 1.5),
        marginBottom: 10,
    },

    funnelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },

    funnelText: {
        color: "#444",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
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
        fontFamily: "Bold",
        lineHeight: Math.round(14 * 1.5),
        fontSize: 14,
    },

    rateLabel: {
        marginTop: 6,
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },

    insightCard: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },

    insightValue: {
        fontSize: 18,
        fontFamily: "Bold",
        lineHeight: Math.round(18 * 1.5),
    },

    insightTitle: {
        fontSize: 14,
        fontFamily: "SemiBold",
        lineHeight: Math.round(14 * 1.5),
        marginTop: 4,
    },

    insightTip: {
        fontSize: 12,
        color: "#777",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        marginTop: 4,
    },
});