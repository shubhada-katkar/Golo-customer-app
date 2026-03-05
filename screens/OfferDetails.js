import React, { useContext, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, ScrollView,
    StatusBar, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";

import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

export default function GoloHome({ navigation }) {
    const { colors } = useContext(ThemeContext);

    const [showQR, setShowQR] = useState(false);
    const [token, setToken] = useState("");

    const qrRef = useRef();

    // generate random token
    const generateToken = () => {
        return "GOLO-" + Math.random().toString(36).substring(2, 10);
    };

    const handleClaim = () => {
        const newToken = generateToken();
        setToken(newToken);
        setShowQR(true);
    };

    const downloadQR = async () => {

        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }

        qrRef.current.capture().then(async (uri) => {

            await MediaLibrary.saveToLibraryAsync(uri);

            Alert.alert("Saved", "QR Code saved to gallery");

        });
    };

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Topbar />
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="arrow-back" size={24} onPress={() => navigation.goBack()}
                        style={{ paddingLeft: 6 }} />
                    <View style={styles.headerRight}>
                        <Ionicons name="heart-outline" size={22} style={styles.icon} />
                        <Ionicons name="share-social-outline" size={22} />
                    </View>
                </View>

                <ScrollView>
                    {/* Image Placeholder */}
                    <View style={styles.imageContainer}>
                        <View style={styles.fakeImage} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>JP International School Uniform</Text>

                        <View style={styles.priceRow}>
                            <Text style={styles.discount}>560rs Discounted price</Text>
                            <Text style={styles.original}>1200rs Original Price</Text>
                        </View>

                        <Text style={styles.by}>By Raina clothing shop</Text>

                        {/* Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Product Details</Text>

                            <Text style={styles.label}>Fabric type</Text>
                            <Text style={styles.value}>
                                Solid Colors: 100% Cotton, Heather Grey: 90% Cotton, 10% Polyester;
                                All Other Heathers: 50% Cotton, 50% Polyester; OR: 65% Polyester, 35% Cotton; OR: 60% Cotton, 40% Polyester
                            </Text>

                            <Text style={styles.label}>Care instructions</Text>
                            <Text style={styles.value}>Machine Wash</Text>

                            <Text style={styles.label}>Origin</Text>
                            <Text style={styles.value}>Imported</Text>

                            <Text style={styles.label}>Closure type</Text>
                            <Text style={styles.value}>Pull On</Text>

                            <Text style={styles.label}>About this item</Text>
                            <Text style={styles.bullet}>• Officially Licensed Apparel for Student;</Text>
                            <Text style={styles.bullet}>• 22MCFT00452A-001</Text>
                            <Text style={styles.bullet}>• Lightweight, Classic fit, Double-needle sleeve and bottom hem</Text>
                        </View>

                        {/* Buy Button */}
                        <TouchableOpacity style={styles.buyBtn} onPress={(handleClaim)}>
                            <Text style={styles.buyText}>Claim Now</Text>
                        </TouchableOpacity>

                        {/* Bottom Actions */}
                        <View style={styles.bottomBar}>
                            <TouchableOpacity style={styles.callBtn}>
                                <Ionicons name="call" size={18} color="#fff" />
                                <Text style={styles.bottomText}> Call/Text</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.dirBtn}>
                                <Ionicons name="navigate" size={18} color="#000" />
                                <Text style={styles.dirText}> Direction</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </ScrollView>
                <SafeAreaView
                    edges={["bottom"]}
                    style={{ position: "absolute", bottom: 0, width: "100%" }} >
                    <GoloBottom />
                </SafeAreaView>

            </SafeAreaView>

            <Modal visible={showQR} transparent animationType="slide">

                <View style={styles.modalContainer}>

                    <View style={styles.qrCard}>

                        <Text style={{
                            fontSize: 18, fontFamily: "Medium",
                            lineHeight: Math.round(18 * 1.5)
                        }}>
                            Show this QR to Merchant
                        </Text>

                        <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>

                            <View style={{ padding: 20, backgroundColor: "white" }}>

                                <QRCode
                                    value={token}
                                    size={220}
                                />

                            </View>

                        </ViewShot>

                        <Text style={{ fontFamily: "Medium", lineHeight: Math.round(12 * 1.5) }}>
                            Token: {token}
                        </Text>

                        <TouchableOpacity style={styles.downloadBtn} onPress={downloadQR}>
                            <Text style={{
                                fontSize: 14, color: "#fff",
                                fontFamily: "Medium", lineHeight: Math.round(14 * 1.5)
                            }}>Download QR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowQR(false)}>
                            <Text style={{
                                marginTop: 10, fontSize: 14, color: "#f94741ff",
                                fontFamily: "Medium", lineHeight: Math.round(14 * 1.5)
                            }}>
                                Close</Text>
                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    icon: { marginRight: 12 },

    imageContainer: {
        backgroundColor: '#eee',
        height: 260,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fakeImage: {
        width: 160,
        height: 160,
        backgroundColor: '#ccc',
        borderRadius: 20,
    },

    content: { padding: 16 },

    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },

    priceRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },

    discount: {
        color: 'green',
        fontWeight: '600',
    },
    original: {
        color: '#999',
        textDecorationLine: 'line-through',
    },

    by: {
        marginTop: 4,
        color: '#666',
    },

    card: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
    },

    cardTitle: {
        fontWeight: '700',
        marginBottom: 8,
    },

    label: {
        marginTop: 8,
        fontWeight: '600',
    },

    value: {
        color: '#444',
        marginTop: 2,
    },

    bullet: {
        color: '#444',
        marginTop: 4,
    },

    buyBtn: {
        marginTop: 20,
        backgroundColor: '#FBBF24',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },

    buyText: {
        fontWeight: '700',
    },

    deals: {
        marginTop: 20,
        alignItems: 'center',
    },

    dealsTitle: {
        fontWeight: '700',
        fontSize: 18,
    },

    dealsSub: {
        color: '#777',
        marginTop: 4,
    },

    bottomBar: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderColor: '#eee',
        gap: 10,
        paddingBottom: 60
    },

    callBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#065f46',
        padding: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    dirBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FBBF24',
        padding: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomText: {
        color: '#fff',
        fontWeight: '600',
    },

    dirText: {
        fontWeight: '600',
    },

    content: {
        padding: 16
    },

    title: {
        fontSize: 20,
        fontWeight: "700"
    },

    buyBtn: {
        marginTop: 20,
        backgroundColor: "#FBBF24",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center"
    },

    buyText: {
        fontWeight: "700"
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)"
    },

    qrCard: {
        width: 300,
        backgroundColor: "white",
        borderRadius: 14,
        padding: 20,
        alignItems: "center"
    },

    downloadBtn: {
        marginTop: 15,
        backgroundColor: "#065f46",
        padding: 10,
        borderRadius: 8
    }
});