import React, { useContext, useEffect, useState, useRef } from "react";
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Switch,
    TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

export default function ProfilePage({ navigation }) {
    const { theme, colors, toggleTheme } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const [profileImage, setProfileImage] = useState(null);
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editName, setEditName] = useState(false);
    const [editPhone, setEditPhone] = useState(false);
    const [editEmail, setEditEmail] = useState(false);

    const nameRef = useRef(null);
    const phoneRef = useRef(null);
    const emailRef = useRef(null);

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
            setUsername(profile.name || "");
            setPhone(profile.profile?.phone || "");
            setEmail(profile.email || "");
            // image url may not exist
            setProfileImage(profile.profile?.avatar || null);

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
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    // ================= SAVE PROFILE =================
    const handleSave = async () => {
        try {
            setSaving(true);

            const token = await AsyncStorage.getItem("customerToken");
            const formData = new FormData();
            formData.append("name", username);
            formData.append("phone", phone);
            formData.append("email", email);

            if (profileImage && profileImage.startsWith("file")) {
                formData.append("image", {
                    uri: profileImage,
                    type: "image/jpeg",
                    name: "profile.jpg",
                });
            }
            const res = await fetch(`${BASE_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData,
            });

            const data = await res.json();
            setSaving(false);

            if (!res.ok) {
                Alert.alert("Error", data.message);
                return;
            }
            Alert.alert("Success", "Profile Updated");
            setEditName(false);
            setEditPhone(false);

        } catch (err) {
            setSaving(false);
            Alert.alert("Error", "Update failed");
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

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
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"} >

                <Topbar />
                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.5) }}>
                        Profile
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 110 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false} >


                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <TouchableOpacity onPress={confirmLogout}
                            style={{
                                flexDirection: "row", alignItems: "center", paddingLeft: 8
                            }}>
                            <MaterialIcons name="exit-to-app" size={20} color="#f86868" />
                            <Text style={{
                                fontSize: 18, color: "#f86868", fontFamily: "Medium",
                                lineHeight: Math.round(18 * 1.5)
                            }}> Logout</Text>
                        </TouchableOpacity>

                        <View
                            style={{
                                flexDirection: "row", alignItems: "center"
                            }}>
                            <Text style={{
                                fontSize: 18, color: colors.text, fontFamily: "Medium",
                                lineHeight: Math.round(18 * 1.5)
                            }}> Dark Mode</Text>
                            <Switch
                                value={theme === "dark"}
                                onValueChange={toggleTheme}
                                thumbColor={theme === "dark" ? "#157a4f" : "#f4f3f4"}
                                trackColor={{ false: "#ccc", true: "#141414" }}
                                ios_backgroundColor="#ccc"
                                style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 8 }}
                            />
                        </View>
                    </View>

                    <View style={{ height: 0.5, backgroundColor: colors.divider, marginTop: 10 }} />

                    {/* PROFILE IMAGE */}
                    <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                        <View>
                            <Image
                                source={
                                    profileImage
                                        ? { uri: profileImage }
                                        : require("../assets/profile.png")
                                }
                                style={styles.profileImage}
                            />
                            <View style={styles.cameraIcon}>
                                <MaterialIcons name="camera-alt" size={22} color="#ffffff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={{ paddingHorizontal: 14, marginTop: 16 }}>

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
                                    setEditEmail(false);
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
                                    setEditEmail(false);
                                    setTimeout(() => phoneRef.current?.focus(), 100);
                                }}  >
                                <MaterialIcons name="edit" size={22} style={{ marginLeft: 8, color: colors.text }} />
                            </TouchableOpacity>
                        </View>

                        {/* EMAIL (NON EDITABLE) */}
                        <Text style={[styles.text, { color: colors.text }]}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={emailRef}
                                value={email}
                                onChangeText={setEmail}
                                editable={editEmail}
                                style={[
                                    styles.input,
                                    !editEmail && styles.disabledInput,
                                    { paddingRight: 40 }
                                ]} />
                            <TouchableOpacity style={styles.editIcon}
                                onPress={() => {
                                    setEditEmail(true);
                                    setEditName(false);
                                    setEditPhone(false);
                                    setTimeout(() => emailRef.current?.focus(), 100);
                                }}  >
                                <MaterialIcons name="edit" size={22} style={{ marginLeft: 8, color: colors.text }} />
                            </TouchableOpacity>
                        </View>


                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={()=>navigation.navigate("Claimed")}
                            disabled={saving} >
                            <Text style={{ color: "white", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                                Claimed Offers
                            </Text>
                        </TouchableOpacity>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving} >
                            <Text style={{ color: "white", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Text>
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
        backgroundColor: "#e0e0e0",
    },
    text: {
        fontSize: 16,
        marginTop: 10,
        fontFamily: "Medium",
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
        backgroundColor: "#e0e0e0",
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: "#f5b849",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    cameraIcon: {
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: "#4b4a4a",
        padding: 4,
        borderRadius: 20,
    },
    profileImage: {
        width: 130,
        height: 130,
        borderRadius: 70,
        alignSelf: "center",
    },
    avatarWrapper: {
        alignSelf: "center",
        marginTop: 15,
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
});