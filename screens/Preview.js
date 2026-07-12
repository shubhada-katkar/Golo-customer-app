import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MaterialIcons, Ionicons
} from "@expo/vector-icons";
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");
import { useRef, useEffect } from "react";

export default function Preview({ navigation, route }) {
    const { category, template, formData, selectedDays, selectedLocations, selectedDates, startDate, endDate, price } = route.params || {};
    const sliderRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const intervalRef = useRef(null);
    const resumeTimeoutRef = useRef(null);

    const startAutoSlide = () => {
        stopAutoSlide();
        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const nextIndex = (prev + 1) % formData.images.length;
                sliderRef.current?.scrollTo({
                    x: nextIndex * width,
                    animated: true,
                });
                return nextIndex;
            });
        }, 2000);
    };

    const stopAutoSlide = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
    };

    useEffect(() => {
        if (!formData?.images?.length) return;

        startAutoSlide();

        return () => {
            stopAutoSlide();
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        };
    }, [formData?.images]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1, paddingTop: 18 }} >

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

                <Text style={{ fontSize: 16, marginLeft: 56, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                    Post Your Ads Instantly Online
                </Text>

                <Text style={{ marginTop: 20, marginLeft: 20, fontSize: 18, fontFamily: "Medium" }}>
                    Preview</Text>


                {(template === "card1" || String(template) === "1") && (
                    <>
                        <View style={{ paddingHorizontal: 16 }} >
                            <View style={styles.card1}>
                                <View style={styles.topRow}>

                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <Ionicons name="heart-outline" size={18} />
                                        <Ionicons name="share-social-outline" size={18} />
                                    </View>
                                </View>

                                <Text style={styles.timeText}>Date and Time</Text>

                                {/* Image Carousel */}
                                {formData?.images?.length > 0 ? (
                                    <View style={{ position: "relative" }}>

                                        <ScrollView
                                            ref={sliderRef}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            onScrollBeginDrag={() => stopAutoSlide()}
                                            onMomentumScrollEnd={(e) => {
                                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                                setActiveIndex(index);

                                                resumeTimeoutRef.current = setTimeout(() => {
                                                    startAutoSlide();
                                                }, 2000);
                                            }}
                                        >
                                            {formData.images.map((uri, index) => (
                                                <Image
                                                    key={index}
                                                    source={{ uri }}
                                                    style={styles.image1}   // 👈 keep your existing card image size
                                                    resizeMode="cover"
                                                />
                                            ))}
                                        </ScrollView>

                                        {/* Left Arrow */}
                                        {formData.images.length > 1 && (
                                            <TouchableOpacity
                                                style={[styles.arrowBtn, { left: 6 }]}
                                                onPress={() => {
                                                    stopAutoSlide();

                                                    const prev =
                                                        activeIndex === 0
                                                            ? formData.images.length - 1
                                                            : activeIndex - 1;

                                                    sliderRef.current?.scrollTo({ x: prev * width, animated: true });
                                                    setActiveIndex(prev);

                                                    resumeTimeoutRef.current = setTimeout(() => {
                                                        startAutoSlide();
                                                    }, 4000); // resume after 4s
                                                }}
                                            >
                                                <Ionicons name="chevron-back" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        )}

                                        {/* Right Arrow */}
                                        {formData.images.length > 1 && (
                                            <TouchableOpacity
                                                style={[styles.arrowBtn, { right: 6 }]}
                                                onPress={() => {
                                                    stopAutoSlide();

                                                    const next = (activeIndex + 1) % formData.images.length;

                                                    sliderRef.current?.scrollTo({ x: next * width, animated: true });
                                                    setActiveIndex(next);

                                                    resumeTimeoutRef.current = setTimeout(() => {
                                                        startAutoSlide();
                                                    }, 4000);
                                                }}
                                            >
                                                <Ionicons name="chevron-forward" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        )}

                                    </View>
                                ) : (
                                    <View style={[styles.image1, { justifyContent: "center", alignItems: "center" }]}>
                                        <Ionicons name="image-outline" size={28} color="#999" />
                                        <Text style={{ color: "#999", marginTop: 6 }}>No images selected</Text>
                                    </View>
                                )}

                                <View style={styles.row}>
                                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                                        {formData?.heading || "Your heading will appear here"}
                                    </Text>
                                    <Text style={styles.metaText}>
                                        {formData?.price ? (
                                            <Text style={styles.metaText}>₹{formData.price}</Text>
                                        ) : null}
                                    </Text>
                                </View>

                                <Text style={styles.cardDesc} numberOfLines={1} ellipsizeMode="tail">
                                   Description: {formData?.body || "Your description will appear here"}
                                </Text>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 26 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                                        <Ionicons name="location-outline" size={16} />
                                        <Text style={styles.metaText} numberOfLines={1}>  {formData?.location || "Location"}</Text>
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
                        </View>
                    </>
                )}

                {(template === "card2" || String(template) === "2") && (
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={styles.card2}>
                            <View style={styles.topRow}>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <Ionicons name="heart-outline" size={18} />
                                    <Ionicons name="share-social-outline" size={18} />
                                </View>
                            </View>

                            <Text style={styles.timeText}>Date and Time</Text>

                            <View style={styles.row2}>
                                {formData?.image ? (
                                    <Image
                                        source={{ uri: formData.image }}
                                        style={styles.image2}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.image2, { justifyContent: "center", alignItems: "center" }]}>
                                        <Ionicons name="image-outline" size={22} color="#999" />
                                        <Text style={{ fontSize: 10, color: "#999" }}>No image</Text>
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                                        {formData?.heading || "Your heading will appear here"}
                                    </Text>
                                    <Text style={styles.cardDesc} numberOfLines={1} ellipsizeMode="tail">
                                        Description: {formData?.body || "Your description will appear here"}
                                    </Text>
                                    <Text style={styles.metaText}>Price</Text>
                                </View>
                            </View>


                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={16} />
                                        <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                                            {formData?.location || "Location"}
                                        </Text>
                                    </View>

                                    <View style={styles.metaItem}>
                                        <Ionicons name="person" size={16} />
                                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.metaText}>
                                            Seller
                                        </Text>
                                    </View>
                                </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    marginTop: 12,
                                }}
                            >
                                <View style={styles.chatBtn}>
                                    <Text style={styles.btnText}>Chat</Text>
                                </View>

                                <View style={styles.callBtn}>
                                    <Text style={styles.btnText}>Call</Text>
                                </View>
                            </View>

                        </View>
                    </View>
                )}

                {(template === "card3" || String(template) === "3") && (
                    <View style={{ paddingHorizontal: 16 }}>
                        <View style={styles.card3}>
                            {/* Top row */}
                            <View style={styles.topRow}>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <Ionicons name="heart-outline" size={18} />
                                    <Ionicons name="share-social-outline" size={18} />
                                </View>
                            </View>

                            <Text style={styles.timeText}>Date and Time</Text>

                            {/* Title */}
                            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail"> 
                                {formData?.heading || "Your heading will appear here"}
                            </Text>

                            {/* Description */}
                            <Text style={styles.cardDesc} numberOfLines={1} ellipsizeMode="tail">
                                Description: {formData?.body || "Your description will appear here"}
                            </Text>

                            {/* Meta */}
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="location-outline" size={14} />
                                    <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                                        {formData?.location || "Location"}
                                    </Text>
                                </View>


                                <View style={styles.metaItem}>
                                    <Ionicons name="person" size={16} />
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
                    </View>
                )}

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        navigation.navigate("Payment", {
                            template,
                            selectedDays,
                            selectedLocations,
                            selectedDates,
                            startDate,
                            endDate,
                            price,
                            formData,
                            category,
                        });
                    }}
                >
                    <Text style={{ color: "#ffffff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.2) }}>
                        Proceed to Payment
                    </Text>
                </TouchableOpacity>

            </LinearGradient>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 38,
        backgroundColor: "#157a4f",
        alignSelf: "center",
        borderRadius: 10,
        marginTop: 30
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
        width: width - 70,          // 👈 important for paging
        height: height * 0.25,
        backgroundColor: "#d8d8d8",
    },
    arrowBtn: {
        position: "absolute",
        top: "50%",
        transform: [{ translateY: -12 }],
        backgroundColor: "rgba(0,0,0,0.5)", // semi-dark circle so it’s visible on images
        borderRadius: 20,
        padding: 6,
        zIndex: 10,            // 👈 force on top of image
        elevation: 5,         // 👈 Android layering fix
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
    tag: {
        backgroundColor: "#eef0f3",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
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
        marginTop: 10,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
        width: "80%",
    },
    cardDesc: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5),
        width: "90%",
    },
metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
},
metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    flexShrink: 1,
},
    metaText: {
        fontSize: 12,
        color: "#444",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        width: "70%"
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
})