import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

export async function submitReport(type, targetId, reason, details) {
  try {
    const token = await AsyncStorage.getItem("customerToken");
    if (!token) {
      throw new Error("Please login to submit a report");
    }

    if (!targetId) {
      throw new Error("Report target ID is required");
    }

    let url = "";
    let payload = {
      reason,
      description: details || "",
    };

    if (type === "AD") {
      url = `${BASE_URL}/ads/${encodeURIComponent(targetId)}/report`;
    } else if (type === "SELLER") {
      url = `${BASE_URL}/users/${encodeURIComponent(targetId)}/report`;
    } else {
      throw new Error("Unsupported report type");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      const message =
        (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
        "Failed to submit report";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error submitting report:", error);
    throw error;
  }
}
