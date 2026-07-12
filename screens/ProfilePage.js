import React, { useContext, useEffect, useState, useRef } from "react";
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Switch,
    TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import { AntDesign, MaterialIcons, Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAuthStorage, getValidToken } from "../services/authService";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

const ORANGE = "#f5b849";
const GREEN = "#157a4f";

export default function ProfilePage({ navigation }) {
    const { theme, colors, toggleTheme } = useContext(ThemeContext);

    const [profileImage, setProfileImage] = useState(null);
    const [profilePhotoBase64, setProfilePhotoBase64] = useState(null);
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loyaltyTier, setLoyaltyTier] = useState("Bronze");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editName, setEditName] = useState(false);
    const [editPhone, setEditPhone] = useState(false);

    const nameRef = useRef(null);
    const phoneRef = useRef(null);

    // ================= FETCH PROFILE =================
    const fetchProfile = async () => {
        try {
            let token;
            try {
                token = await getValidToken();
            } catch {
                await clearAuthStorage();
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                return;
            }

            const res = await fetch(`${BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.status === 401) {
                await clearAuthStorage();
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                });
                return;
            }

            if (!res.ok) {
                Alert.alert("Error", data.message || "Failed to fetch profile");
                return;
            }

            const profile = data.data;
            const totalLoyaltyPoints = typeof profile.loyaltyPoints === 'number'
                ? profile.loyaltyPoints
                : Object.values(profile.merchantLoyaltyPoints || {}).reduce(
                    (sum, value) => sum + Number(value || 0),
                    0,
                );
            const derivedLoyaltyTier = profile.loyaltyTier ||
                (totalLoyaltyPoints >= 20000 ? 'Platinum' :
                    totalLoyaltyPoints >= 5000 ? 'Gold' :
                        totalLoyaltyPoints >= 1000 ? 'Silver' :
                            'Bronze');

            setUsername(profile.name || "");
            setPhone(profile.profile?.phone || "");
            setEmail(profile.email || "");
            setLoyaltyPoints(totalLoyaltyPoints);
            setLoyaltyTier(derivedLoyaltyTier);
            // image url/base64 may not exist
            setProfileImage(profile.profile?.avatar || profile.profilePhoto || null);

            setLoading(false);

        } catch (err) {
            setLoading(false);
            Alert.alert("Error", "Failed to load profile");
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // ================= IMAGE PICKER =================
    const pickImage = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Permission required");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            setProfileImage(result.assets[0].uri);
            const base64Value = result.assets[0].base64 || null;
            setProfilePhotoBase64(base64Value);
            if (!base64Value) {
                Alert.alert("Image Error", "Could not read image data for upload. Please try a different image.");
            }
        }
    };

    // ================= SAVE PROFILE =================
    const handleSave = async () => {
        try {
            setSaving(true);

            const token = await AsyncStorage.getItem("customerToken");
            const updateData = {
                name: username,
                profile: {
                    phone: phone || ""
                }
            };

            if (profilePhotoBase64) {
                updateData.profilePhoto = profilePhotoBase64;
                updateData.profile.avatar = `data:image/jpeg;base64,${profilePhotoBase64}`;
            }

            const res = await fetch(`${BASE_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const data = await res.json();
            setSaving(false);

            if (!res.ok) {
                Alert.alert("Error", data.message || "Update failed");
                return;
            }

            const updatedProfile = data.data;
            setProfileImage(updatedProfile.profile?.avatar || updatedProfile.profilePhoto || profileImage);
            setUsername(updatedProfile.name || username);
            setPhone(updatedProfile.profile?.phone || phone);
            setEmail(updatedProfile.email || email);
            setProfilePhotoBase64(null);
            setEditName(false);
            setEditPhone(false);
            Alert.alert("Success", "Profile Updated");
        } catch (err) {
            setSaving(false);
            Alert.alert("Error", err.message || "Update failed");
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors?.background || "#fff" }}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    const profileImageSource = profileImage
        ? (profileImage.startsWith("http") || profileImage.startsWith("data:") || profileImage.startsWith("file:")
            ? { uri: profileImage }
            : { uri: `data:image/jpeg;base64,${profileImage}` })
        : require("../assets/profile.png");

    const handleLogout = async () => {
        try {
            const token = await AsyncStorage.getItem("customerToken");

            if (!BASE_URL) {
                console.log("❌ BASE_URL is missing");
                return;
            }

            const refreshToken = await AsyncStorage.getItem("customerRefreshToken");
            const res = await fetch(`${BASE_URL}/users/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await res.json();
            console.log("Logout response:", data);

        } catch (err) {
            console.log("Logout API failed:", err);
        } finally {
            await clearAuthStorage();

            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        }
    };


    const confirmLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: handleLogout }
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors?.background || "#fdfdfd" }}>
            <KeyboardAvoidingView style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"} >
                <LinearGradient
                    colors={["#f8a812", "#fad081", "#f8f6f200"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ height: 240, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
                />
                <Topbar />
                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.goBack()}
                        style={styles.backButton}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={18}
                            color={colors.text}
                        />
                    </TouchableOpacity>

                    <View style={{
                        flex: 1, flexDirection: "row", justifyContent: "space-between",
                        alignItems: "center", marginRight: 14
                    }}>
                        <Text style={{ fontSize: 20, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.5) }}>
                            Profile
                        </Text>
                        <TouchableOpacity
                            style={styles.bellButton}
                            onPress={() => navigation.navigate("NotificationsPage")}>
                            <FontAwesome name="bell-o" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

          <View style={{ backgroundColor: "#000000", height: 1, marginVertical:6}} />

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false} >

                    {/* PROFILE IMAGE */}
                    <View style={{ alignItems: "center", paddingHorizontal: 14, marginTop: 18 }}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} activeOpacity={0.85}>
                            <View style={styles.avatarRing}>
                                <Image
                                    source={profileImageSource}
                                    style={styles.profileImage}
                                />
                            </View>
                            <View style={styles.cameraIcon}>
                                <MaterialIcons name="camera-alt" size={16} color="#ffffff" />
                            </View>
                        </TouchableOpacity>

                        {!!username && (
                            <Text style={[styles.nameText, { color: colors.text }]}>{username}</Text>
                        )}

                        <View style={styles.profileCard}>
                            <View style={styles.loyaltyIconCircle}>
                                <MaterialIcons name="workspace-premium" size={22} color={ORANGE} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{loyaltyTier} Tier</Text>
                                <Text style={styles.cardSubtitle}>Loyalty status</Text>
                            </View>
                            <View style={styles.pointsPill}>
                                <Text style={styles.cardValue}>{loyaltyPoints}</Text>
                                <Text style={styles.pointsLabel}>pts</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 14, marginTop: 22 }}>

                        <Text style={[styles.sectionHeader, { color: colors.text }]}>PROFILE SETTINGS</Text>

                        <View style={styles.settingsCard}>
                            {/* NAME */}
                            <Text style={[styles.text, { color: colors.text }]}>Your Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    ref={nameRef}
                                    value={username}
                                    onChangeText={setUsername}
                                    editable={editName}
                                    style={[
                                        styles.input,
                                        editName && styles.inputActive,
                                        { paddingRight: 40 }
                                    ]}
                                />

                                <TouchableOpacity
                                    style={styles.editIcon}
                                    onPress={() => {
                                        setEditName(true);
                                        setEditPhone(false);
                                        setTimeout(() => nameRef.current?.focus(), 100);
                                    }}
                                >
                                    <MaterialIcons name="edit" size={18} color={editName ? GREEN : "#9a9a9a"} />
                                </TouchableOpacity>
                            </View>

                            {/* PHONE */}
                            <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>Contact Number</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    ref={phoneRef}
                                    value={phone}
                                    onChangeText={setPhone}
                                    editable={editPhone}
                                    keyboardType="numeric"
                                    style={[
                                        styles.input,
                                        editPhone && styles.inputActive,
                                        { paddingRight: 40 }
                                    ]} />

                                <TouchableOpacity style={styles.editIcon}
                                    onPress={() => {
                                        setEditPhone(true);
                                        setEditName(false);
                                        setTimeout(() => phoneRef.current?.focus(), 100);
                                    }}  >
                                    <MaterialIcons name="edit" size={18} color={editPhone ? GREEN : "#9a9a9a"} />
                                </TouchableOpacity>
                            </View>

                            {/* EMAIL */}
                            <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    value={email}
                                    editable={false}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={[styles.input, styles.disabledInput]}
                                />
                                <View style={styles.lockIcon}>
                                    <MaterialIcons name="lock-outline" size={16} color="#b5b5b5" />
                                </View>
                            </View>
                        </View>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                            style={{ marginTop: 20 }} >
                            <LinearGradient
                                colors={[ORANGE, "#f5b849"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveButton}
                            >
                                {saving
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.saveButtonText}>Save Changes</Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.menuContainer}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>MENU</Text>

                        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("Analytics")} activeOpacity={0.7}>
                            <View style={styles.iconCircle}>
                                <AntDesign name="unordered-list" size={18} color={GREEN} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>Analytics</Text>
                                <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View your ads analytics</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("Transaction")} activeOpacity={0.7}>
                            <View style={styles.iconCircle}>
                                <AntDesign name="credit-card" size={18} color={GREEN} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={[styles.menuTitle, { color: colors.text }]}>Transactions</Text>
                                <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View your transaction history</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff", marginBottom: 0 }]}
                            onPress={() => { confirmLogout(); }} activeOpacity={0.7}>
                            <View style={[styles.iconCircle, { backgroundColor: "#fff0f0" }]}>
                                <MaterialIcons name="logout" size={18} color="#ff6b6b" />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={[styles.menuTitle, { color: "#ff6b6b" }]}>
                                    Sign Out
                                </Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#ff6b6b" />
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingLeft: 8,
    },
    backButton: {
        padding: 10,
        borderRadius: 20,
    },
    bellButton: {
        padding: 10,
        borderRadius: 20,
    },
    disabledInput: {
        backgroundColor: "#f4f4f4",
        color: "#8a8a8a",
    },
    text: {
        fontSize: 13,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5),
        opacity: 0.7,
    },
    input: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        paddingRight: 40,
        borderWidth: 1,
        borderColor: "#ececec",
        fontSize: 14,
        backgroundColor: "#fafafa",
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),      
    },
    inputActive: {
        borderColor: GREEN,
        backgroundColor: "#ffffff",
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    saveButtonText: {
        color: "#ffffff",
        fontFamily: "SemiBold",
        fontSize: 14,
        lineHeight: Math.round(14 * 1.5),
    },
    cameraIcon: {
        position: "absolute",
        bottom: 2,
        right: 2,
        backgroundColor: GREEN,
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#ffffff",
    },
    avatarRing: {
        padding: 4,
        borderRadius: 66,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    profileImage: {
        width: 104,
        height: 104,
        borderRadius: 52,
    },
    avatarWrapper: {
        alignSelf: "center",
        position: "relative",
    },
    nameText: {
        fontSize: 17,
        fontFamily: "SemiBold",
        marginTop: 12,
        lineHeight: Math.round(17 * 1.5),
    },
    inputWrapper: {
        position: "relative",
        marginTop: 6,
        justifyContent: "center",
    },
    editIcon: {
        position: "absolute",
        right: 12,
        padding: 4,
    },
    lockIcon: {
        position: "absolute",
        right: 14,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#ffffff",
        marginTop: 16,
        alignSelf: "stretch",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    loyaltyIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#fdf1de",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: "SemiBold",
        lineHeight: Math.round(15 * 1.5),
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: "Medium",
        opacity: 0.55,
        marginTop: 1,
        lineHeight: Math.round(12 * 1.5),
    },
    pointsPill: {
        flexDirection: "row",
        alignItems: "baseline",
        backgroundColor: "#e8f5ee",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 3,
    },
    cardValue: {
        fontSize: 15,
        fontFamily: "SemiBold",
        color: GREEN,
        lineHeight: Math.round(15 * 1.5),
    },
    pointsLabel: {
        fontSize: 11,
        fontFamily: "Medium",
        color: GREEN,
        opacity: 0.8,
        lineHeight: Math.round(11 * 1.5),
    },
    settingsCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        fontSize: 11,
        fontFamily: "Medium",
        letterSpacing: 0.8,
        opacity: 0.5,
        marginBottom: 8,
        lineHeight: Math.round(11 * 1.5)
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#e8f5ee",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontFamily: "Medium",
        lineHeight: Math.round(15 * 1.5)
    },
    menuSub: {
        fontSize: 12,
        marginTop: 1,
        fontFamily: "Medium",
        opacity: 0.7,
        lineHeight: Math.round(12 * 1.5)
    },
    divider: {
        height: 1,
        marginVertical: 20,
        marginHorizontal: 12,
        backgroundColor: "#eeeeee",
    },
});