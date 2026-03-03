import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem("customerToken");

        if (token) {
          navigation.reset({
            index: 0,
            routes: [{ name: "GoloHome" }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
      } catch (e) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    };

    // tiny delay so users actually see the loading UI (optional)
    const t = setTimeout(bootstrap, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#157a4f" />
      <Text style={styles.title}>Please wait…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    marginTop: 16,
    fontSize: 18,
  },
  sub: {
    marginTop: 6,
    color: "#888",
  },
});
