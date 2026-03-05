import React, { useContext, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import Iwant from "../components/Iwant";
import MyAds from "../components/MyAds";
import ChotyaJahirati from "../components/ChotyaJahirati";
const categories = [
    { icon: "school-outline", label: "Education" },
    { icon: "heart-outline", label: "Matrimonial" },
    { icon: "car-outline", label: "Vehicle" },
    { icon: "megaphone-outline", label: "Business" },
    { icon: "airplane-outline", label: "Travel" },
    { icon: "sparkles-outline", label: "Astrology" },
    { icon: "home-outline", label: "Property" },
    { icon: "alert-circle-outline", label: "Public Notice" },
    { icon: "compass-outline", label: "Lost & Found" },
    { icon: "construct-outline", label: "Service" },
    { icon: "person-outline", label: "Personal" },
    { icon: "briefcase-outline", label: "Employment" },
    { icon: "paw-outline", label: "Pets" },
    { icon: "phone-portrait-outline", label: "Mobiles" },
    { icon: "tv-outline", label: "Electronics" },
    { icon: "cube-outline", label: "Furniture" },
    { icon: "gift", label: "Greetings" },
    { icon: "ellipsis-horizontal-outline", label: "Other" },
];

export default function ChojaHome() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const { colors } = useContext(ThemeContext);
    const inputRef = useRef(null);
    const [tab, setTab] = useState("Chotya Jahirati");
    const [showAllCategories, setShowAllCategories] = useState(false);
    const sortedCategories = selectedCategory
        ? [
            categories.find(c => c.label === selectedCategory),
            ...categories.filter(c => c.label !== selectedCategory),
        ]
        : categories;
    const scrollRef = useRef(null);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity
                    style={styles.search}
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()} >
                    <TextInput
                        ref={inputRef} placeholder="Search community..."
                        style={{ flex: 1, fontFamily: "Medium", fontSize: 14 }}
                        textAlignVertical="center" />

                    <EvilIcons name="search" size={26} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={{
                marginTop: 12,
                paddingHorizontal: 10,
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

                                                // scroll to beginning
                                                scrollRef.current?.scrollTo({ x: 0, animated: true });
                                            }
                                        }}
                                    />
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity onPress={() => setShowAllCategories(true)}>
                            <View style={styles.headerRow}>
                                <Text style={styles.headerText}>See All</Text>
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

                                            // scroll to beginning
                                            scrollRef.current?.scrollTo({ x: 0, animated: true });
                                        }
                                    }}
                                    style={[
                                        styles.gridItem,
                                        selectedCategory === item.label && {
                                            backgroundColor: "#FFD700"
                                        }
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

            <View style={{ paddingHorizontal: 8, marginTop: 6 }}>
                <View style={styles.row2}>

                    <TouchableOpacity
                        onPress={() => setTab("Chotya Jahirati")}
                        style={[
                            styles.tabButton,
                            tab === "Chotya Jahirati" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "Chotya Jahirati" && styles.activeText]} >
                            Chotya Jahirati </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("I Want")}
                        style={[
                            styles.tabButton,
                            tab === "I Want" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "I Want" && styles.activeText]} >
                            I Want </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("My Ads")}
                        style={[
                            styles.tabButton,
                            tab === "My Ads" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "My Ads" && styles.activeText]} >
                            My Ads </Text>
                    </TouchableOpacity>

                </View>
            </View>

            <View style={{ flex: 1, marginTop: 10 }}>
                {tab === "Chotya Jahirati" && <ChotyaJahirati selectedCategory={selectedCategory} />}
                {tab === "I Want" && <Iwant />}
                {tab === "My Ads" && <MyAds selectedCategory={selectedCategory} />}
            </View>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <ChojaBottom />
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

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 10
    },
    search: {
        flex: 1,
        paddingHorizontal: 12,
        backgroundColor: "#d1d1d1",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerRow: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        paddingHorizontal: 6,
        marginTop: -9
    },
    headerText: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.4),
    },

    row2: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#157a4f",
        borderRadius: 8,
        padding: 6
    },

    tabButton: {
        flex: 1,
        alignItems: "center",
        borderRadius: 6
    },

    activeTab: {
        backgroundColor: "#FFD700",
    },

    text: {
        color: "#ffffff",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 2.4)
    },

    activeText: {
        color: "#000000",
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 2.4),
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
})