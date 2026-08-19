import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, RefreshControl, View, StyleSheet, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getAdId, getFavoriteAds, getLocalFavoriteAds, toggleFavoriteAd } from "../services/favoritesService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { FavSkeleton } from "../components/Skeleton";

const getAdImageUri = (item) => {
    if (Array.isArray(item?.images) && item.images.length > 0) return item.images[0];
    if (Array.isArray(item?.photos) && item.photos.length > 0) return item.photos[0];
    if (typeof item?.image === "string" && item.image) return item.image;
    if (typeof item?.imageUrl === "string" && item.imageUrl) return item.imageUrl;
    if (typeof item?.thumbnail === "string" && item.thumbnail) return item.thumbnail;
    return null;
};

const getAdDescription = (item) => {
    return item?.description || item?.body || item?.details || item?.adDescription || "";
};

const FavAdCard = React.memo(({ item, navigation, onRemove }) => {
    const imageUri = getAdImageUri(item);
    const description = getAdDescription(item);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AdDetails", { adId: item._id || item.adId })}
            activeOpacity={0.8}
        >
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePlaceholder} />
            ) : null}

            <View style={{ flex: 1, marginLeft: imageUri ? 12 : 0 }}>
                <Text style={{
                    ...textPresets.body,
                    lineHeight: Math.round(14 * 1.5)
                }} numberOfLines={1}>
                    {item.title || "Ad"}
                </Text>
                <Text style={{
                    ...textPresets.caption, color: "#000000",
                }} numberOfLines={1}>
                    {item.location || "No location"}
                </Text>
                {description ? (
                    <Text style={{
                        ...textPresets.caption, color: "#666666", marginTop: 2
                    }} numberOfLines={1}>
                        {description}
                    </Text>
                ) : null}
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

export default function Fav({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFavorites = useCallback(async ({ isRefresh = false } = {}) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            // Stale-While-Revalidate: load local cache immediately (0ms delay)
            const cached = await getLocalFavoriteAds();
            if (Array.isArray(cached) && cached.length > 0) {
                setFavorites(cached);
                setLoading(false);
            } else {
                setLoading(true);
            }
        }

        try {
            const items = await getFavoriteAds();
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
        const targetId = getAdId(item);
        // Optimistic local state removal (0ms latency)
        setFavorites((prev) => prev.filter((f) => getAdId(f) !== targetId));
        try {
            await toggleFavoriteAd(item);
        } catch {
            const fresh = await getFavoriteAds();
            setFavorites(fresh);
        }
    }, []);

    const renderItem = useCallback(({ item }) => (
        <FavAdCard item={item} navigation={navigation} onRemove={handleRemoveFavorite} />
    ), [navigation, handleRemoveFavorite]);

    const keyExtractor = useCallback((item, index) => {
        return String(getAdId(item) || item.title || `fav-ad-${index}`);
    }, []);

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
                <TouchableOpacity onPress={() => navigation.navigate("ChojaHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>
                </TouchableOpacity>
                <Text style={{ ...textPresets.title }}>Saved Ads</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            {loading ? (
                <FavSkeleton count={4} />
            ) : favorites.length === 0 ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                    <Text style={{ color: colors.text }}>No favorite ads yet</Text>
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
                            tintColor={colors.text}
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