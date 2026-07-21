import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { textPresets } from "../theme/typography";

/**
 * AuthLoading – shown on every cold start.
 *
 * The app should open the home screen first. If the user later tries a
 * protected action and is not authenticated, they will be redirected to Login.
 */
export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "GoloDeals" }] });
    }, 300);

    return () => clearTimeout(t);
  }, [navigation]);

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
    ...textPresets.subtitle
  },
});
