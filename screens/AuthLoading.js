import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { textPresets } from "../theme/typography";
import { getValidToken } from "../services/authService";

/**
 * AuthLoading – shown on every cold start.
 *
 * Checks network state first:
 *  - If device is offline → resets to NoNetPage.
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
        const netState = await NetInfo.fetch();
        const isOffline = netState.isConnected === false || (netState.isConnected === true && netState.isInternetReachable === false);
        if (isOffline) {
          if (!cancelled) {
            navigation.reset({ index: 0, routes: [{ name: "NoNetPage" }] });
          }
          return;
        }

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
