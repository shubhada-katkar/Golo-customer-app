import React, { useContext, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { useNavigation } from "@react-navigation/native";

export default function GoloHome() {
    const [selectedCategory, setSelectedCategory] = useState(null);
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
    const scrollRef = useRef(null);
    const sortedCategories = selectedCategory
        ? [
            categories.find(c => c.label === selectedCategory),
            ...categories.filter(c => c.label !== selectedCategory),
        ]
        : categories;

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

                </View>

                <View style={{
                    marginTop: 12,
                    paddingHorizontal: 8,
                }}>
                    {!showAllCategories ? (
                        <View style={{
                            height: 46,
                            flexDirection: "row",
                            alignItems: "center"
                        }}>
                            <ScrollView
                                ref={scrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            >
                                <View style={styles.chipsRow}>
                                    {sortedCategories.map((item, index) => (
                                        <CategoryChip
                                            key={index}
                                            icon={item.icon}
                                            label={item.label}
                                            isActive={selectedCategory === item.label}
                                            onPress={() => {
                                                if (selectedCategory === item.label) {
                                                    setSelectedCategory(null);
                                                } else {
                                                    setSelectedCategory(item.label);
                                                    setShowAllCategories(false);
                                                    scrollRef.current?.scrollTo({ x: 0, animated: true });
                                                }
                                            }}
                                        />
                                    ))}
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={() => setShowAllCategories(true)}>
                                <View style={styles.headerRow}>
                                    <Text style={[styles.headerText, { marginTop: -10, paddingLeft: 10 }]}>See All</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <TouchableOpacity onPress={() => setShowAllCategories(false)} style={{ alignSelf: "flex-end", marginRight: 6 }}>
                                <Text style={[styles.headerText, { color: colors.primary, paddingVertical: 4, bottom: 5 }]}>Hide Categories</Text>
                            </TouchableOpacity>
                            <View style={styles.categoryGrid}>
                                {sortedCategories.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            if (selectedCategory === item.label) {
                                                setSelectedCategory(null);
                                            } else {
                                                setSelectedCategory(item.label);
                                                setShowAllCategories(false);
                                                scrollRef.current?.scrollTo({ x: 0, animated: true });
                                            }
                                        }}
                                        style={[
                                            styles.gridItem,
                                            selectedCategory === item.label && { backgroundColor: "#FFD700" }
                                        ]}
                                    >
                                        <Ionicons
                                            name={item.icon}
                                            size={22}
                                            color={selectedCategory === item.label ? "#000" : "#ffffff"}
                                        />

                                        <Text
                                            style={[
                                                styles.gridText,
                                                { color: selectedCategory === item.label ? "#000" : "#fff" }
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

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

const CategoryChip = ({ icon, label, isActive, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.chip,
            isActive && { backgroundColor: "#f1d94e", borderColor: "#000", borderWidth: 1.5 } // active color
        ]}
    >
        <Ionicons
            name={icon}
            size={16}
            color={isActive ? "#000" : "#fff"}
        />
        <Text
            style={[
                styles.chipText,
                { color: isActive ? "#000" : "#fff" }
            ]}
        >
            {label}
        </Text>
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
        lineHeight: Math.round(16 * 1.5),
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

    chipsRow: {
        flexDirection: "row",
        marginBottom: 10,
        alignItems: "center"
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
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.4),
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    gridItem: {
        width: "30%", // 3 per row
        backgroundColor: "#000000",
        borderRadius: 10,
        gap: 6,
        paddingVertical: 8,
        marginBottom: 10,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center"
    },

    gridText: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        textAlign: "center",
        color: "#fff"
    },
});