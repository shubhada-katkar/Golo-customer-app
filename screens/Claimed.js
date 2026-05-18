import React, { useCallback, useContext, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchMyClaimedOffers } from "../services/voucherService";

export default function Claimed({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [claimedOffers, setClaimedOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadClaimedOffers = useCallback(async ({ isRefresh = false } = {}) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            const data = await fetchMyClaimedOffers({ limit: 100 });
            setClaimedOffers(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = String(err?.message || "Unable to load claimed offers");
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadClaimedOffers();
        }, [loadClaimedOffers]),
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("ChojaHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.5) }}>Claimed Offers</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadClaimedOffers({ isRefresh: true })}
                            tintColor={colors.text}
                        />
                    }
                >
                    {error ? (
                        <Text style={[styles.infoText, { color: "#D32F2F" }]}>{error}</Text>
                    ) : null}

                    {!error && claimedOffers.length === 0 ? (
                        <Text style={[styles.infoText, { color: colors.text }]}>
                            No claimed offers yet.
                        </Text>
                    ) : null}

                    {claimedOffers.map((item, index) => (
                        <View key={item?.id || index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                            {item?.image ? (
                                <Image source={{ uri: item.image }} style={styles.offerImage} />
                            ) : (
                                <View style={styles.imagePlaceholder} />
                            )}

                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text, lineHeight: Math.round(16 * 1.5) }} numberOfLines={1}>
                                    {item?.title || "Untitled Offer"}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.text, lineHeight: Math.round(12 * 1.5), fontFamily:"Medium" }} numberOfLines={1}>
                                    {item?.merchantName || "Unknown Merchant"}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

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
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginHorizontal: 14,
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 1
    },
    imagePlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },
    offerImage: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },
    centerWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    infoText: {
        marginTop: 24,
        textAlign: "center",
        fontFamily: "Medium",
        paddingHorizontal: 20,
    },
})