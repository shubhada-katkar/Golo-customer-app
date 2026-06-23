import React, { useContext, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import ChojaBottom from "../components/ChojaBottom";
import VoiceSearchButton from "../components/VoiceSearchButton";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import Iwant from "../components/Iwant";
import MyAds from "../components/MyAds";
import ChotyaJahirati from "../components/ChotyaJahirati";
import Topbar2 from "../components/Topbar2";
import { LinearGradient } from "expo-linear-gradient";

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
    const [searchQuery, setSearchQuery] = useState("");
    const { colors } = useContext(ThemeContext);
    const inputRef = useRef(null);
    const [tab, setTab] = useState("Chotya Jahirati");
    const sortedCategories = selectedCategory
        ? [
            categories.find(c => c.label === selectedCategory),
            ...categories.filter(c => c.label !== selectedCategory),
        ]
        : categories;
    const scrollRef = useRef(null);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
            />
            <Topbar2 />

            <View style={styles.row1}>
                <TouchableOpacity
                    style={styles.search}
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()} >
                    
                    <EvilIcons name="search" size={24} color="#555" />
                    <TextInput
                        ref={inputRef}
                        placeholder="Search ads by name or category"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        textAlignVertical="center"
                        returnKeyType="search"
                    />
                <VoiceSearchButton onResult={setSearchQuery} color="#555" activeColor="#157a4f" />

                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                            <Ionicons name="close-circle" size={19} color="#555" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={{ paddingVertical: 12 }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                >
                    {sortedCategories.map((item, index) => {
                        const isActive = selectedCategory === item.label;
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    if (isActive) {
                                        setSelectedCategory(null);
                                    } else {
                                        setSelectedCategory(item.label);
                                        scrollRef.current?.scrollTo({ x: 0, animated: true });
                                    }
                                }}
                                style={styles.categoryItem}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={24}
                                    color={isActive ? "#157a4f" : "#000"}
                                />
                                <Text
                                    style={[
                                        styles.categoryText,
                                        isActive && { color: "#157a4f", fontFamily: "Medium" }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
                        onPress={() => setTab("My Ads")}
                        style={[
                            styles.tabButton,
                            tab === "My Ads" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "My Ads" && styles.activeText]} >
                            My Ads </Text>
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

                </View>
            </View>

            <View style={{ flex: 1, marginTop: 10 }}>
                {tab === "Chotya Jahirati" && <ChotyaJahirati selectedCategory={selectedCategory} searchQuery={searchQuery} />}
                {tab === "I Want" && <Iwant />}
                {tab === "My Ads" && <MyAds selectedCategory={selectedCategory} searchQuery={searchQuery} />}
            </View>

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
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    search: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginVertical:6,
        paddingHorizontal: 4,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: 6,
        fontFamily: "Medium",
        fontSize: 14,
        top:4
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
        paddingHorizontal: 10,
        alignItems: "flex-start",
    },
    categoryItem: {
        alignItems: "center",
        justifyContent: "flex-start",
        width: 70,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 10,
        fontFamily: "Medium",
        color: "#000",
        marginTop: 4,
        textAlign: "center",
        lineHeight: Math.round(10 * 1.3),
    },
})