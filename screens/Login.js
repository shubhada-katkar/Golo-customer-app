import React, { useState } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Login({ navigation }) {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visiblepass, setvisiblepass] = useState(false);

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
        await AsyncStorage.multiRemove(["customerToken", "customerData", "customerId", "customerRefreshToken"]);
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }

      if (!data.data || !data.data.accessToken || !data.data.user || !data.data.user.id) {
        Alert.alert("Error", "Invalid server response");
        return;
      }

      await AsyncStorage.multiSet([
        ["customerToken", data.data.accessToken],
        ["customerRefreshToken", data.data.refreshToken],
        ["customerData", JSON.stringify(data.data.user)],
        ["customerId", data.data.user.id]
      ]);

      Alert.alert("Login Successful");
      navigation.reset({
        index: 0,
        routes: [{ name: "GoloHome" }],
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} />

      <View style={styles.centerContainer}>
        <Text style={{ fontSize: width * 0.07, color: "#ffffff", fontFamily: "SemiBold" }}>
          Login To Your Account
        </Text>

        <View style={styles.card}>
          <Text style={styles.text}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.text}>Password</Text>
          <View style={styles.inputpassword}>
            <TextInput
              style={{ fontSize: 14, flex: 1, fontFamily: "Medium" }}
              placeholder="Enter password"
              secureTextEntry={!visiblepass}
              value={password}
              onChangeText={setPassword}
            />
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
            <Text style={{ color: "white", fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.8) }}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontFamily: "Medium" }}>Don't Have An Account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Registration") }>
            <Text style={styles.link}>Register Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    width: width * 0.85,
    minHeight: height * 0.35,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: "#000000",
  },

  text: {
    fontSize: width * 0.048,
    fontFamily: "Medium",
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

  button: {
    backgroundColor: "#157a4f",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },

  link: {
    fontSize: 18,
    color: "#4caf50",
    paddingHorizontal: 10,
    fontFamily: "Medium",
  },

  forgotPasswordLink: {
    alignSelf: "flex-end",
  },

  forgotPasswordText: {
    fontSize: 14,
    color: "#157a4f",
    fontFamily: "Medium",
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
    fontFamily: "Medium",
  },

  centerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
