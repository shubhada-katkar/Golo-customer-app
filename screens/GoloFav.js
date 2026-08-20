import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, RefreshControl, View, StyleSheet, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFavoriteOffers, getLocalFavoriteOffers, getOfferId, toggleFavoriteOffer } from "../services/offerFavoritesService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { FavSkeleton } from "../components/Skeleton";

const FavOfferCard = React.memo(({ item, navigation, onRemove }) => {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("OfferDetails", { offerData: item.rawOffer || item })}
            activeOpacity={0.8}
        >
            {item?.imageUrl || item?.images?.[0] ? (
                <Image source={{ uri: item.imageUrl || item.images[0] }} style={styles.imagePlaceholder} />
            ) : (
                <View style={styles.imagePlaceholder} />
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ ...textPresets.body, lineHeight: Math.round(14 * 1.5) }} numberOfLines={1}>
                    {item.bannerTitle || item.title || "Offer"}
                </Text>
                <Text style={{ ...textPresets.label }} numberOfLines={1}>
                    By {item.shopName || item.merchantName || item.merchant?.name || "Nearby merchant"}
                </Text>
            </View>

            <TouchableOpacity onPress={() => onRemove(item)} style={{ padding: 6 }}>
                <MaterialCommunityIcons
                    name="heart"
                    size={26}
                    color="#e74c3c"
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

export default function GoloFav({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFavorites = useCallback(async ({ isRefresh = false } = {}) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            // Stale-While-Revalidate: load local cache immediately
            const cached = await getLocalFavoriteOffers();
            if (Array.isArray(cached) && cached.length > 0) {
                setFavorites(cached);
                setLoading(false);
            } else {
                setLoading(true);
            }
        }

        try {
            const items = await getFavoriteOffers();
            setFavorites(items);
        } catch {
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites]),
    );

    const handleRemoveFavorite = useCallback(async (item) => {
        const offerIdToRemove = getOfferId(item.rawOffer || item);
        // Optimistic local state update (0ms UI latency)
        setFavorites((prev) => prev.filter((f) => getOfferId(f.rawOffer || f) !== offerIdToRemove));
        try {
            await toggleFavoriteOffer(item.rawOffer || item);
        } catch {
            // Re-sync on failure
            const fresh = await getFavoriteOffers();
            setFavorites(fresh);
        }
    }, []);

    const renderItem = useCallback(({ item }) => (
        <FavOfferCard item={item} navigation={navigation} onRemove={handleRemoveFavorite} />
    ), [navigation, handleRemoveFavorite]);

    const keyExtractor = useCallback((item, index) => {
        const id = getOfferId(item.rawOffer || item);
        return String(id || item.offerId || item._id || item.requestId || `fav-${index}`);
    }, []);

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
                <TouchableOpacity onPress={() => navigation.navigate("GoloHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            style={{ padding: 10 }}
                        />
                    </View>
                </TouchableOpacity>
                <Text style={{ ...textPresets.title }}>Saved Offers</Text>
            </View>

            <View style={{ height: 1, marginVertical: 6, backgroundColor: "#000" }} />

            {loading ? (
                <FavSkeleton count={4} />
            ) : favorites.length === 0 ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                    <Text style={{ ...textPresets.body }}>No saved offers yet</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadFavorites({ isRefresh: true })}
                        />
                    }
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                />
            )}

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
});
