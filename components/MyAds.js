import React, { useContext, useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Template1Card from "../components/Template1Card";
import Template2Card from "../components/Template2Card";
import Template3Card from "../components/Template3Card";
import { BASE_URL } from "../config";

const normalizeText = (value) =>
    String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const adMatchesSearch = (ad, query) => {
    const needle = normalizeText(query);
    if (!needle) return true;

    const nameCandidates = [
        ad?.adTitle,
        ad?.title,
        ad?.name,
        ad?.bannerTitle,
        ad?.businessName,
    ];

    const categoryCandidates = [
        ad?.category,
        ad?.adCategory,
        ad?.bannerCategory,
        ad?.type,
        ad?.subCategory,
    ];

    const candidates = [...nameCandidates, ...categoryCandidates];
    return candidates.some((value) => normalizeText(value).includes(needle));
};

export default function MyAds({ selectedCategory, searchQuery = "" }) {

    const { colors } = useContext(ThemeContext);

    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigation = useNavigation();
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const TEMPLATE_MAP = {
        1: Template1Card,
        2: Template2Card,
        3: Template3Card,
    };

    const fetchUserAds = async (pageNumber = 1) => {
        try {

            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            const token = await AsyncStorage.getItem("customerToken");

            // Build URL dynamically
            let url = `${BASE_URL}/ads/user/me?page=${pageNumber}&limit=10`;

            if (selectedCategory && selectedCategory !== "null") {
                url += `&category=${encodeURIComponent(selectedCategory)}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (json?.data) {

                const newAds = json.data;

                if (pageNumber === 1) {
                    setAds(newAds);
                } else {
                    setAds(prev => {
                        const merged = [...prev, ...newAds];

                        const uniqueAds = Array.from(
                            new Map(merged.map(ad => [ad._id, ad])).values()
                        );

                        return uniqueAds;
                    });
                }

                // If fewer ads returned than limit → no more pages
                if (newAds.length < 10) {
                    setHasMore(false);
                }

                setPage(pageNumber);
            }

        } catch (err) {
            console.warn("Failed to fetch user ads", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreAds = () => {
        if (!loadingMore && hasMore) {
            fetchUserAds(page + 1);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setPage(1);
            setHasMore(true);
            fetchUserAds(1);
        }, [selectedCategory])
    );

    const filteredAds = ads.filter((ad) => adMatchesSearch(ad, searchQuery));

    const renderItem = ({ item, index }) => {

        const templateNumber = Number(item.templateId);

        const CardComponent =
            TEMPLATE_MAP[templateNumber];

        return (
            <CardComponent
                ad={item}
                navigation={navigation}
            />
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!loading && ads.length === 0) {
        return (
            <View style={styles.center}>
                <Text>No ads posted yet.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={filteredAds}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            renderItem={renderItem}
            onEndReached={loadMoreAds}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                loadingMore ? <ActivityIndicator size="small" /> : null
            }
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text>No ads match your search.</Text>
                </View>
            }
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 100
            }}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
