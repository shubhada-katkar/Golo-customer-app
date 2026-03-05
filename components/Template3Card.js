import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Template3Card({ ad, navigation }) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AdDetails", { adId: ad._id })}
            style={styles.card}
        >
            <View style={styles.topRow}>
                <Ionicons name="heart-outline" size={18} />
                <Ionicons name="share-social-outline" size={18} />
            </View>

            <Text style={styles.timeText}>
                {new Date(ad.createdAt || Date.now()).toLocaleString()}
            </Text>

            <Text style={styles.title}>{ad.title}</Text>

            <Text numberOfLines={3} style={styles.desc}>
                {ad.description}
            </Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} />
                    <Text style={styles.metaText}>{ad.location || ad.city}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="person" size={14} />
                    <Text style={styles.metaText}>{ad.contactInfo?.name}</Text>
                </View>
            </View>

            <View style={styles.priceStrip}>
                <Text style={styles.priceText}>
                    {ad.price ? `₹${ad.price}` : "Price Not Mentioned"}
                </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <View style={styles.chatBtn}>
                    <Text style={styles.btnText}>Chat</Text>
                </View>
                <View style={styles.callBtn}>
                    <Text style={styles.btnText}>Call</Text>
                </View>
            </View>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    timeText: {
        fontSize: 12,
        color: "#777",
        marginTop: 6,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    title: {
        fontSize: 16,
        marginTop: 8,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    desc: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5)
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        color: "#444",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    priceStrip: {
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 10,
    },
    priceText: {
        color: "#000000",
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
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
});