import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, RefreshControl, View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFavoriteAds, toggleFavoriteAd } from "../services/favoritesService";

export default function Fav({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const items = await getFavoriteAds();
            setFavorites(items);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites]),
    );

    const handleRemoveFavorite = async (item) => {
        await toggleFavoriteAd(item);
        loadFavorites();
    };

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
                <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.2) }}>Saved Ads</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadFavorites} />
                }
            >
                {loading ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={{ color: colors.text, fontFamily: "Medium", marginTop: 10 }}>
                            Loading saved ads...
                        </Text>
                    </View>
                ) : favorites.length === 0 ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <Text style={{ color: colors.text, fontFamily: "Medium" }}>No favorite ads yet</Text>
                    </View>
                ) : favorites.map((item) => (
                    <TouchableOpacity
                        key={item.adId}
                        style={[styles.card]}
                        onPress={() => navigation.navigate("AdDetails", { adId: item._id || item.adId })}
                    >
                        {item?.image ? (
                            <Image source={{ uri: item.image }} style={styles.imagePlaceholder} />
                        ) : null}

                        <View style={{ flex: 1, marginLeft: item?.image ? 12 : 0 }}>
                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: "#000000",
                                lineHeight: Math.round(16 * 1.5)
                             }} numberOfLines={1}>
                                {item.title || "Ad"}
                            </Text>
                            <Text style={{ fontSize: 12, color: "#000000", lineHeight: Math.round(12 * 1.5),
                                fontFamily: "Medium"
                             }} numberOfLines={1}>
                                {item.location || "No location"}
                            </Text>
                        </View>

                        <TouchableOpacity onPress={() => handleRemoveFavorite(item)}>
                            <MaterialCommunityIcons
                                name="heart"
                                size={26}
                                color="#e74c3c"
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
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
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginHorizontal: 10,
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 0.5,
        backgroundColor: "#ffffff"
    },

    imagePlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },

})