import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { BASE_URL } from "../config";
import { getValidToken } from "./authService";

let pollingTimer = null;
let pollingInFlight = false;
let pushTokenRegistered = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_URL || BASE_URL || "").replace(/\/+$/, "");
}

async function ensureNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("customer-notifications", {
      name: "Customer Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f8a812",
      sound: "default",
    });
  }

  return true;
}

async function registerPushTokenWithBackend() {
  if (pushTokenRegistered) {
    return;
  }

  try {
    const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
    if (!expoToken) return;

    let token = "";
    try {
      token = await getValidToken();
    } catch {
      // Not logged in — skip push token registration
      return;
    }
    const baseUrl = getBaseUrl();
    if (!token || !baseUrl) return;

    await fetch(`${baseUrl}/users/notifications/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pushToken: expoToken }),
    });

    pushTokenRegistered = true;
  } catch (error) {
    console.log("Register customer push token error:", error);
  }
}

async function fetchNotifications() {
  let token = "";
  try {
    token = await getValidToken();
  } catch {
    // Not logged in — skip fetching notifications
    return [];
  }
  const baseUrl = getBaseUrl();
  if (!token || !baseUrl) return [];

  const response = await fetch(`${baseUrl}/users/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const json = await response.json();
  return Array.isArray(json?.data?.notifications) ? json.data.notifications : [];
}

async function showNewAlerts(notifications) {
  const seenKey = "customerSeenNotificationIds";
  const userId = (await AsyncStorage.getItem("customerId")) || "default";
  const seenJson = await AsyncStorage.getItem(`${seenKey}:${userId}`);
  const seenIds = seenJson ? JSON.parse(seenJson) : [];
  const seenSet = new Set(seenIds);

  const newNotifications = notifications.filter((item) => {
    const id = String(item?._id || item?.id || "");
    return id && !seenSet.has(id);
  });

  if (!newNotifications.length) return;

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) return;

  for (const item of newNotifications.slice(0, 5)) {
    const title = item?.adTitle || item?.title || "New update";
    const body = item?.message || "You have a new notification";
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { screen: "NotificationsPage", notificationId: String(item?._id || item?.id || "") },
        android: {
          channelId: "customer-notifications",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          autoDismiss: true,
        },
      },
      trigger: null,
    });
  }

  const latestIds = notifications.map((item) => String(item?._id || item?.id || "")).filter(Boolean).slice(0, 50);
  await AsyncStorage.setItem(`${seenKey}:${userId}`, JSON.stringify(latestIds));
}

export async function pollCustomerNotifications() {
  if (pollingInFlight) return;
  pollingInFlight = true;

  try {
    const notifications = await fetchNotifications();
    if (notifications.length) {
      await showNewAlerts(notifications);
    }
  } catch (error) {
    console.log("Customer notification poll error:", error);
  } finally {
    pollingInFlight = false;
  }
}

export async function startCustomerNotificationPolling() {
  if (pollingTimer) return;

  const permissionGranted = await ensureNotificationPermission();
  if (permissionGranted) {
    await registerPushTokenWithBackend();
  }
  await pollCustomerNotifications();

  pollingTimer = setInterval(() => {
    void pollCustomerNotifications();
  }, 30000);
}

export function stopCustomerNotificationPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}
