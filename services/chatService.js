import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const SOCKET_BASE_URL = process.env.EXPO_PUBLIC_CHAT_SOCKET_URL;
const CHAT_UPLOAD_URL = process.env.EXPO_PUBLIC_CHAT_UPLOAD_URL || "";
const CHAT_UPLOAD_PATH = process.env.EXPO_PUBLIC_CHAT_UPLOAD_PATH || "/ads/upload/image";

function normalizeBaseUrl() {
  return (BASE_URL || "").replace(/\/+$/, "");
}

async function getAuthContext() {
  const [token, userId] = await AsyncStorage.multiGet(["customerToken", "customerId"]);

  return {
    token: token?.[1] || "",
    userId: userId?.[1] || "",
  };
}

async function authorizedFetch(path, options = {}) {
  const { token } = await getAuthContext();
  if (!token) {
    throw new Error("Please login to use chat");
  }

  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      "Chat request failed";
    throw new Error(message);
  }

  return data?.data;
}

async function authorizedMultipartFetch(path, formData) {
  const { token } = await getAuthContext();
  if (!token) {
    throw new Error("Please login to use chat");
  }

  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  const requestUrl = /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(requestUrl, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      "Image upload failed";
    throw new Error(message);
  }

  return data?.data || data;
}

async function listConversations() {
  return authorizedFetch("/chats/conversations", { method: "GET" });
}

async function startConversation(payload) {
  return authorizedFetch("/chats/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function listMessages(conversationId, page = 1, limit = 50) {
  const safeConversationId = encodeURIComponent(conversationId);
  return authorizedFetch(
    `/chats/conversations/${safeConversationId}/messages?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
}

async function sendMessage(conversationId, payload) {
  const safeConversationId = encodeURIComponent(conversationId);
  return authorizedFetch(`/chats/conversations/${safeConversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function deleteConversation(conversationId) {
  const safeConversationId = encodeURIComponent(conversationId);
  return authorizedFetch(`/chats/conversations/${safeConversationId}`, {
    method: "DELETE",
  });
}

async function clearChat(conversationId) {
  const safeConversationId = encodeURIComponent(conversationId);
  return authorizedFetch(`/chats/conversations/${safeConversationId}/messages`, {
    method: "DELETE",
  });
}

async function togglePinChat(conversationId) {
  const safeConversationId = encodeURIComponent(conversationId);
  return authorizedFetch(`/chats/conversations/${safeConversationId}/pin`, {
    method: "PATCH",
  });
}

async function connectChatSocket() {
  const { token } = await getAuthContext();
  const baseUrl = normalizeBaseUrl();
  const socketBase =
    (SOCKET_BASE_URL || "").replace(/\/+$/, "") || baseUrl.replace(/\/api$/i, "");

  if (!token) {
    throw new Error("Please login to connect chat");
  }
  if (!socketBase) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }

  return io(`${socketBase}/chat`, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    auth: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function uploadChatImage(localUri, fileName = "image.jpg", mimeType = "image/jpeg") {
  if (!localUri) {
    throw new Error("Image uri is missing");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: fileName,
    type: mimeType,
  });

  const uploadResponse = await authorizedMultipartFetch(CHAT_UPLOAD_URL || CHAT_UPLOAD_PATH, formData);
  const uploadedUrl =
    uploadResponse?.url ||
    uploadResponse?.secure_url ||
    uploadResponse?.imageUrl ||
    uploadResponse?.image?.url ||
    "";

  if (!/^https?:\/\//i.test(uploadedUrl)) {
    throw new Error("Upload did not return a valid image URL");
  }

  return uploadedUrl;
}

export {
  getAuthContext,
  listConversations,
  startConversation,
  listMessages,
  sendMessage,
  deleteConversation,
  clearChat,
  togglePinChat,
  uploadChatImage,
  connectChatSocket,
};