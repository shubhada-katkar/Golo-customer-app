import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

function isRemoteUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getFileMetaFromUri(uri) {
    const fileName = uri?.split("/")?.pop() || `ad-${Date.now()}.jpg`;
    const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
    const ext = (match?.[1] || "jpg").toLowerCase();
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    return { fileName, mimeType };
}

async function uploadAdImageToCloud(uri, token, baseUrl) {
    if (!uri) return null;
    if (isRemoteUrl(uri)) return uri;

    const { fileName, mimeType } = getFileMetaFromUri(uri);

    const uploadBody = new FormData();
    uploadBody.append("file", {
        uri,
        name: fileName,
        type: mimeType,
    });

    const response = await fetch(`${baseUrl}/ads/upload/image`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: uploadBody,
    });

    const data = await response.json().catch(() => ({}));
    const imageUrl = data?.data?.url;

    if (!response.ok || !imageUrl) {
        throw new Error(data?.message || "Failed to upload ad image");
    }

    return imageUrl;
}

export default function Payment({ navigation, route }) {
    const { template, selectedDays, selectedLocations, selectedDates, startDate, endDate, price, formData, category } = route.params || {};
    const [isFeatured, setIsFeatured] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const STANDARD_FEE = Number(price || 0);     // base price from previous screen
    const FEATURED_FEE = 100;                   // featured ad cost

    const days = Number(selectedDays || 1);

    // Day-wise extra fee (only if days > 1)
    const dayWiseFee = days > 1 ? STANDARD_FEE * days : 0;

    // Featured fee
    const featuredFee = isFeatured ? FEATURED_FEE : 0;

    // Subtotal
    const subtotal = STANDARD_FEE + dayWiseFee + featuredFee;

    // GST 18%
    const gst = subtotal * 0.18;

    // Total
    const total = subtotal + gst;

    const handlePaymentAndSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem("customerToken");
            const userId = await AsyncStorage.getItem("customerId");

            if (!token) {
                Alert.alert("Error", "You must be logged in to post an ad.");
                setIsSubmitting(false);
                return;
            }

            const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
            if (!BASE_URL) {
                throw new Error("EXPO_PUBLIC_API_URL is not configured");
            }

            const selectedImages = formData?.images?.length
                ? formData.images
                : (formData?.image ? [formData.image] : []);

            const uploadedImages = [];
            for (const img of selectedImages) {
                const uploaded = await uploadAdImageToCloud(img, token, BASE_URL);
                if (uploaded) uploadedImages.push(uploaded);
            }

            // Format phone to E.164 (prepend +91 if needed)
            const rawPhone = formData?.contact || "";
            const phone = rawPhone.startsWith("+") ? rawPhone : `+91${rawPhone.replace(/\s/g, "")}`;

            // Build the payload matching CreateAdDto
            const payload = {
                title: formData?.heading || "Ad Title",
                description: formData?.body || "Ad Description",
                category: category?.label || "Education",
                subCategory: category?.label || "Education",
                userId: userId,
                userType: "Customer",
                images: uploadedImages,
                price: Number(formData?.price || 0),
                location: formData?.location || "Not specified",
                contactInfo: {
                    name: formData?.institutionName || formData?.contactPerson || "User",
                    phone: phone,
                    preferredContactMethod: "phone"
                },
                templateId: Number(template !== undefined ? (typeof template === 'string' ? template.replace('card', '') : template) : 1),
                cities: selectedLocations || [],
                selectedDates: Array.isArray(selectedDates) ? selectedDates : [],
                expiryDate: endDate || undefined,
                isPromoted: isFeatured,
            };

            console.log("Submitting payload:", JSON.stringify(payload, null, 2));

            const response = await fetch(`${BASE_URL}/ads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert("Success", "Your ad has been posted successfully!");
                // Clear any navigation state or go root
                navigation.navigate("ChojaHome"); // Or wherever you want to go after success
            } else {
                Alert.alert("Failed", data.message || "Failed to post ad.");
                console.error("Ad creation error:", data);
            }
        } catch (error) {
            console.error("Submission Error:", error);
            Alert.alert("Error", "An unexpected error occurred while posting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1, paddingTop: 18 }} >

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                    <View style={styles.row1}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons
                                name="arrow-back-ios"
                                size={26} style={{ paddingHorizontal: 10 }} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, fontFamily: "Medium", lineHeight: Math.round(22 * 1.4) }}>
                            Smart Jahirati
                        </Text>
                    </View>

                    <Text style={{ fontSize: 16, marginLeft: 48, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                        Post Your Ads Instantly Online
                    </Text>

                    <Text style={{ marginTop: 20, marginLeft: 20, fontSize: 20, fontFamily: "Medium", lineHeight: Math.round(20 * 1.5) }}>
                        Payment</Text>

                    <View style={{ paddingHorizontal: 16, backgroundColor: "#f1efef", marginHorizontal: 20, borderRadius: 12, paddingVertical: 12, marginTop: 10 }}>
                        <Text style={styles.label}>Locations selected:</Text>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                            {selectedLocations?.length ? (
                                selectedLocations.map((loc, idx) => (
                                    <View
                                        key={`${loc}-${idx}`}
                                        style={{
                                            backgroundColor: "#e6b346",
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 10,
                                            marginRight: 8,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <Text style={{ fontSize: 15, color: "#ffffff" }}>{loc}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.value}>No locations selected</Text>
                            )}
                        </View>

                        <View style={styles.rows}>
                            <Text style={[styles.label, { width: "100%" }]}>Number of days selected:</Text>
                            <Text style={styles.value}>
                                {selectedDays ? `${selectedDays} day(s)` : "No days selected"}
                            </Text>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 16, marginTop: 10, backgroundColor: "#f1efef", marginHorizontal: 20, borderRadius: 12, paddingVertical: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={styles.label}>Promotion & Pricing</Text>
                            <Text style={styles.label}>₹100</Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>

                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#219227" />
                                <Text style={[styles.label, { marginTop: 0, fontSize: 15, width: "100%" }]}>Featured Ad</Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.checkbox,
                                    { borderColor: isFeatured ? "#219227" : "#444" }
                                ]}
                                onPress={() => setIsFeatured(prev => !prev)}
                            >
                                {isFeatured && <View style={styles.checkboxTick} />}
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/*Card*/}
                    <View style={styles.centerContainer}>
                        <View style={styles.card}>

                            <View>
                                <Text style={[styles.label, { fontSize: 20 }]}>Bill</Text>
                            </View>

                            {/* 1. Standard Listing Fee */}
                            <View style={styles.rows}>
                                <Text style={styles.label}>Template:</Text>
                                <Text style={styles.value}>₹{STANDARD_FEE}</Text>
                            </View>

                            {/* 2. Day-wise Fee (only if days > 1) */}
                            {days > 1 && (
                                <View style={styles.rows}>
                                    <Text style={styles.label}>
                                        Standard Listing Fee:
                                    </Text>
                                    <Text style={styles.value}>₹{dayWiseFee}</Text>
                                </View>
                            )}

                            {/* 3. Featured Ad Fee (only if checked) */}
                            {isFeatured && (
                                <View style={styles.rows}>
                                    <Text style={styles.label}>Featured Ad Fee:</Text>
                                    <Text style={styles.value}>₹{FEATURED_FEE}</Text>
                                </View>
                            )}

                            {/* 4. Bulk Discount */}
                            <View style={styles.rows}>
                                <Text style={styles.label}>Bulk Discount:</Text>
                                <Text style={styles.value}>- ₹0</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalText}>Subtotal:</Text>
                                <Text style={styles.totalText}>₹{subtotal.toFixed(0)}</Text>
                            </View>

                            <View style={[styles.totalRow, { marginTop: 8 }]}>
                                <Text style={styles.totalText}>GST (18%):</Text>
                                <Text style={styles.totalText}>₹{gst.toFixed(0)}</Text>
                            </View>

                            <View style={[styles.totalRow, { marginTop: 8 }]}>
                                <Text style={[styles.totalText, { fontSize: 20, marginTop: 16 }]}>Total:</Text>
                                <Text style={[styles.totalText, { fontSize: 20, marginTop: 16 }]}>
                                    ₹{total.toFixed(0)}
                                </Text>
                            </View>
                        </View>

                        {/* Proceed Button */}
                        <TouchableOpacity
                            style={[styles.payButton, isSubmitting && { opacity: 0.7 }]}
                            onPress={handlePaymentAndSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                            ) : null}
                            <Text style={styles.payText}>{isSubmitting ? "Processing..." : "Post Ad (Bypass Payment)"}</Text>
                            {!isSubmitting && <MaterialIcons name="double-arrow" color={"#ffffff"} size={20} />}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14,
    },
    centerContainer: {
        flex: 1,
        marginTop: 8,
        alignItems: "center",
        paddingHorizontal: 20,
    },
    card: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        elevation: 4, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    rows: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    value: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
        flex: 1,                    // ⬅️ allow wrapping
        textAlign: "right",         // optional: keep it neat
        marginLeft: 10,
    },
    label: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
        maxWidth: "50%",            // ⬅️ prevents label from stealing space
    },
    divider: {
        height: 1,
        backgroundColor: "#b1b1b1",
        marginVertical: 24,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalText: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
    payButton: {
        flexDirection: "row",
        marginTop: 20,
        width: "100%",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#157a4f"
    },
    payText: {
        color: "#fff",
        fontSize: 17.2,
        fontFamily: "Medium",
        lineHeight: Math.round(17.2 * 1.2),
        marginRight: 6,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: "#444",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxTick: {
        width: 16,
        height: 16,
        borderRadius: 4,
        backgroundColor: "#f5b849",
    },
});