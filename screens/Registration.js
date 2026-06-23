import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";
import { BASE_URL } from "../config";

const { width, height } = Dimensions.get("window");

export default function Registration({ navigation }) {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [visiblepass, setvisiblepass] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const formatPhone = (value) => {
    const cleaned = (value || "").replace(/\D/g, "");

    if (!cleaned) {
      return undefined;
    }

    // User enters 10 digits; we send E.164 to satisfy backend @IsPhoneNumber
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`;
    }

    if (cleaned.length > 10 && value.trim().startsWith("+")) {
      return value.trim();
    }

    return null;
  };

  const parseAge = (value) => {
    return (value || "").replace(/\D/g, "");
  };

  const getDateOfBirthFromAge = (ageValue) => {
    const years = Number(ageValue);
    if (!Number.isInteger(years) || years < 1 || years > 120) {
      return null;
    }

    const now = new Date();
    const dob = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
    return dob.toISOString().split("T")[0];
  };

  const getErrorMessage = (message, fallback) => {
    if (Array.isArray(message)) {
      return message.filter(Boolean).join("\n");
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    return fallback;
  };

  const handleRegister = async () => {
    if (registerLoading) {
      return;
    }

    if (!username.trim() || !email.trim() || !password.trim() || !age.trim() || !gender) {
      Alert.alert("Missing details", "Fill all fields.");
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

    const parsedAge = Number(age.trim());
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      Alert.alert("Invalid age", "Enter a valid age between 1 and 120.");
      return;
    }

    const formattedPhone = formatPhone(phone);
    if (formattedPhone === null) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit phone number.");
      return;
    }

    const dateOfBirth = getDateOfBirthFromAge(parsedAge);
    if (!dateOfBirth) {
      Alert.alert("Invalid age", "Enter a valid age between 1 and 120.");
      return;
    }

    if (!["male", "female", "others", "prefer_not_to_say"].includes(gender)) {
      Alert.alert("Invalid gender", "Select a valid gender option.");
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
          phone: formattedPhone,
          password,
          accountType: "user",
          gender,
          dateOfBirth,
        }),
      });

      const data = await response.json();
      setRegisterLoading(false);

      if (!response.ok) {
        Alert.alert(
          "Registration failed",
          getErrorMessage(data?.message, "Unable to register.")
        );
        return;
      }

      Alert.alert("Registration Successful", "You can log in now.", [
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
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={username}
                placeholder="Enter your name"
                onChangeText={setUsername}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                placeholder="Enter phone number"
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                placeholder="Enter your age"
                onChangeText={(value) => setAge(parseAge(value))}
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "others", label: "Others" },
                  { value: "prefer_not_to_say", label: "Prefer not to say" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(option.value)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === option.value && styles.genderTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                <Text style={styles.loginLink}>Sign In</Text>
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
    lineHeight: Math.round(width * 0.056 * 1.5),
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
    paddingTop: 16,
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.10,
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
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
  },
  genderOptionActive: {
    backgroundColor: "#157a4f",
    borderColor: "#157a4f",
  },
  genderText: {
    fontSize: 14,
    fontFamily: "Medium",
    color: "#000000",
    lineHeight: Math.round(14 * 1.5),
  },
  genderTextActive: {
    color: "#ffffff",
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
    lineHeight: Math.round(18 * 1.5),
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
    fontSize: 14,
    flex: 1,
    fontFamily: "Medium",
  },
  eyeButton: {
    padding: 14,
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
    lineHeight: Math.round(16 * 1.5),
  },
  loginLink: {
    fontSize: 16,
    color: "#4caf50",
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
});
