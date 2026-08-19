import React, { useContext, useEffect, useState, useRef } from "react";
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Switch,
    TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import CustomAlertModal from "../components/CustomeAlertModal";
import { AntDesign, MaterialIcons, Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAuthStorage, getValidToken } from "../services/authService";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import RatingsBox from "../components/RatingsBox";
import { SkeletonBox } from "../components/Skeleton";

const ORANGE = "#f5b849";
const GREEN = "#157a4f";

export default function ProfilePage({ navigation }) {
    const { theme, colors, toggleTheme } = useContext(ThemeContext);

    const [profileImage, setProfileImage] = useState(null);
    const [profilePhotoBase64, setProfilePhotoBase64] = useState(null);
    const [username, setUsername] = useState("");
    const [visible, setVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "error",
        showCancelButton: false,
        cancelText: "Cancel",
        buttonText: "OK",
        onConfirm: null,
    });

    const showAlert = (title, message, type = "error", extraProps = {}) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            showCancelButton: false,
            buttonText: "OK",
            cancelText: "Cancel",
            onConfirm: null,
            ...extraProps,
        });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loyaltyTier, setLoyaltyTier] = useState("Bronze");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editName, setEditName] = useState(false);
    const [editPhone, setEditPhone] = useState(false);
    const [editEmail, setEditEmail] = useState(false);
    const [originalEmail, setOriginalEmail] = useState("");

    const nameRef = useRef(null);
    const phoneRef = useRef(null);
    const emailRef = useRef(null);

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(true);
    const [otpLoading, setOtpLoading] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer]);

    // ================= FETCH PROFILE =================
    const PROFILE_CACHE_KEY = "@golo_user_profile_cache";

    const applyProfileData = (profile) => {
        if (!profile) return;
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
        setOriginalEmail(profile.email || "");
        setLoyaltyPoints(totalLoyaltyPoints);
        setLoyaltyTier(derivedLoyaltyTier);
        setProfileImage(profile.profile?.avatar || profile.profilePhoto || null);
    };

    const fetchProfile = async () => {
        // Stale-While-Revalidate: load local cache immediately (0ms delay)
        try {
            const cachedRaw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
            if (cachedRaw) {
                const cachedProfile = JSON.parse(cachedRaw);
                if (cachedProfile && typeof cachedProfile === "object") {
                    applyProfileData(cachedProfile);
                    setLoading(false);
                }
            }
        } catch { }

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
                showAlert("Error", data.message || "Failed to fetch profile", "error");
                return;
            }

            const profile = data.data;
            applyProfileData(profile);
            AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)).catch(() => { });

            setLoading(false);

        } catch (err) {
            setLoading(false);
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
            showAlert("Permission required", "Media library access is needed to pick a profile photo.", "warning");
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
                showAlert("Image Error", "Could not read image data for upload. Please try a different image.", "error");
            }
        }
    };

    // ================= EMAIL OTP FLOW =================
    const handleSendEmailOtp = async () => {
        if (timer > 0) {
            showAlert("Please wait", `You can request a new OTP in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}.`, "info");
            return;
        }

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
            showAlert("Invalid email", "Please enter a valid email address.", "warning");
            return;
        }

        try {
            setOtpLoading(true);
            const token = await getValidToken();
            const response = await fetch(`${BASE_URL}/users/profile/email-otp/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await response.json();
            setOtpLoading(false);

            if (!response.ok) {
                showAlert(
                    "Verification failed",
                    data.message || "Unable to send verification code.",
                    "error"
                );
                return;
            }

            setOtpSent(true);
            setTimer(300); // 5 minutes timer
            showAlert("Verification Code Sent", "Please check your email for the OTP.", "success");
        } catch (error) {
            setOtpLoading(false);
            showAlert("Server error", "Unable to send verification code.", "error");
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (timer === 0) {
            showAlert("Expired", "OTP has expired.", "error");
            return;
        }

        if (!otp.trim()) {
            showAlert("Code required", "Enter the OTP code sent to your email.", "warning");
            return;
        }

        try {
            setVerifyingOtp(true);
            const token = await getValidToken();
            const response = await fetch(`${BASE_URL}/users/profile/email-otp/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                }),
            });

            const data = await response.json();
            setVerifyingOtp(false);

            if (!response.ok) {
                showAlert(
                    "Verification failed",
                    data.message || "Invalid or expired OTP.",
                    "error"
                );
                return;
            }

            setEmailVerified(true);
            setOtpSent(false);
            setTimer(0);
            showAlert("Verified", "Your new email address has been verified successfully!", "success");
        } catch (error) {
            setVerifyingOtp(false);
            showAlert("Server error", "Unable to verify the code.", "error");
        }
    };

    // ================= SAVE PROFILE =================
    const handleSave = async () => {
        if (email !== originalEmail && !emailVerified) {
            showAlert("Verification required", "Please verify your new email address via OTP first.", "warning");
            return;
        }

        try {
            setSaving(true);

            const token = await getValidToken();
            const updateData = {
                name: username,
                profile: {
                    phone: phone || ""
                }
            };

            if (email !== originalEmail) {
                updateData.email = email.trim().toLowerCase();
            }

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
                showAlert("Error", data.message || "Update failed", "error");
                return;
            }

            const updatedProfile = data.data;
            applyProfileData(updatedProfile);
            AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedProfile)).catch(() => { });
            setProfilePhotoBase64(null);
            setEditName(false);
            setEditPhone(false);
            setEditEmail(false);
            showAlert("Success", "Profile Updated", "success");
        } catch (err) {
            setSaving(false);
            showAlert("Error", err.message || "Update failed", "error");
        }
    };

    const profileImageSource = profileImage
        ? (profileImage.startsWith("http") || profileImage.startsWith("data:") || profileImage.startsWith("file:")
            ? { uri: profileImage }
            : { uri: `data:image/jpeg;base64,${profileImage}` })
        : require("../assets/profile.png");

    const handleLogout = async () => {
        try {
            const token = await getValidToken();

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
        showAlert(
            "Logout",
            "Are you sure you want to logout?",
            "warning",
            {
                showCancelButton: true,
                cancelText: "Cancel",
                buttonText: "Logout",
                onConfirm: () => {
                    hideAlert();
                    handleLogout();
                }
            }
        );
    };

    const openBox = () => {
        setVisible(true);
    }

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
                        <Text style={{ ...textPresets.title }}>
                            Profile
                        </Text>
                        <TouchableOpacity
                            style={styles.bellButton}
                            onPress={() => navigation.navigate("NotificationsPage")}>
                            <FontAwesome name="bell-o" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ backgroundColor: "#000000", height: 1, marginVertical: 6 }} />

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false} >

                    {loading ? (
                        <View style={{ paddingHorizontal: 14, paddingTop: 18 }}>
                            <View style={{ alignItems: "center", marginBottom: 20 }}>
                                <SkeletonBox width={90} height={90} borderRadius={45} style={{ marginBottom: 12 }} />
                                <SkeletonBox width={140} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
                                <SkeletonBox width="100%" height={70} borderRadius={16} />
                            </View>
                            <SkeletonBox width={150} height={18} borderRadius={4} style={{ marginBottom: 12, marginTop: 10 }} />
                            <View style={styles.settingsCard}>
                                <SkeletonBox width="100%" height={44} borderRadius={12} style={{ marginBottom: 16 }} />
                                <SkeletonBox width="100%" height={44} borderRadius={12} style={{ marginBottom: 16 }} />
                                <SkeletonBox width="100%" height={44} borderRadius={12} />
                            </View>
                            <SkeletonBox width="100%" height={48} borderRadius={14} style={{ marginTop: 20 }} />
                        </View>
                    ) : (
                        <>
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
                                                setEditEmail(false);
                                                setTimeout(() => phoneRef.current?.focus(), 100);
                                            }}  >
                                            <MaterialIcons name="edit" size={18} color={editPhone ? GREEN : "#9a9a9a"} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* EMAIL */}
                                    <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            ref={emailRef}
                                            value={email}
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                setEmailVerified(text.trim().toLowerCase() === originalEmail.trim().toLowerCase());
                                                setOtpSent(false);
                                                setOtp("");
                                            }}
                                            editable={editEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={[
                                                styles.input,
                                                editEmail && styles.inputActive,
                                                !editEmail && styles.disabledInput,
                                                { paddingRight: 40 }
                                            ]}
                                        />
                                        <TouchableOpacity
                                            style={styles.editIcon}
                                            onPress={() => {
                                                setEditEmail(true);
                                                setEditName(false);
                                                setEditPhone(false);
                                                setTimeout(() => emailRef.current?.focus(), 100);
                                            }}
                                        >
                                            <MaterialIcons name="edit" size={18} color={editEmail ? GREEN : "#9a9a9a"} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* OTP Send Button */}
                                    {email !== originalEmail && !emailVerified && !otpSent && (
                                        <TouchableOpacity
                                            style={[styles.otpBtn, otpLoading && { opacity: 0.7 }, { marginTop: 8 }]}
                                            onPress={handleSendEmailOtp}
                                            disabled={otpLoading}
                                        >
                                            {otpLoading ? (
                                                <ActivityIndicator size="small" color={GREEN} />
                                            ) : (
                                                <Text style={styles.otpBtnText}>Send Verification Code</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {/* OTP Input and Verify Button */}
                                    {email !== originalEmail && otpSent && !emailVerified && (
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={[styles.text, { color: colors.text, marginBottom: 4, ...textPresets.label }]}>
                                                Enter verification code sent to your email
                                            </Text>
                                            <View style={styles.inputWrapper}>
                                                <TextInput
                                                    style={[styles.input, styles.inputActive, { flex: 1 }]}
                                                    value={otp}
                                                    onChangeText={setOtp}
                                                    keyboardType="number-pad"
                                                    placeholder="6-digit code"
                                                    placeholderTextColor="#a0a0a0"
                                                    maxLength={6}
                                                />
                                                <TouchableOpacity
                                                    style={[styles.verifyOtpBtn, verifyingOtp && { opacity: 0.7 }]}
                                                    onPress={handleVerifyEmailOtp}
                                                    disabled={verifyingOtp}
                                                >
                                                    {verifyingOtp ? (
                                                        <ActivityIndicator size="small" color="#ffffff" />
                                                    ) : (
                                                        <Text style={styles.verifyOtpBtnText}>Verify</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                onPress={handleSendEmailOtp}
                                                disabled={otpLoading || timer > 0}
                                                style={{ alignSelf: "flex-end", marginTop: 4 }}
                                            >
                                                <Text style={{ color: (otpLoading || timer > 0) ? "#a0a0a0" : GREEN, ...textPresets.label }}>
                                                    {timer > 0 ? `Resend Code in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}` : "Resend Code"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {email !== originalEmail && emailVerified && (
                                        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <MaterialIcons name="check-circle" size={18} color={GREEN} />
                                            <Text style={{ color: GREEN, ...textPresets.label }}>Email verified successfully!</Text>
                                        </View>
                                    )}
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

                                <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("Support")} activeOpacity={0.7}>
                                    <View style={styles.iconCircle}>
                                        <AntDesign name="question-circle" size={18} color={GREEN} />
                                    </View>
                                    <View style={styles.menuText}>
                                        <Text style={[styles.menuTitle, { color: colors.text }]}>Help & Support</Text>
                                        <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>Get help with any issues</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => openBox()} activeOpacity={0.7}>
                                    <View style={styles.iconCircle}>
                                        <AntDesign name="question-circle" size={18} color={GREEN} />
                                    </View>
                                    <View style={styles.menuText}>
                                        <Text style={[styles.menuTitle, { color: colors.text }]}>Ratings & Reviews</Text>
                                        <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View ratings and reviews</Text>
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
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                showCancelButton={alertConfig.showCancelButton}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onClose={hideAlert}
                onCancel={hideAlert}
            />
            {visible && (
                <RatingsBox
                    visible={visible}
                    onClose={() => setVisible(false)}
                />
            )}
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
        opacity: 0.7,
        ...textPresets.label,
    },
    input: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        paddingRight: 40,
        borderWidth: 1,
        borderColor: "#ececec",
        backgroundColor: "#fafafa",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
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
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarWrapper: {
        alignSelf: "center",
        position: "relative",
    },
    nameText: {
        ...textPresets.subtitle,
        top: 10
    },
    inputWrapper: {
        position: "relative",
        marginTop: 8,
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
        paddingVertical: 16,
        backgroundColor: "#ffffff",
        marginTop: 18,
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
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    cardSubtitle: {
        ...textPresets.label,
        opacity: 0.55,
        marginTop: 1,
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
        ...textPresets.body,
        color: GREEN,
        lineHeight: Math.round(14 * 1.5),
    },
    pointsLabel: {
        ...textPresets.label,
        color: GREEN,
        opacity: 0.8,
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
        letterSpacing: 0.8,
        opacity: 0.5,
        marginBottom: 8,
        ...textPresets.label
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 16,
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
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    menuSub: {
        marginTop: 1,
        opacity: 0.7,
        ...textPresets.label
    },
    divider: {
        height: 1,
        marginVertical: 20,
        marginHorizontal: 12,
        backgroundColor: "#eeeeee",
    },
    otpBtn: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: GREEN,
        top: 3,
        alignSelf: "stretch",
        justifyContent: "center",
        alignItems: "center",
    },
    otpBtnText: {
        color: GREEN,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
    verifyOtpBtn: {
        backgroundColor: GREEN,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10
    },
    verifyOtpBtnText: {
        color: "#ffffff",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
});