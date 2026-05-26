import React, { useCallback, useContext, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFavoriteOffers, toggleFavoriteOffer } from "../services/offerFavoritesService";

export default function GoloFav({navigation}) {
    const { colors } = useContext(ThemeContext);
    const [favorites, setFavorites] = useState([]);

    const loadFavorites = useCallback(async () => {
        const items = await getFavoriteOffers();
        setFavorites(items);
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
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("GoloHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.2) }}>Saved Offers</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {favorites.length === 0 ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                        <Text style={{ color: colors.text, fontFamily: "Medium" }}>No saved offers yet</Text>
                    </View>
                ) : favorites.map((item, index) => (
                    <TouchableOpacity
                        key={`${item.offerId}-${index}`}
                        style={[styles.card, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate("OfferDetails", { offerData: item.rawOffer || item })}
                    >
                        {item?.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} style={styles.imagePlaceholder} />
                        ) : (
                            <View style={styles.imagePlaceholder} />
                        )}

                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text }}
                                numberOfLines={1}>
                                {item.bannerTitle || item.title || "Offer"}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.text, fontFamily: "Medium" }}
                                numberOfLines={1}>
                                {item.shopName || item.merchantName || "Nearby merchant"}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.text, opacity: 0.8, marginTop: 2 }}
                                numberOfLines={1}>
                                {item.location || "Location not available"}
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
        padding: 12,
        marginHorizontal: 10,
        marginTop: 14,
        borderRadius: 12,
        borderWidth:0.5
    },

    imagePlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },

})
