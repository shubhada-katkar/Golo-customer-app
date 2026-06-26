import React, { useContext, useEffect, useState, useRef } from "react";
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Switch,
    TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import { Entypo, MaterialIcons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

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
            const token = await AsyncStorage.getItem("customerToken");

            const res = await fetch(`${BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.status === 401) {
                await AsyncStorage.clear();
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
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="large" />
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
            await AsyncStorage.multiRemove([
                "customerToken",
                "customerData",
                "customerId",
            ]);

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
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"} >
            <LinearGradient
                         colors={["#f8a812", "#fad081",  "#f8f6f265"]}
                         start={{ x: 0, y: 0 }}
                         end={{ x: 0, y: 1 }}
                         style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                    />
                <Topbar />
                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.goBack()}
                        style={{padding:10}}>
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
                        <Text style={{ fontSize: 20, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.5) }}>
                            Profile
                        </Text>
                    </View>

                </View>
         
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false} >

                    <View style={{ height: 1, backgroundColor:"#000000", marginVertical:6 }} />

                    {/* PROFILE IMAGE */}
                    <View style={{ alignItems: "center", flexDirection: "row", paddingHorizontal: 14, justifyContent:"space-between", marginTop: 12 }}>
                    <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                        <View>
                            <Image
                                source={profileImageSource}
                                style={styles.profileImage}
                            />
                            <View style={styles.cameraIcon}>
                                <MaterialIcons name="camera-alt" size={22} color="#ffffff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                        <View style={styles.profileCard} >
                            <View style={{flexDirection:"row", alignItems:"center", gap:12}}>
                            <View>
                            <Text style={styles.cardTitle}>Loyalty Status</Text>
                            <Text style={styles.cardSubtitle}>{loyaltyTier} tier</Text>
                            </View>
                            <Text style={styles.cardValue }>{loyaltyPoints} points</Text>
                            </View>
                        </View> 
                      </View>  

                    <View style={{ paddingHorizontal: 14, marginTop: 10 }}>  

                      <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 12 }]}>PROFILE SETTINGS</Text>

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
                                    !editName && styles.disabledInput,
                                    { paddingRight: 40 } // space for icon
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
                                <MaterialIcons name="edit" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* PHONE */}
                        <Text style={[styles.text, { color: colors.text }]}>Contact Number</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={phoneRef}
                                value={phone}
                                onChangeText={setPhone}
                                editable={editPhone}
                                keyboardType="numeric"
                                style={[
                                    styles.input,
                                    !editPhone && styles.disabledInput,
                                    { paddingRight: 40 }
                                ]} />

                            <TouchableOpacity style={styles.editIcon}
                                onPress={() => {
                                    setEditPhone(true);
                                    setEditName(false);
                                    setTimeout(() => phoneRef.current?.focus(), 100);
                                }}  >
                                <MaterialIcons name="edit" size={22} style={{ marginLeft: 8, color: colors.text }} />
                            </TouchableOpacity>
                        </View>

                        {/* EMAIL */}
                        <Text style={[styles.text, { color: colors.text }]}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                value={email}
                                editable={false}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={[styles.input, styles.disabledInput]}
                            />
                        </View>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving} >
                            <Text style={{ color: "white", fontFamily: "Medium", lineHeight: Math.round(14 * 1.5),
                                fontSize:14
                             }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Text>
                        </TouchableOpacity>
            </View>

            <View style={styles.divider} />

             <View style={styles.menuContainer}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>MENU</Text>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("Analytics")}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="account-cog-outline" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Analytics</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View your ads analytics</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>

             <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("Transaction")}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="account-cog-outline" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Transactions</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View your transaction history</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]}
             onPress={() => { confirmLogout();  }}>
                <View style={[styles.iconCircle, { backgroundColor: "#fff0f0" }]}>
                    <MaterialIcons name="logout" size={20} color="#ff6b6b" />
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
        paddingLeft: 14,
    },
    disabledInput: {
        backgroundColor: "#ffffff",
    },
    text: {
        fontSize: 14,
        marginTop: 6,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    input: {
        flex: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingRight: 40,
        borderWidth: 0.5,
        fontSize: 14,
        backgroundColor: "#ffffff",
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
    saveButton: {
        marginTop: 25,
        backgroundColor: "#f5b849",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    cameraIcon: {
        position: "absolute",
        bottom: 4,
        right: 5,
        backgroundColor: "#4b4a4a",
        padding: 4,
        borderRadius: 20,
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 60,
        alignSelf: "center",
    },
    avatarWrapper: {
        alignSelf: "center",
    },
    inputWrapper: {
        position: "relative",
        marginTop: 6,
    },
    editIcon: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    profileCard: {
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 25,
        backgroundColor:"#f5b94981",
        borderRadius:14
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
    cardValue: {
        fontSize: 20,
        fontFamily: "Medium",
        lineHeight: Math.round(20 * 1.5),
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
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
        lineHeight:Math.round(11*1.5)
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        lineHeight:Math.round(15*1.5)
    },
    menuSub: {
        fontSize: 12,
        marginTop: 1,
        fontFamily: "Medium",
        opacity: 0.7,
        lineHeight:Math.round(12*1.5)
    },
    divider: {
        height: 1,
        marginVertical: 20,
        marginHorizontal: 12,
        backgroundColor: "#dadada",
    },
});