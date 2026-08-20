import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import Template1Card from "../components/Template1Card";
import Template2Card from "../components/Template2Card";
import Template3Card from "../components/Template3Card";
import { BASE_URL } from "../config";
import { getBackendCategoryName, matchesCategorySubFilter } from "../utils/categorySubFilters";

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

export default function ChotyaJahirati({ selectedCategory, selectedSubFilter = null, searchQuery = "", lat, lng, locationPlaceName = "", selectedSort = "newest" }) {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigation = useNavigation();
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // fetchAds: always defined before useEffect so the closure captures current prop values.
    // Primary strategy: /ads/search?location=<placeName> — the backend matches this against
    // the ad's `cities` array (set in CalendarScreen when posting), so only ads published
    // for the user's current city/area are shown.
    // Fallback: /ads/nearby (geo) when no place name is available.
    const fetchAds = useCallback(async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            const backendCategory = getBackendCategoryName(selectedCategory);
            let url;

            let sortBy = 'createdAt';
            let sortOrder = 'desc';

            if (selectedSort === 'oldest') {
                sortBy = 'createdAt';
                sortOrder = 'asc';
            } else if (selectedSort === 'price_desc') {
                sortBy = 'price';
                sortOrder = 'desc';
            } else if (selectedSort === 'price_asc') {
                sortBy = 'price';
                sortOrder = 'asc';
            } else if (selectedSort === 'nearby') {
                sortBy = 'distance';
                sortOrder = 'asc';
            }

            if (locationPlaceName && locationPlaceName.trim() && locationPlaceName !== "your current area") {
                // PRIMARY: text-based location search — matches ad's `cities` array on backend
                url = `${BASE_URL}/ads/search?location=${encodeURIComponent(locationPlaceName)}&page=${pageNumber}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
                // Only pass lat/lng when sorting by distance (nearby) to avoid a backend casting/query crash on /ads/search
                if (selectedSort === 'nearby' && lat && lng) {
                    url += `&lat=${lat}&lng=${lng}`;
                }
                if (backendCategory) {
                    url += `&category=${encodeURIComponent(backendCategory)}`;
                }
            } else if (lat && lng) {
                // FALLBACK: geo nearby when we have coordinates but no resolved place name yet
                if (selectedSort !== 'nearby') {
                    url = `${BASE_URL}/ads/search?lat=${lat}&lng=${lng}&page=${pageNumber}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
                } else {
                    url = `${BASE_URL}/ads/nearby?lat=${lat}&lng=${lng}&distance=50000&page=${pageNumber}&limit=10`;
                }
                if (backendCategory) {
                    url += `&category=${encodeURIComponent(backendCategory)}`;
                }
            } else {
                // LAST RESORT: general listing using /ads/search (not cached, honours sortBy/sortOrder)
                // Note: /ads is cached server-side without sort in the cache key, so it ignores sort params
                url = `${BASE_URL}/ads/search?page=${pageNumber}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
                if (backendCategory) {
                    url += `&category=${encodeURIComponent(backendCategory)}`;
                }
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
    }, [lat, lng, locationPlaceName, selectedCategory, selectedSort]);

    // Re-fetch from page 1 whenever category, location, or sort changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchAds(1);
    }, [fetchAds]);

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

    const filteredAds = ads.filter((ad) => {
        const matchesSearch = adMatchesSearch(ad, searchQuery);
        const matchesSubFilter = matchesCategorySubFilter(ad, selectedCategory, selectedSubFilter);
        return matchesSearch && matchesSubFilter;
    });

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
                    paddingBottom: 100,
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