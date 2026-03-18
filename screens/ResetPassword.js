import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ResetPassword({ navigation, route }) {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  const email = route?.params?.email || "";
  const otp = route?.params?.otp || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (submitting) {
      return;
    }

    if (!email || !otp) {
      Alert.alert("Missing verification", "Restart the forgot password flow and verify the OTP again.");
      navigation.replace("ForgotPassword");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Confirm password must match the new password.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/users/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword: password.trim(),
        }),
      });

      const data = await response.json();
      setSubmitting(false);

      if (!response.ok) {
        Alert.alert("Reset failed", data.message || "Unable to reset password.");
        return;
      }

      Alert.alert("Password updated", "Log in with your new password.", [
        {
          text: "OK",
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            }),
        },
      ]);
    } catch (error) {
      setSubmitting(false);
      Alert.alert("Network error", "Unable to reach the server.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Set a new password for {email}.</Text>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter new password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)}>
            <Entypo name={showPassword ? "eye" : "eye-with-line"} size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((value) => !value)}>
            <Entypo name={showConfirmPassword ? "eye" : "eye-with-line"} size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>Update Password</Text>}
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
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#4b5563",
    fontFamily: "Medium",
  },
  label: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Medium",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingLeft: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontFamily: "Medium",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitButton: {
    marginTop: 28,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#157a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontFamily: "Medium",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});