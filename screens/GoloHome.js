import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { useNavigation } from "@react-navigation/native";

export default function GoloHome() {
    const { colors } = useContext(ThemeContext);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const categories = [
        { icon: "school-outline", label: "Education" },
        { icon: "heart-outline", label: "Matrimonial" },
        { icon: "megaphone-outline", label: "Business" },
        { icon: "airplane-outline", label: "Travel" },
        { icon: "sparkles-outline", label: "Astrology" },
        { icon: "home-outline", label: "Real Estate" },
        { icon: "construct-outline", label: "Service" },
        { icon: "briefcase-outline", label: "Employment" },
        { icon: "paw-outline", label: "Pets" },
        { icon: "tv-outline", label: "Electronics" },
        { icon: "cube-outline", label: "Furniture" },
        { icon: "ellipsis-horizontal-outline", label: "Other" },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />
            <ScrollView contentContainerStyle={styles.container}>

                {/* Discover What's Nearby */}
                <View style={{ justifyContent: "space-between", flexDirection: "row", alignItems: "center", paddingBottom: 10 }}>
                    <View style={styles.headerRow}>
                        <Ionicons name="star-outline" size={18} />
                        <Text style={styles.headerText}>Discover What’s Nearby</Text>
                    </View>

                    <TouchableOpacity onPress={() => setShowAllCategories(!showAllCategories)}>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerText}>
                                {showAllCategories ? "Hide Categories" : "See All"}
                            </Text>
                            <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                </View>

                {/* Category Chips */}
                {!showAllCategories ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        <View style={styles.chipsRow}>
                            <CategoryChip icon="school-outline" label="Education" />
                            <CategoryChip icon="heart-outline" label="Matrimonial" />
                            <CategoryChip icon="megaphone-outline" label="Business - Promotion" />
                            <CategoryChip icon="airplane-outline" label="Travel" />
                            <CategoryChip icon="sparkles-outline" label="Astrology" />
                            <CategoryChip icon="home-outline" label="Real Estate" />
                            <CategoryChip icon="construct-outline" label="Service" />
                            <CategoryChip icon="briefcase-outline" label="Employment" />
                            <CategoryChip icon="paw-outline" label="Pets" />
                            <CategoryChip icon="tv-outline" label="Electronics & Home appliances" />
                            <CategoryChip icon="cube-outline" label="Furniture" />
                            <CategoryChip icon="ellipsis-horizontal-outline" label="Other" />
                        </View>
                    </ScrollView>
                ) : (
                    <View style={styles.categoryGrid}>
                        {categories.map((item, index) => (
                            <View key={index} style={styles.gridItem}>
                                <Ionicons name={item.icon} size={24} color="#ffffff" />
                                <Text style={styles.gridText}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Cards */}
                {[1, 2, 3].map((_, index) => (
                    <ShopCard key={index} />
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

const CategoryChip = ({ icon, label }) => (
    <TouchableOpacity style={styles.chip}>
        <Ionicons name={icon} size={16} color="#fff" />
        <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
);

const ShopCard = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.card}>

            {/* Image Placeholder */}
            <TouchableOpacity style={styles.imageBox} onPress={() => navigation.navigate("OfferDetails")}>
                <Ionicons name="image-outline" size={40} color="#bdbdbd" />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.cardContent}>
                <Text style={styles.title}>JP International School Uniform</Text>
                <Text style={styles.subtitle}>By Raina clothing shop</Text>

                <View style={styles.priceRow}>
                    <Text style={styles.discountPrice}>560rs Discounted price</Text>
                    <Text style={styles.originalPrice}>1200rs Original Price</Text>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="star" size={14} color="#f5a623" />
                        <Text style={styles.metaText}>4.5 (89)</Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} />
                        <Text style={styles.metaText}>0.3 km</Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="green" />
                        <Text style={[styles.metaText, { color: "green" }]}>Open</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 60,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerText: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.4),
    },

    chipsRow: {
        flexDirection: "row",
        marginBottom: 20,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#000",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    chipText: {
        color: "#fff",
        marginLeft: 6,
        fontSize: 13,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.4),
    },

    card: {
        backgroundColor: "#FFFDF6",
        borderRadius: 16,
        marginBottom: 20,
        overflow: "hidden",
        elevation: 3,
    },

    imageBox: {
        height: 160,
        backgroundColor: "#EDEAF3",
        alignItems: "center",
        justifyContent: "center",
    },

    cardContent: {
        padding: 14,
    },

    title: {
        fontSize: 16,
        fontFamily: "Bold",
        lineHeight: Math.round(16 * 1.4),
    },
    subtitle: {
        fontSize: 13,
        color: "#666",
        marginVertical: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.4),
    },

    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    discountPrice: {
        color: "green",
        marginRight: 10,
        fontSize: 14,
        fontFamily: "Medium",
    },
    originalPrice: {
        color: "red",
        textDecorationLine: "line-through",
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.4),
    },

    metaRow: {
        flexDirection: "row",
        marginTop: 10,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 14,
    },
    metaText: {
        marginLeft: 4,
        fontSize: 12,
        lineHeight: Math.round(12 * 1.4),
        fontFamily: "Medium",
    },

    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    gridItem: {
        width: "30%", // 3 items per row
        backgroundColor: "#000000",
        borderRadius: 10,
        paddingVertical: 8,
        gap: 5,
        marginBottom: 10,
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 10,
        justifyContent: "center"
    },

    gridText: {
        fontSize: 11,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        textAlign: "center",
        color: "#fff"
    },
});