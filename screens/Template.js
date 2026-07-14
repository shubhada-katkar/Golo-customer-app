import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export default function Template({ navigation, route }) {
    const { category } = route.params || {};
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1, padding: 16 }} >

                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26} style={{ paddingHorizontal: 10 }} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontFamily: "Medium", lineHeight: Math.round(22 * 1.5) }}>
                        Smart Jahirati
                    </Text>
                </View>

                <Text style={{ fontSize: 16, marginLeft: 48, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5), marginBottom: 10 }}>
                    Post Your Ads Instantly Online
                </Text>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                    <Text style={{ paddingVertical: 14, fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                        Choose from these 3 sample templates
                    </Text>

                    <View style={styles.card1}>
                        <View style={styles.topRow}>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <Ionicons name="heart-outline" size={18} />
                                <Ionicons name="share-social-outline" size={18} />
                            </View>
                        </View>

                        <Text style={styles.timeText}>20m ago</Text>

                        <View style={styles.image1}>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.cardTitle}>
                                Your Ad Title Will Appear Here
                            </Text>
                            <Text style={styles.metaText}>
                                Price
                            </Text>
                        </View>

                        <Text style={styles.cardDesc}>Description</Text>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 26 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                                <Ionicons name="location-outline" size={16} />
                                <Text style={styles.metaText}>Location</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                                <Ionicons name="person" size={16} />
                                <Text style={styles.metaText}>Seller</Text>
                            </View>
                        </View>

                        <View style={{
                            flexDirection: "row", justifyContent: "space-between",
                            marginTop: 10
                        }}>
                            <View style={styles.chatBtn}>
                                <Text style={styles.btnText}>
                                    Chat</Text>
                            </View>
                            <View style={styles.callBtn}>
                                <Text style={styles.btnText}>
                                    Call</Text>
                            </View>
                        </View>

                        <View style={styles.priceStrip}>
                            <Text style={styles.priceText}>For ₹15 Only</Text>
                        </View>

                        <TouchableOpacity style={styles.selectStrip} onPress={() => navigation.navigate("FormPage",
                            { template: 1, category: category, price: 15 })}>
                            <Text style={styles.stripText}>Select This Template</Text>
                        </TouchableOpacity>

                    </View>

                    <View style={styles.card2}>
                        <View style={styles.topRow}>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <Ionicons name="heart-outline" size={18} />
                                <Ionicons name="share-social-outline" size={18} />
                            </View>
                        </View>

                        <Text style={styles.timeText}>20m ago</Text>

                        <View style={styles.row2}>
                            <View style={styles.image2} />

                            <View>
                                <Text style={styles.cardTitle}
                                numberOfLines={1} ellipsizeMode="tail">
                                    Your Ad Title Will Appear Here
                                </Text>
                                <Text style={styles.cardDesc}>Description</Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginTop: 10,
                            }} >
                            <Text style={styles.metaText}>Price</Text>

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <Ionicons name="location-outline" size={16} />
                                    <Text style={styles.metaText}>Location</Text>
                                </View>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                    <Ionicons name="person" size={16} />
                                    <Text style={styles.metaText}>Seller</Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginTop: 12,
                            }} >
                            <View style={styles.chatBtn}>
                                <Text style={styles.btnText}>Chat</Text>
                            </View>

                            <View style={styles.callBtn}>
                                <Text style={styles.btnText}>Call</Text>
                            </View>
                        </View>

                        <View style={styles.priceStrip}>
                            <Text style={styles.priceText}>For ₹10 Only</Text>
                        </View>

                        <TouchableOpacity style={styles.selectStrip} onPress={() => navigation.navigate("FormPage",
                            { template: 2, category: category, price: 10 })}>
                            <Text style={styles.stripText}>Select This Template</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card3}>
                        {/* Top row */}
                        <View style={styles.topRow}>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <Ionicons name="heart-outline" size={18} />
                                <Ionicons name="share-social-outline" size={18} />
                            </View>
                        </View>

                        <Text style={styles.timeText}>20m ago</Text>

                        {/* Title */}
                        <Text style={styles.cardTitle}
                        numberOfLines={1} ellipsizeMode="tail">
                            Your Ad Title Will Appear Here
                        </Text>

                        {/* Description */}
                        <Text style={styles.cardDesc}>
                            Description
                        </Text>

                        {/* Meta */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={14} />
                                <Text style={styles.metaText}>Location</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="person" size={14} />
                                <Text style={styles.metaText}>Seller</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.actionRow}>
                            <View style={styles.chatBtn}>
                                <Text style={styles.btnText}>Chat</Text>
                            </View>
                            <View style={styles.callBtn}>
                                <Text style={styles.btnText}>Call</Text>
                            </View>
                        </View>

                        <View style={styles.priceStrip}>
                            <Text style={styles.priceText}>For ₹5 only</Text>
                        </View>

                        <TouchableOpacity style={styles.selectStrip} onPress={() => navigation.navigate("FormPage",
                            { template: 3, category: category, price: 5 })}>
                            <Text style={styles.stripText}>Select This Template</Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
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
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
        width:"70%"
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
        color: "#157a4f",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5)
    }
})