import React, { useEffect, useState, useMemo, useCallback } from "react";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

export default function LoyaltyPoints({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loyaltyTier, setLoyaltyTier] = useState("Bronze");
    const [storesList, setStoresList] = useState([]);
    const [loyaltyHistory, setLoyaltyHistory] = useState([]);

    const fetchLoyaltyData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            let token;
            try {
                token = await getValidToken();
            } catch (authErr) {
                await handleAuthError(navigation);
                return;
            }

            if (!token) {
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const [profileRes, historyRes] = await Promise.all([
                fetch(`${BASE_URL}/users/profile`, { headers }).catch(() => null),
                fetch(`${BASE_URL}/vouchers/loyalty-history`, { headers }).catch(() => null),
            ]);

            let profilePts = 0;
            let profileTier = "Bronze";

            if (profileRes && profileRes.ok) {
                const profileJson = await profileRes.json();
                const profileData = profileJson?.data || {};
                profilePts = Number(profileData.loyaltyPoints || 0);
                profileTier = profileData.loyaltyTier || (profilePts >= 20000 ? "Platinum" : profilePts >= 5000 ? "Gold" : profilePts >= 1000 ? "Silver" : "Bronze");
            }

            let historyItems = [];
            if (historyRes && historyRes.ok) {
                const historyJson = await historyRes.json();
                historyItems = Array.isArray(historyJson?.data) ? historyJson.data : [];
            }

            setLoyaltyHistory(historyItems);

            // Group transactions by store name to show store-wise loyalty points
            const storeMap = {};
            historyItems.forEach((item) => {
                const storeName = (item?.storeName || "Local Merchant").trim();
                if (!storeMap[storeName]) {
                    storeMap[storeName] = {
                        id: item?.id || storeName,
                        storeName: storeName,
                        points: 0,
                        redemptionsCount: 0,
                        history: [],
                    };
                }
                const pts = Number(item?.points || 0);
                storeMap[storeName].points += pts;
                storeMap[storeName].redemptionsCount += 1;
                storeMap[storeName].history.push(item);
            });

            const aggregatedStores = Object.values(storeMap).sort((a, b) => b.points - a.points);
            const computedTotal = profilePts > 0 ? profilePts : aggregatedStores.reduce((sum, s) => sum + s.points, 0);

            setTotalPoints(computedTotal);
            setLoyaltyTier(profileTier);
            setStoresList(aggregatedStores);
        } catch (err) {
            console.error("Failed to load loyalty points:", err);
            setError(err?.message || "Unable to load store loyalty points.");
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    useEffect(() => {
        fetchLoyaltyData();
    }, [fetchLoyaltyData]);

    // Filter store list by search query
    const filteredStores = useMemo(() => {
        if (!searchQuery.trim()) return storesList;
        const q = searchQuery.toLowerCase().trim();
        return storesList.filter((s) => s.storeName.toLowerCase().includes(q));
    }, [storesList, searchQuery]);

    // Get top store IDs for highlighting top store rewards
    const topStoreNames = useMemo(() => {
        if (!storesList.length) return [];
        return storesList.slice(0, 3).map((s) => s.storeName);
    }, [storesList]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f9fa"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />

            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={24} />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Loyalty Rewards</Text>
                <TouchableOpacity style={{ padding: 10 }} onPress={fetchLoyaltyData}>
                    <Feather name="refresh-cw" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1, opacity: 0.1 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} style={styles.container} showsVerticalScrollIndicator={false}>

                {/* Total Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.balanceLabel}>TOTAL REWARD BALANCE</Text>
                        <Text style={styles.balanceValue}>{totalPoints} <Text style={{ color: "#157a4f", ...textPresets.label }}>Pts</Text></Text>
                    </View>
                    <View style={styles.tierBadge}>
                        <MaterialIcons name="workspace-premium" size={16} color="#d97706" style={{ marginRight: 4 }} />
                        <Text style={styles.tierBadgeText}>{loyaltyTier} Tier</Text>
                    </View>
                </View>

                {/* Search Shop Input */}
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={20} color="#8e8e93" style={{ marginRight: 6 }} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search Shop"
                        placeholderTextColor="#8e8e93"
                        style={styles.searchInput}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                            <Feather name="x" size={16} color="#8e8e93" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Store Wise Distribution List */}
                <View style={styles.row2}>
                    <Text style={styles.sectionHeader}>STORE WISE POINTS DISTRIBUTION</Text>

                    {loading ? (
                        <View style={styles.loaderWrapper}>
                            <ActivityIndicator size="large" color="#157a4f" />
                            <Text style={styles.statusText}>Loading store loyalty rewards...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.loaderWrapper}>
                            <Text style={[styles.statusText, { color: "#b00020" }]}>{error}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={fetchLoyaltyData}>
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredStores.length === 0 ? (
                        <View style={styles.loaderWrapper}>
                            <Text style={styles.statusText}>
                                {searchQuery ? "No store matched your search query." : "No store loyalty records found yet."}
                            </Text>
                        </View>
                    ) : (
                        filteredStores.map((store, index) => {
                            const storePoints = store.points || 0;
                            const isTopStore = topStoreNames.includes(store.storeName);
                            const initial = String(store.storeName || "S").charAt(0).toUpperCase();
                            const isLast = index === filteredStores.length - 1;

                            return (
                                <View
                                    key={`${store.id || store.storeName}-${index}`}
                                    style={[
                                        styles.card1,
                                        !isLast && { borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
                                    ]}
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={[styles.avatarCircle, isTopStore && { borderColor: "#d97706", backgroundColor: "#fff7ed" }]}>
                                            <Text style={[styles.avatarText, isTopStore && { color: "#d97706" }]}>{initial}</Text>
                                        </View>
                                        <View style={styles.customerInfo}>
                                            <Text
                                                style={[
                                                    styles.customerName,
                                                    { color: isTopStore ? "#105c3b" : "#111827" },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {store.storeName}
                                            </Text>
                                            <Text style={styles.customerEmail}>
                                                {store.redemptionsCount} {store.redemptionsCount === 1 ? "offer" : "offers"} redeemed
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.pointsBadge, { backgroundColor: isTopStore ? "#f8d612" : "#f3f4f6" }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            {isTopStore && (
                                                <MaterialIcons name="star" size={14} color="#000000" style={{ marginRight: 4 }} />
                                            )}
                                            <Text style={[styles.pointsNumber, { color: isTopStore ? "#000000" : "#374151" }]}>
                                                +{storePoints}
                                            </Text>
                                        </View>
                                        <Text style={[styles.pointsLabel, { color: isTopStore ? "#000000" : "#6b7280" }]}>
                                            Points
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <GoloBottom navigation={navigation} activeScreen="ProfilePage" />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    pageTitle: {
        ...textPresets.title,
        flex: 1,
    },
    balanceCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        marginHorizontal: 14,
        marginTop: 14,
        padding: 16,
        borderRadius: 14,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    balanceLabel: {
        ...textPresets.caption,
        color: "#64748b",
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: "#0f172a",
        marginTop: 2,
        ...textPresets.label
    },
    tierBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fcd34d",
    },
    tierBadgeText: {
        ...textPresets.caption,
        color: "#d97706",
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        marginHorizontal: 14,
        marginTop: 14,
        marginBottom: 4,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: "#d1d5db",
        paddingHorizontal: 10,
        height: 44,
    },
    searchInput: {
        flex: 1,
        ...textPresets.body,
    },
    row2: {
        marginHorizontal: 14,
        marginTop: 14,
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: "#e5e7eb",
        paddingBottom: 10,
        overflow: "hidden",
    },
    sectionHeader: {
        ...textPresets.caption,
        color: "#64748b",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },
    card1: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#b6dbc3",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#157a4f",
    },
    avatarText: {
        color: "#157a4f",
        ...textPresets.subtitle,
    },
    customerInfo: {
        marginLeft: 14,
        flex: 1,
    },
    customerName: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    customerEmail: {
        ...textPresets.caption,
        color: "#6b7280",
    },
    pointsBadge: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: "#e5e7eb",
    },
    pointsNumber: {
        ...textPresets.subtitle,
    },
    pointsLabel: {
        ...textPresets.label,
    },
    loaderWrapper: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    statusText: {
        marginTop: 10,
        textAlign: "center",
        ...textPresets.caption,
    },
    retryBtn: {
        marginTop: 12,
        backgroundColor: "#157a4f",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryBtnText: {
        color: "#ffffff",
        ...textPresets.label,
    },
});