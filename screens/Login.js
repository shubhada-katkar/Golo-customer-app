import React, { useState } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { saveAuthData, clearAuthStorage } from "../services/authService";
import { startCustomerNotificationPolling } from "../services/notificationService";
import { textPresets } from "../theme/typography"

const { width } = Dimensions.get("window");

export default function Login({ navigation, route }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visiblepass, setvisiblepass] = useState(false);

  const handleSkip = () => {
    const returnTo = route?.params?.returnTo;
    const returnParams = route?.params?.returnParams;

    if (returnTo) {
      navigation.reset({
        index: 0,
        routes: [{ name: returnTo, params: returnParams }],
      });
      return;
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.reset({ index: 0, routes: [{ name: "GoloDeals" }] });
  };

  // Static for now — will be wired up to real OAuth later
  const handleGooglePress = () => {
    Alert.alert("Coming soon", "Google sign-in will be available soon.");
  };

  const handleFacebookPress = () => {
    Alert.alert("Coming soon", "Facebook sign-in will be available soon.");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Enter valid email");
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        }),
        signal: controller.signal
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        await clearAuthStorage();
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }

      if (!data.data || !data.data.accessToken || !data.data.user || !data.data.user.id) {
        Alert.alert("Error", "Invalid server response");
        return;
      }

      await saveAuthData({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        user: data.data.user,
      });
      await startCustomerNotificationPolling();

      const returnTo = route?.params?.returnTo;
      const returnParams = route?.params?.returnParams;

      navigation.reset({
        index: 0,
        routes: [{ name: returnTo || "GoloDeals", params: returnTo ? returnParams : undefined }],
      });
    } catch (error) {
      setLoading(false);
      if (error.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long to respond");
      } else {
        Alert.alert("Network Error", "Check your internet connection");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome to GOLO Network Group</Text>
        <Text style={styles.subtitle}>Grow Smarter With Every Ad. Join Free</Text>

        {/* Static social buttons — backend wiring comes later */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGooglePress}>
            <FontAwesome name="google" size={18} color="#EA4335" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} onPress={handleFacebookPress}>
            <FontAwesome name="facebook" size={18} color="#1877F2" />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#a0a0a0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter your password"
            placeholderTextColor="#a0a0a0"
            secureTextEntry={!visiblepass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setvisiblepass(!visiblepass)}>
            <Ionicons name={visiblepass ? "eye-outline" : "eye-off-outline"} size={20} color="#8a8a8a" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Continue"}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>New to GOLO Network Group? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Registration")}>
            <Text style={styles.signupLink}>Register Now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: width * 0.06,
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    color: "#111111",
    textAlign: "center",
    marginBottom: 6,
    ...textPresets.title
  },
  subtitle: {
    ...textPresets.body,
    color: "#8a8a8a",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: Math.round(14 * 1.5)
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  socialText: {
    ...textPresets.body,
    color: "#333333",
    lineHeight: Math.round(14 * 1.5)
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    ...textPresets.label,
    color: "#a0a0a0",
    letterSpacing: 0.5,
  },
  label: {
    ...textPresets.body,
    color: "#111111",
    marginBottom: 6,
    lineHeight: Math.round(14 * 1.5)
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...textPresets.body,
    color: "#111111",
    top: 4
  },
  eyeButton: {
    padding: 6,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  button: {
    backgroundColor: "#157a4f",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    ...textPresets.body,
    color: "#555555",
    lineHeight: Math.round(14 * 1.5)
  },
  signupLink: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  skipLink: {
    alignSelf: "center",
    marginTop: 14,
  },
  skipText: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
});