import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OtpInput from "../components/OtpInput";

const { width } = Dimensions.get("window");

export default function ForgotPassword({ navigation }) {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSendOtp = async () => {
    if (sendLoading) {
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid account email.");
      return;
    }

    try {
      setSendLoading(true);
      const response = await fetch(`${BASE_URL}/users/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      setSendLoading(false);

      if (!response.ok) {
        Alert.alert("OTP failed", data.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setOtp("");
      Alert.alert("OTP sent", "Check your email for the reset OTP.");
    } catch (error) {
      setSendLoading(false);
      Alert.alert("Network error", "Unable to reach the server.");
    }
  };

  const handleVerifyOtp = async () => {
    if (verifyLoading) {
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6 digit OTP sent to your email.");
      return;
    }

    try {
      setVerifyLoading(true);
      const response = await fetch(`${BASE_URL}/users/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
        }),
      });

      const data = await response.json();
      setVerifyLoading(false);

      if (!response.ok) {
        Alert.alert("Verification failed", data.message || "Unable to verify OTP.");
        return;
      }

      navigation.navigate("ResetPassword", {
        email: email.trim().toLowerCase(),
        otp,
      });
    } catch (error) {
      setVerifyLoading(false);
      Alert.alert("Network error", "Unable to reach the server.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email, verify the OTP, then set a new password.</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.emailRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, styles.emailInput]}
          />
          <TouchableOpacity
            style={[styles.sendButton, sendLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={sendLoading}
          >
            {sendLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.sendButtonText}>{otpSent ? "Resend" : "Send OTP"}</Text>}
          </TouchableOpacity>
        </View>

        {otpSent ? (
          <>
            <Text style={styles.label}>OTP</Text>
            <OtpInput value={otp} onChangeOtp={setOtp} />
            <TouchableOpacity
              style={[styles.verifyButton, verifyLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={verifyLoading}
            >
              {verifyLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.verifyButtonText}>Verify OTP</Text>}
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff8eb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: "SemiBold",
    color: "#1f2937",
    lineHeight: width * 0.1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: Math.round(15 * 1.5),
    color: "#4b5563",
    fontFamily: "Medium",
  },
  label: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Medium",
    color: "#111827",
    lineHeight: Math.round(16 * 1.5),
  },
  emailRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  emailInput: {
    flex: 1,
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
  sendButton: {
    height: 48,
    minWidth: 98,
    borderRadius: 12,
    backgroundColor: "#157a4f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sendButtonText: {
    color: "#ffffff",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
  verifyButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#157a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#ffffff",
    fontFamily: "Medium",
    fontSize: 16,
    lineHeight: Math.round(16 * 1.5),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backText: {
    marginTop: 24,
    color: "#157a4f",
    fontSize: 15,
    fontFamily: "Medium",
    lineHeight: Math.round(15 * 1.5),
  },
});