import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, RefreshControl, View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFavoriteOffers, toggleFavoriteOffer } from "../services/offerFavoritesService";
import { LinearGradient } from "expo-linear-gradient";

export default function GoloFav({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const items = await getFavoriteOffers();
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
        await toggleFavoriteOffer(item.rawOffer || item);
        loadFavorites();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("GoloHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 20, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.5) }}>Saved Offers</Text>
            </View>

            <View style={{ backgroundColor: colors.divider, height: 1, marginVertical: 6 }} />

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
                            Loading saved offers...
                        </Text>
                    </View>
                ) : favorites.length === 0 ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <Text style={{ color: colors.text, fontFamily: "Medium" }}>No saved offers yet</Text>
                    </View>
                ) : favorites.map((item, index) => (
                    <TouchableOpacity
                        key={`${item.offerId || item._id || item.requestId || index}`}
                        style={styles.card}
                        onPress={() => navigation.navigate("OfferDetails", { offerData: item.rawOffer || item })}
                    >
                        {item?.imageUrl || item?.images?.[0] ? (
                            <Image source={{ uri: item.imageUrl || item.images[0] }} style={styles.imagePlaceholder} />
                        ) : (
                            <View style={styles.imagePlaceholder} />
                        )}

                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text, lineHeight: Math.round(16 * 1.5) }}
                                numberOfLines={1}>
                                {item.bannerTitle || item.title || "Offer"}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.text, fontFamily: "Medium", lineHeight: Math.round(13 * 1.5) }}
                                numberOfLines={1}>
                                By {item.shopName || item.merchantName || item.merchant?.name || "Nearby merchant"}
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
                <GoloBottom />
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
        padding: 10,
        marginHorizontal: 14,
        marginTop: 14,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    imagePlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },

})
