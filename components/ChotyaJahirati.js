import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";

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

export default function ChotyaJahirati({ selectedCategory, searchQuery = "" }) {
    const { colors } = useContext(ThemeContext);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigation = useNavigation();
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchAds(1);
    }, [selectedCategory]);

    const fetchAds = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            let url = `${BASE_URL}/ads?page=${pageNumber}&limit=10`;

            if (selectedCategory && selectedCategory !== "null") {
                url += `&category=${encodeURIComponent(selectedCategory)}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (json?.data) {

                if (pageNumber === 1) {
                    setAds(json.data);
                } else {
                    setAds(prev => [...prev, ...json.data]);
                }

                if (json.data.length < 10) {
                    setHasMore(false);
                }

                setPage(pageNumber);
            }

        } catch (err) {
            console.warn("Failed to fetch ads", err.message || err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // 🔥 Template Mapping
    const TEMPLATE_MAP = {
        1: Template1Card,
        2: Template2Card,
        3: Template3Card,
    };

    const loadMoreAds = () => {
        if (!loadingMore && hasMore) {
            fetchAds(page + 1);
        }
    };

    const filteredAds = ads.filter((ad) => adMatchesSearch(ad, searchQuery));

    const renderItem = ({ item }) => {

        const templateNumber = Number(item.templateId);

        const CardComponent =
            TEMPLATE_MAP[templateNumber] || Template1Card;

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
                <Text>No ads found.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <FlatList
                data={filteredAds}
                keyExtractor={(item, index) =>
                    `${item._id || item.adId}-${index}`
                }
                renderItem={renderItem}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 70,
                }}
                showsVerticalScrollIndicator={false}

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
            />
        </KeyboardAvoidingView>
    );
}
const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
