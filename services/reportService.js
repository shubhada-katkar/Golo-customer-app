import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function submitReport(type, targetId, reason, details) {
  try {
    let reporterId = await AsyncStorage.getItem("customerId");
    if (!reporterId) {
      reporterId = "Anonymous";
    }

    const payload = {
      type,
      targetId,
      reporterId,
      reason,
      details,
    };

    const response = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to submit report');
    }

    return data;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}
