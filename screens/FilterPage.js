import React, { useContext, useState, useEffect } from "react";
import {
    View, StyleSheet, Text, TouchableOpacity, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import { MaterialIcons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { ThemeContext } from "../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import GoloBottom from "../components/GoloBottom";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { textPresets } from "../theme/typography";

export default function FilterPage({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [radius, setRadius] = useState(50);
    const [offerTypes, setOfferTypes] = useState({});

    // Load filters on mount
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const savedRadius = await AsyncStorage.getItem("GOLO_FILTER_RADIUS");
                const savedOfferTypes = await AsyncStorage.getItem("GOLO_FILTER_OFFER_TYPES");

                if (savedRadius !== null) {
                    setRadius(Number(savedRadius));
                } else {
                    setRadius(50);
                }

                if (savedOfferTypes !== null) {
                    const types = savedOfferTypes.split(",").filter(Boolean);
                    const typesObj = {};
                    types.forEach((key) => {
                        typesObj[key] = true;
                    });
                    setOfferTypes(typesObj);
                } else {
                    setOfferTypes({});
                }
            } catch (e) {
                console.error("Failed to load filters from AsyncStorage", e);
            }
        };
        loadFilters();
    }, []);

    const saveRadius = async (val) => {
        try {
            await AsyncStorage.setItem("GOLO_FILTER_RADIUS", String(val));
        } catch (e) {
            console.error("Failed to save radius", e);
        }
    };

    const saveOfferTypes = async (typesObj) => {
        try {
            const selectedKeys = Object.keys(typesObj).filter((key) => typesObj[key]);
            const typesStr = selectedKeys.join(",");
            await AsyncStorage.setItem("GOLO_FILTER_OFFER_TYPES", typesStr);
        } catch (e) {
            console.error("Failed to save offer types", e);
        }
    };

    const toggleOfferType = (key) => {
        setOfferTypes((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            saveOfferTypes(next);
            return next;
        });
    };

    const offerTypeList = [
        { key: "Special", label: "Special", icon: "star" },
        { key: "Festival", label: "Festival", icon: "celebration" },
        { key: "Limited Time", label: "Limited Time", icon: "timer" },
        { key: "Combo", label: "Combo", icon: "layers" },
        { key: "Clearance", label: "Clearance", icon: "sell" },
        { key: "Flash Sale", label: "Flash Sale", icon: "flash-on" },
        { key: "BOGO", label: "Buy One Get One (BOGO)", icon: "card-giftcard" },
        { key: "Flat Discount", label: "Flat Discount", icon: "percent" },
        { key: "Percentage Off", label: "Percentage Off", icon: "percent" },
        { key: "Bundle Deal", label: "Bundle Deal", icon: "inventory-2" },
        { key: "New Arrival Offer", label: "New Arrival Offer", icon: "new-releases" },
        { key: "Weekend Offer", label: "Weekend Offer", icon: "weekend" },
        { key: "Member Exclusive", label: "Member Exclusive", icon: "verified" },
        { key: "Loyalty Reward", label: "Loyalty Reward", icon: "loyalty" },
        { label: "Seasonal Offer", value: "Seasonal Offer", icon: "calendar-today" },
        { label: "Happy Hour Deal", value: "Happy Hour Deal", icon: "alarm" },
        { label: "First Purchase Offer", value: "First Purchase Offer", icon: "tick" },
        { label: "Referral Offer", value: "Referral Offer", icon: "group" },
        { label: "Clear Stock Sale", value: "Clear Stock Sale", icon: "store" },
        { label: "Free Gift Offer", value: "Free Gift Offer", icon: "card-giftcard" },
    ];

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
                <TouchableOpacity onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <View style={{
                    flex: 1, flexDirection: "row", justifyContent: "space-between",
                    alignItems: "center", marginRight: 14
                }}>
                    <Text style={{ ...textPresets.title }}>
                        Go Back
                    </Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: "#000000", marginTop: 6 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} >


                <View style={styles.clearAllRow}>
                    <Text style={[styles.filtersEyebrow, { color: colors.text }]}>Filters</Text>
                    <TouchableOpacity
                        onPress={async () => {
                            setRadius(50);
                            setOfferTypes({});
                            try {
                                await AsyncStorage.setItem("GOLO_FILTER_RADIUS", "50");
                                await AsyncStorage.setItem("GOLO_FILTER_OFFER_TYPES", "");
                            } catch (e) {
                                console.error("Failed to clear filters from AsyncStorage", e);
                            }
                        }}
                        style={styles.clearAllButton}
                    >
                        <MaterialIcons name="refresh" size={15} color={colors.danger || "#e63946"} />
                        <Text style={[styles.clearAllText, { color: colors.danger || "#e63946" }]}>
                            Clear All
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, styles.cardShadow, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleRow}>
                            <View style={[styles.iconBadge, { backgroundColor: (colors.primary || "#157a4f") + "1A" }]}>
                                <MaterialIcons name="my-location" size={16} color={colors.primary || "#157a4f"} />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Distance Radius</Text>
                        </View>
                    </View>

                    <View style={[styles.radiusPill, { backgroundColor: (colors.primary || "#157a4f") + "14" }]}>
                        <Text style={[styles.radiusPillValue, { color: colors.primary || "#157a4f" }]}>
                            {radius} km
                        </Text>
                        <Text style={[styles.radiusPillLabel, { color: colors.primary || "#157a4f" }]}>
                            Selected Radius
                        </Text>
                    </View>

                    <View style={styles.sliderTrackWrap}>
                        <LinearGradient
                            colors={["#f8a812", "#157a4f"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.sliderTrackFill, { width: `${(radius / 50) * 100}%` }]}
                        />
                        <View style={[styles.sliderTrackRemainder, { backgroundColor: colors.border }]} />
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={50}
                            step={1}
                            value={radius}
                            onValueChange={setRadius}
                            onSlidingComplete={saveRadius}
                            minimumTrackTintColor="transparent"
                            maximumTrackTintColor={"#f5b849"}
                            thumbTintColor={"#157a4f"}
                        />
                    </View>

                    <View style={styles.sliderLabelsRow}>
                        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>0 km</Text>
                        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>25 km</Text>
                        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>50 km</Text>
                    </View>
                </View>

                <View style={[styles.card, styles.cardShadow, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.cardTitleRow}>
                        <View style={[styles.iconBadge, { backgroundColor: (colors.primary || "#157a4f") + "1A" }]}>
                            <MaterialIcons name="local-offer" size={16} color={colors.primary || "#157a4f"} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Offer Type</Text>
                    </View>

                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        Select one or more to narrow your results
                    </Text>

                    <View style={styles.chipGrid}>
                        {offerTypeList.map((item) => {
                            const isSelected = offerTypes[item.key];
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => toggleOfferType(item.key)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: isSelected
                                                ? (colors.primary || "#157a4f") + "16"
                                                : colors.background,
                                            borderColor: isSelected
                                                ? (colors.primary || "#157a4f")
                                                : colors.border,
                                        },
                                    ]}
                                >
                                    <View style={[
                                        styles.chipIconWrap,
                                        { backgroundColor: isSelected ? (colors.primary || "#157a4f") : colors.border }
                                    ]}>
                                        <MaterialIcons
                                            name={isSelected ? "check" : item.icon}
                                            size={16}
                                            color={isSelected ? "#fff" : "#157a4f"}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.chipLabel,
                                            { color: isSelected ? (colors.primary || "#157a4f") : colors.text },
                                            isSelected && { ...textPresets.label },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: colors.primary || "#157a4f" }]}
                    onPress={() => {
                        navigation.goBack();
                    }}
                >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
            </ScrollView>
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
        paddingLeft: 14,
    },
    backButton: {
        padding: 10,
    },
    clearAllRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        marginTop: 22,
        marginBottom: 16,
    },
    filtersEyebrow: {
        ...textPresets.subtitle,
    },
    clearAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    clearAllText: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    card: {
        borderRadius: 20,
        padding: 14,
        marginHorizontal: 10,
        backgroundColor: "#ffffff",
        marginTop: 18,
        borderWidth: 0.5,
    },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    cardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    cardSubtitle: {
        ...textPresets.label,
        marginTop: 6,
        marginBottom: 14,
    },
    radiusPill: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        marginBottom: 18,
    },
    radiusPillValue: {
        ...textPresets.subtitle,
    },
    radiusPillLabel: {
        ...textPresets.label,
    },
    sliderTrackWrap: {
        height: 40,
        justifyContent: "center",
    },
    sliderTrackFill: {
        position: "absolute",
        height: 6,
        borderRadius: 3,
        left: 0,
    },
    sliderTrackRemainder: {
        position: "absolute",
        height: 6,
        borderRadius: 3,
        left: 0,
        right: 0,
        opacity: 0.4,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    sliderLabelsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 2,
    },
    sliderLabel: {
        ...textPresets.label,
    },
    chipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 5,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    chipIconWrap: {
        width: 18,
        height: 18,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
    },
    chipLabel: {
        flexShrink: 1,
        ...textPresets.label
    },
    applyButton: {
        height: 50,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 14,
        marginTop: 24,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    applyButtonText: {
        color: "#ffffff",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
});