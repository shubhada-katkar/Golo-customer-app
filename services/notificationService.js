import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Platform } from "react-native";
import { BASE_URL } from "../config";
import { getValidToken } from "./authService";

let pollingTimer = null;
let pollingInFlight = false;
let pushTokenRegistered = false;

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_CUSTOMER_NOTIFICATION_TASK";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    await pollCustomerNotifications();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.log("Background notification task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundNotificationTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    console.log("Error registering background notification task:", error);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  return true;
}

export async function registerCustomerPushToken(force = false) {
  if (pushTokenRegistered && !force) {
    return;
  }

  try {
    const permissionGranted = await ensureNotificationPermission();
    if (!permissionGranted) return;

    let expoToken = "";
    try {
      expoToken = (await Notifications.getExpoPushTokenAsync()).data;
    } catch {
      try {
        const Constants = require("expo-constants").default || require("expo-constants");
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
        expoToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
      } catch (tokenErr) {
        console.log("Failed to fetch Expo push token:", tokenErr);
      }
    }

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
    const isAdmin =
      item?.isAdmin ||
      item?.isBroadcast ||
      ["admin_warning", "promotional", "alert", "emergency", "system_update", "admin", "broadcast"].includes(item?.type) ||
      (item?.senderName && String(item.senderName).toLowerCase().includes("admin")) ||
      (item?.title && (!item?.adTitle || item?.adTitle === "-"));

    const title = (isAdmin && item?.title && item.title !== "-")
      ? item.title
      : (item?.adTitle && item.adTitle !== "-" ? item.adTitle : (item?.title && item.title !== "-" ? item.title : "New update"));
    const body = item?.description || item?.message || item?.body || "You have a new notification";
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
    await registerCustomerPushToken();
    await registerBackgroundNotificationTask();
  }
  await pollCustomerNotifications();

  pollingTimer = setInterval(() => {
    void pollCustomerNotifications();
  }, 30000);
}

export async function stopCustomerNotificationPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export async function triggerChatNotification({ title, body, conversationId, sellerName }) {
  try {
    const permissionGranted = await ensureNotificationPermission();
    if (!permissionGranted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "New Message",
        body: body || "You received a new message",
        sound: true,
        data: {
          screen: "ChatScreen",
          conversationId,
          sellerName: sellerName || "Chat",
        },
        android: {
          channelId: "customer-notifications",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          autoDismiss: true,
        },
      },
      trigger: null,
    });
  } catch (error) {
    console.log("Failed to schedule chat notification:", error);
  }
}

