import React, { useContext, useEffect, useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width, height } = Dimensions.get("window");

export default function MyAds({ selectedCategory }) {
    const { colors } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const fetchUserAds = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('customerToken');
            if (!token) {
                console.warn('No token found');
                setAds([]);
                return;
            }

            const res = await fetch(`${BASE_URL}/ads/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            let filteredAds = [];
            if (json && json.success && Array.isArray(json.data)) {
                filteredAds = json.data;
            } else if (json && json.data) {
                filteredAds = json.data || [];
            }

            // Filter by category if selected
            if (selectedCategory && selectedCategory !== "null") {
                filteredAds = filteredAds.filter(ad => ad.category === selectedCategory);
            }

            setAds(filteredAds);
        } catch (err) {
            console.warn('Failed to fetch user ads', err.message || err);
            setAds([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useFocusEffect(
        useCallback(() => {
            fetchUserAds();
        }, [fetchUserAds, selectedCategory])
    );
    return (
        <ScrollView contentContainerStyle={{paddingBottom:90, paddingHorizontal:16}} >
            {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                </View>
            ) : null}

            {(!loading && ads.length === 0) && (
                <View style={{ padding: 20 }}>
                    <Text style={{ textAlign: 'center' }}>No ads posted yet.</Text>
                </View>
            )}

            {ads.map((ad, idx) => (
                <TouchableOpacity 
                    key={ad._id || ad.adId || idx}
                    onPress={() => navigation?.navigate('AdDetails', { adId: ad._id || ad.adId })}
                    activeOpacity={0.8}
                >
                    <View style={styles.card1}>
                    <View style={styles.topRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <Ionicons name="heart-outline" size={18} />
                            <Ionicons name="share-social-outline" size={18} />
                        </View>
                    </View>

                    <Text style={styles.timeText}>{new Date(ad.createdAt || Date.now()).toLocaleString()}</Text>

                    {ad.images && ad.images.length > 0 ? (
                        <Image source={{ uri: ad.images[0] }} style={styles.image1} />
                    ) : (
                        <View style={styles.image1} />
                    )}

                    <View style={styles.row}>
                        <Text style={styles.cardTitle}>{ad.title}</Text>
                        <Text style={styles.metaText}>{ad.price ? `₹${ad.price}` : ''}</Text>
                    </View>

                    <Text style={styles.cardDesc} numberOfLines={2}>{ad.description}</Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 26 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                            <Ionicons name="location-outline" size={16} />
                            <Text style={styles.metaText}>{ad.location || ad.city || ''}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                            <Ionicons name="person" size={16} />
                            <Text style={styles.metaText}>{ad.contactInfo?.name || ''}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                        <View style={styles.chatBtn}>
                            <Text style={styles.btnText}>Chat</Text>
                        </View>
                        <View style={styles.callBtn}>
                            <Text style={styles.btnText}>Call</Text>
                        </View>
                    </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center"
    },
    language: {
        borderRadius: 10,
        borderWidth: 0.5,
        padding: 10,
        marginTop: 10
    },
    card1: {
        backgroundColor: "#ffffff",
        paddingVertical: 20,
        paddingHorizontal: 18,
        borderRadius: 10,
    },
    proser: {
        borderRadius: 12,
        backgroundColor: "#d6d6d6",
        paddingVertical: 6,
        paddingHorizontal: 10,
        width: 120,
        alignItems: "center"
    },
    image1: {
        borderRadius: 10,
        backgroundColor: "#d8d8d8",
        height: height * 0.23,
        width: width - 75,
        alignSelf: "center",
        marginTop: 10
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10
    },
    card2: {
        backgroundColor: "#ffffff",
        paddingVertical: 20,
        paddingHorizontal: 18,
        borderRadius: 10,
        marginTop: 40
    },
    image2: {
        borderRadius: 10,
        backgroundColor: "#d8d8d8",
        height: 100,
        width: 160,
        marginTop: 10
    },
    row2: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    card3: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 14,
        marginTop: 20,
    },
    topRow: {
        flexDirection: "row",
        alignSelf: "flex-end"
    },
    timeText: {
        fontSize: 12,
        color: "#777",
        marginTop: 6,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 10,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    cardDesc: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5)
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: "#444",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },
    chatBtn: {
        backgroundColor: "#f5b849",
        flex: 1,
        marginRight: 8,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    callBtn: {
        backgroundColor: "#157a4f",
        flex: 1,
        marginLeft: 8,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5)
    },
    priceStrip: {
        backgroundColor: "#aaaaaa",
        paddingVertical: 6,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10
    },
    priceText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    selectStrip: {
        borderColor: "#6e6d6d",
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        marginTop: 12
    },
    stripText: {
        color: "#000000",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5)
    }
})