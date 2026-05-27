import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { BASE_URL } from "../config";

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
  const data = await authorizedFetch("/chats/conversations", { method: "GET" });
  const conversationList = Array.isArray(data) ? data : [];
  
  try {
    const { userId } = await getAuthContext();
    if (userId) {
      const pinnedKey = `pinned_chats_${userId}`;
      const pinnedStr = await AsyncStorage.getItem(pinnedKey);
      const pinnedIds = pinnedStr ? JSON.parse(pinnedStr) : [];
      
      const enriched = await Promise.all(
        conversationList.map(async (conversation) => {
          const conversationId = conversation.id;
          const clearedKey = `cleared_chat_${userId}_${conversationId}`;
          const clearedAtStr = await AsyncStorage.getItem(clearedKey);
          
          let lastMessageText = conversation.lastMessageText;
          let messagesCount = conversation.messagesCount;
          let lastMessageAt = conversation.lastMessageAt;
          
          if (clearedAtStr) {
            const clearedAt = new Date(clearedAtStr).getTime();
            const lastMsgTime = new Date(lastMessageAt).getTime();
            if (lastMsgTime <= clearedAt) {
              lastMessageText = "";
              messagesCount = 0;
            }
          }
          
          const pinnedBy = Array.isArray(conversation.pinnedBy) ? [...conversation.pinnedBy] : [];
          const isPinned = pinnedIds.includes(conversationId);
          if (isPinned && !pinnedBy.includes(userId)) {
            pinnedBy.push(userId);
          } else if (!isPinned && pinnedBy.includes(userId)) {
            const idx = pinnedBy.indexOf(userId);
            if (idx > -1) pinnedBy.splice(idx, 1);
          }
          
          return {
            ...conversation,
            lastMessageText,
            lastMessageAt,
            messagesCount,
            pinnedBy,
          };
        })
      );
      return enriched;
    }
  } catch (err) {
    console.log("Error enriching conversations list with local states", err);
  }
  
  return conversationList;
}

async function startConversation(payload) {
  const conversation = await authorizedFetch("/chats/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  if (conversation) {
    try {
      const { userId } = await getAuthContext();
      if (userId) {
        const pinnedKey = `pinned_chats_${userId}`;
        const pinnedStr = await AsyncStorage.getItem(pinnedKey);
        const pinnedIds = pinnedStr ? JSON.parse(pinnedStr) : [];
        const isPinned = pinnedIds.includes(conversation.id);
        
        const pinnedBy = Array.isArray(conversation.pinnedBy) ? [...conversation.pinnedBy] : [];
        if (isPinned && !pinnedBy.includes(userId)) {
          pinnedBy.push(userId);
        }
        
        const clearedKey = `cleared_chat_${userId}_${conversation.id}`;
        const clearedAtStr = await AsyncStorage.getItem(clearedKey);
        let lastMessageText = conversation.lastMessageText;
        let messagesCount = conversation.messagesCount;
        
        if (clearedAtStr) {
          const clearedAt = new Date(clearedAtStr).getTime();
          const lastMsgTime = new Date(conversation.lastMessageAt).getTime();
          if (lastMsgTime <= clearedAt) {
            lastMessageText = "";
            messagesCount = 0;
          }
        }
        
        return {
          ...conversation,
          lastMessageText,
          messagesCount,
          pinnedBy,
        };
      }
    } catch (err) {
      console.log("Error enriching started conversation", err);
    }
  }
  return conversation;
}

async function listMessages(conversationId, page = 1, limit = 50) {
  const safeConversationId = encodeURIComponent(conversationId);
  const data = await authorizedFetch(
    `/chats/conversations/${safeConversationId}/messages?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  
  try {
    const { userId } = await getAuthContext();
    if (userId && data && Array.isArray(data.items)) {
      const clearedKey = `cleared_chat_${userId}_${conversationId}`;
      const clearedAtStr = await AsyncStorage.getItem(clearedKey);
      if (clearedAtStr) {
        const clearedAt = new Date(clearedAtStr).getTime();
        data.items = data.items.filter(
          (item) => new Date(item.createdAt).getTime() > clearedAt
        );
      }
    }
  } catch (err) {
    console.log("Error filtering messages with cleared local state", err);
  }
  
  return data;
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
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      throw new Error("Please login to clear chat");
    }
    const clearedKey = `cleared_chat_${userId}_${conversationId}`;
    const nowIso = new Date().toISOString();
    await AsyncStorage.setItem(clearedKey, nowIso);
    return { success: true };
  } catch (err) {
    throw new Error(err.message || "Failed to clear chat");
  }
}

async function togglePinChat(conversationId) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      throw new Error("Please login to pin chat");
    }
    const pinnedKey = `pinned_chats_${userId}`;
    const pinnedStr = await AsyncStorage.getItem(pinnedKey);
    let pinnedIds = pinnedStr ? JSON.parse(pinnedStr) : [];
    
    let pinned = false;
    if (pinnedIds.includes(conversationId)) {
      pinnedIds = pinnedIds.filter((id) => id !== conversationId);
      pinned = false;
    } else {
      pinnedIds.push(conversationId);
      pinned = true;
    }
    
    await AsyncStorage.setItem(pinnedKey, JSON.stringify(pinnedIds));
    return { success: true, pinned };
  } catch (err) {
    throw new Error(err.message || "Failed to toggle pin status");
  }
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