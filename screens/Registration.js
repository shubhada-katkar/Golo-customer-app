import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import OtpInput from "../components/OtpInput";

const { width, height } = Dimensions.get("window");

export default function Registration({ navigation }) {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [visiblepass, setvisiblepass] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleEmailChange = (value) => {
    setEmail(value);
    setOtp("");
    setOtpSent(false);
    setEmailVerified(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission required", "Allow gallery access to choose a profile image.");
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

  const handleSendOtp = async () => {
    if (sendOtpLoading) {
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email before requesting OTP.");
      return;
    }

    try {
      setSendOtpLoading(true);
      const response = await fetch(`${BASE_URL}/users/send-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      setSendOtpLoading(false);

      if (!response.ok) {
        Alert.alert("OTP failed", data.message || "Unable to send OTP right now.");
        return;
      }

      setOtpSent(true);
      setEmailVerified(false);
      Alert.alert("OTP sent", "Check your email for the 6 digit OTP.");
    } catch (error) {
      setSendOtpLoading(false);
      Alert.alert("Network error", "Unable to reach the server.");
    }
  };

  const handleVerifyOtp = async () => {
    if (verifyOtpLoading) {
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email first.");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6 digit OTP sent to your email.");
      return;
    }

    try {
      setVerifyOtpLoading(true);
      const response = await fetch(`${BASE_URL}/users/verify-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
        }),
      });

      const data = await response.json();
      setVerifyOtpLoading(false);

      if (!response.ok) {
        Alert.alert("OTP invalid", data.message || "Unable to verify OTP.");
        return;
      }

      setEmailVerified(true);
      Alert.alert("Email verified", "You can complete registration now.");
    } catch (error) {
      setVerifyOtpLoading(false);
      Alert.alert("Network error", "Unable to reach the server.");
    }
  };

  const handleRegister = async () => {
    if (registerLoading) {
      return;
    }

    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Fill name, email, and password.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (!emailVerified || otp.length !== 6) {
      Alert.alert("Verify email", "Send and verify your email OTP before registering.");
      return;
    }

    try {
      setRegisterLoading(true);
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim(),
          otp,
        }),
      });

      const data = await response.json();
      setRegisterLoading(false);

      if (!response.ok) {
        Alert.alert("Registration failed", data.message || "Unable to register.");
        return;
      }

      Alert.alert("Registration Successful", "You can log in with your verified account now.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      setRegisterLoading(false);
      Alert.alert("Server error", "Unable to complete registration.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
        <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
      </View>

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.card}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                <View style={{ position: "relative" }}>
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

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={username}
                placeholder="Enter your name"
                onChangeText={setUsername}
              />

              <View style={styles.emailHeaderRow}>
                <Text style={styles.label}>Email</Text>
                {emailVerified ? <Text style={styles.verifiedText}>Verified</Text> : null}
              </View>

              <View style={styles.emailRow}>
                <TextInput
                  style={[styles.input, styles.emailInput]}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter email"
                />
                <TouchableOpacity
                  style={[styles.verifyBtn, sendOtpLoading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={sendOtpLoading}
                >
                  <Text style={styles.verifyBtnText}>{sendOtpLoading ? "..." : otpSent ? "Resend" : "Send OTP"}</Text>
                </TouchableOpacity>
              </View>

              {(otpSent || emailVerified) ? (
                <>
                  <Text style={styles.label}>Email OTP</Text>
                  <OtpInput value={otp} onChangeOtp={setOtp} editable={!emailVerified} />
                  {!emailVerified ? (
                    <TouchableOpacity
                      style={[styles.secondaryButton, verifyOtpLoading && styles.buttonDisabled]}
                      onPress={handleVerifyOtp}
                      disabled={verifyOtpLoading}
                    >
                      {verifyOtpLoading ? (
                        <ActivityIndicator color="#157a4f" />
                      ) : (
                        <Text style={styles.secondaryButtonText}>Verify OTP</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.helpText}>Your email is verified. Registration will use this OTP.</Text>
                  )}
                </>
              ) : null}

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                placeholder="Enter phone number"
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputpassword}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password"
                  secureTextEntry={!visiblepass}
                  value={password}
                  onChangeText={setPassword}
                />
                {!visiblepass ? (
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setvisiblepass(true)}>
                    <Entypo name="eye-with-line" size={20} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setvisiblepass(false)}>
                    <Entypo name="eye" size={20} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, registerLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="white" />
                    <Text style={styles.buttonText}>Please wait...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Have An Account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: width * 0.056,
    color: "#ffffff",
    fontFamily: "Medium",
  },
  card: {
    backgroundColor: "#ffffff",
    width: Math.min(width * 0.88, 390),
    borderRadius: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#000000",
    gap: 8,
  },
  label: {
    marginTop: 6,
    fontSize: 16,
    fontFamily: "Medium",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.05,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#000000",
    fontFamily: "Medium",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emailInput: {
    flex: 1,
  },
  emailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 13,
    color: "#157a4f",
    fontFamily: "SemiBold",
  },
  verifyBtn: {
    backgroundColor: "#157a4f",
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 92,
  },
  verifyBtnText: {
    color: "#ffffff",
    fontFamily: "Medium",
    fontSize: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#157a4f",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#157a4f",
    fontFamily: "Medium",
    fontSize: 16,
  },
  helpText: {
    color: "#157a4f",
    fontSize: 13,
    fontFamily: "Medium",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#157a4f",
    marginTop: 16,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Medium",
    lineHeight: Math.round(18 * 1.6),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  inputpassword: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingLeft: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000000",
  },
  passwordInput: {
    fontSize: 16,
    flex: 1,
    fontFamily: "Medium",
  },
  eyeButton: {
    padding: 14,
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
    alignSelf: "center",
  },
  avatarWrapper: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 8,
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  loginPrompt: {
    fontSize: 16,
    fontFamily: "Medium",
  },
  loginLink: {
    fontSize: 16,
    color: "#4caf50",
    fontFamily: "Medium",
  },
});
