import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { textPresets } from "../theme/typography";
import { getValidToken } from "../services/authService";

/**
 * AuthLoading – shown on every cold start.
 *
 * Silently attempts to validate / refresh the stored access token so that:
 *  - Returning logged-in users never get kicked to Login just because their
 *    access token expired while the app was backgrounded (the refresh token
 *    handles it transparently).
 *  - Guest users (no stored tokens) proceed straight to GoloDeals as usual.
 *
 * In all cases the user lands on GoloDeals; protected actions will prompt
 * Login only when actually needed.
 */
export default function AuthLoading({ navigation }) {
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // Try to get a valid token — auto-refreshes if access token is expired
        await getValidToken();
      } catch {
        // NOT_AUTHENTICATED (guest) or SESSION_EXPIRED (refresh also failed)
        // Either way: continue to GoloDeals. Guest browsing is allowed.
      }

      if (!cancelled) {
        navigation.reset({ index: 0, routes: [{ name: "GoloDeals" }] });
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
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
    ...textPresets.subtitle,
  },
});
