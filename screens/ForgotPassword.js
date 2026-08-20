import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OtpInput from "../components/OtpInput";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

const { width } = Dimensions.get("window");

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  useEffect(() => {
    if (otpTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setOtpTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

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
      setOtpTimer(300);
      setResendCooldown(60);
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
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {!otpSent && (
          <TouchableOpacity
            style={[styles.sendButton, sendLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={sendLoading}
          >
            {sendLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        )}

        {otpSent ? (
          <>
            <View style={styles.otpInfoRow}>
              <Text style={styles.otpInfoText}>OTP expires in {otpTimer > 0 ? formatTime(otpTimer) : "00:00"}.</Text>
            </View>

            <Text style={styles.label}>OTP</Text>
            <OtpInput value={otp} onChangeOtp={setOtp} />

            <TouchableOpacity
              style={[styles.verifyButton, verifyLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={verifyLoading}
            >
              {verifyLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.verifyButtonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, (sendLoading || resendCooldown > 0) && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={sendLoading || resendCooldown > 0}
            >
              {sendLoading ? (
                <Text style={styles.resendButtonText}>Sending...</Text>
              ) : resendCooldown > 0 ? (
                <Text style={styles.resendButtonText}>Resend OTP ({formatTime(resendCooldown)})</Text>
              ) : (
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              )}
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  title: {
    ...textPresets.title,
    textAlign: "center",
  },
  subtitle: {
    ...textPresets.label,
    textAlign: "center",
    marginTop: 4
  },
  label: {
    marginTop: 24,
    marginBottom: 8,
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#000000",
    ...textPresets.body
  },
  sendButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#157a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#ffffff",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },
  otpInfoRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpInfoText: {
    ...textPresets.label
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
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
  resendButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#157a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  resendButtonText: {
    color: "#157a4f",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backText: {
    color: "#157a4f",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    alignSelf: "center",
    top: 20,
  },
});