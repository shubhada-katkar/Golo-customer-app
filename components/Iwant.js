import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
const { width, height } = Dimensions.get("window");

export default function Iwant({ }) {
    const { colors } = useContext(ThemeContext);
    return (
        <ScrollView contentContainerStyle={{paddingBottom:90, paddingHorizontal:16}} >
            
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
                        Your Ad Title 
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
                        <Text style={styles.cardTitle}>
                            Your Ad Title
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
                <Text style={styles.cardTitle}>
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

            </View>

        </ScrollView >
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