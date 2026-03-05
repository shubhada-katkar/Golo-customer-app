import React, { useState } from "react";
import {
    View, TouchableOpacity, Text, TextInput, StyleSheet,
    Image, Dimensions, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Entypo } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Registration({ navigation }) {
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const [profileImage, setProfileImage] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [visiblepass, setvisiblepass] = useState(false);

    // email is considered verified by default when using new backend
    const [emailVerified, setEmailVerified] = useState(true);

    const [registerLoading, setRegisterLoading] = useState(false);

    // ================= EMAIL VALIDATION =================

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    // NOTE: email validation is simple – backend will perform full checks

    // ================= EMAIL VERIFY HANDLER =================

    // With the new backend the email is verified during registration itself.
    // This function is left empty to satisfy old references (none now).
    const handleEmailVerification = async () => {
        // no-op
    };

    // ================= IMAGE PICKER =================

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            alert("Permission required!");
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

    // ================= REGISTER =================
    const handleRegister = async () => {
        if (registerLoading) return;

        // backend handles email validation; skip check

        try {
            setRegisterLoading(true);

            // If no profile image, send JSON (backend expects JSON). If image present, fall back
            // to multipart FormData (backend currently has no file handler, so prefer JSON).
            let response;
            if (!profileImage) {
                const payload = { name: username, email, phone, password };
                response = await fetch(`${BASE_URL}/users/register`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                const formData = new FormData();
                formData.append("name", username); // backend expects 'name' field
                formData.append("email", email);
                formData.append("phone", phone);
                formData.append("password", password);
                formData.append("image", {
                    uri: profileImage,
                    name: "profile.jpg",
                    type: "image/jpeg",
                });
                response = await fetch(`${BASE_URL}/users/register`, {
                    method: "POST",
                    body: formData,
                });
            }

            const data = await response.json();

            setRegisterLoading(false);

            if (response.ok) {
                alert("Registration Successful");
                navigation.navigate("Login");
            } else {
                alert(data.message || "Registration Failed");
            }

        } catch (error) {
            setRegisterLoading(false);
            alert("Server Error");
        }
    };

    // ================= UI =================
    return (
        <SafeAreaView style={{ flex: 1, }}>

            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
                <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
            </View>

            <KeyboardAvoidingView
                style={StyleSheet.absoluteFill}
                behavior={Platform.OS === "ios" ? "padding" : "height"}  >

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}  >

                    <View style={styles.centerContainer}>

                        <Text style={styles.title}>Create Account</Text>

                        <View style={styles.card}>

                            {/* IMAGE */}
                            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                                <View style={{ position: "relative" }}>
                                    <Image
                                        source={
                                            profileImage
                                                ? { uri: profileImage }
                                                : require("../assets/profile.png")
                                        }
                                        style={styles.profileImage} />
                                    <View style={styles.cameraIcon}>
                                        <MaterialIcons name="camera-alt" size={22} color="#ffffff" />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* INPUTS */}
                            <Text style={{ fontSize: 16, fontFamily:"Medium" }}>Name</Text>
                            <TextInput style={styles.input} value={username}
                                placeholder="Enter your name" onChangeText={setUsername} />

                            <Text style={styles.label}>Email</Text>

                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                placeholder="Enter Email"
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput style={styles.input} value={phone}
                                placeholder="e.g. 91+ xxx..." onChangeText={setPhone} keyboardType="numeric" />

                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputpassword}>
                                <TextInput style={{ fontSize: 16, flex: 1, fontFamily:"Medium" }}
                                    placeholder="Enter password"
                                    secureTextEntry={!visiblepass}
                                    value={password}
                                    onChangeText={setPassword} />
                                {!visiblepass ? (
                                    <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(true)}>
                                        <Entypo name="eye-with-line" size={20} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(false)}>
                                        <Entypo name="eye" size={20} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    registerLoading && { opacity: 0.7 }
                                ]}
                                onPress={handleRegister}
                                disabled={registerLoading} >

                                {registerLoading ? (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <ActivityIndicator color="white" />
                                        <Text style={{ color: "white", fontSize: 16, fontFamily:"Medium" }}>
                                            Please wait...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={{ color: "white", fontSize: 18, fontFamily:"Medium",lineHeight:Math.round(18*1.6) }}>
                                        Register
                                    </Text>
                                )}

                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", marginTop:10 }}>
                            <Text style={{ fontSize: 16, fontFamily:"Medium" }}>Have An Account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={{ fontSize: 16, color: "#4caf50",fontFamily:"Medium" }}>Login
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

// ================= STYLES =================

const styles = StyleSheet.create({

    title: {
        fontSize: width * 0.056,
        color: "#ffffff",
        fontFamily:"Medium"
    },

    card: {
        backgroundColor: "#ffffff",
        width: Math.min(width * 0.85, 380),
        minHeight: height * 0.55,
        borderRadius: 20,
        paddingBottom: 8,
        paddingHorizontal: 16,
        borderWidth: 0.5,
        borderColor: "#000000"
    },

    label: {
        marginTop: 6,
        fontSize: 16,
        fontFamily:"Medium"
    },
    scrollContainer: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: height * 0.05,
    },

    input: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: "#000000",
        fontFamily:"Medium"
    },

    emailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },

    verifyBtn: {
        backgroundColor: "#157a4f",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: "center"
    },

    button: {
        backgroundColor: "#157a4f",
        marginTop: 16,
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12
    },
    inputpassword: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        paddingLeft: 12,
        fontSize:14,
        justifyContent: "space-between",
        borderWidth: 1,
        fontFamily:"Medium",
        lineHeight:Math.round(14*1.2)
    },
    cameraIcon: {
        position: "absolute",
        bottom: 14,
        right: 16,
        backgroundColor: "#4b4a4a",
        padding: 3,
        borderRadius: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: "center"
    },
    avatarWrapper: {
        position: "relative",
        alignSelf: "center",
    },
    centerContainer: {
        alignItems: "center",
        width: "100%",
    },
});