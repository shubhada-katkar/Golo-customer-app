import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
    FlatList, Image, KeyboardAvoidingView, Platform, Modal, Keyboard, Alert, Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlertModal from "../components/CustomeAlertModal";
import {
    connectChatSocket,
    getAuthContext,
    listMessages,
    sendMessage,
    startConversation,
    uploadChatImage,
    deleteConversation,
    clearChat,
} from "../services/chatService";
import { triggerChatNotification } from "../services/notificationService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const DRAFT_PREFIX = "CHAT_DRAFT_";
const draftCache = {};

const getDraftKey = (convId, params) => {
    if (convId) return `${DRAFT_PREFIX}${convId}`;
    if (params?.adId && params?.sellerId) return `${DRAFT_PREFIX}ad_${params.adId}_seller_${params.sellerId}`;
    if (params?.adId) return `${DRAFT_PREFIX}ad_${params.adId}`;
    return null;
};

const saveDraft = async (key, text) => {
    if (!key) return;
    if (text) {
        draftCache[key] = text;
        try {
            await AsyncStorage.setItem(key, text);
        } catch (e) {
            console.error("Error saving chat draft:", e);
        }
    } else {
        delete draftCache[key];
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error("Error removing chat draft:", e);
        }
    }
};

const loadDraft = async (key, fallbackKey) => {
    if (key && draftCache[key] !== undefined) {
        return draftCache[key];
    }
    if (fallbackKey && draftCache[fallbackKey] !== undefined) {
        return draftCache[fallbackKey];
    }
    try {
        if (key) {
            const saved = await AsyncStorage.getItem(key);
            if (saved !== null) {
                draftCache[key] = saved;
                return saved;
            }
        }
        if (fallbackKey) {
            const savedFallback = await AsyncStorage.getItem(fallbackKey);
            if (savedFallback !== null) {
                draftCache[fallbackKey] = savedFallback;
                return savedFallback;
            }
        }
    } catch (e) {
        console.error("Error loading chat draft:", e);
    }
    return "";
};

export default function ChatScreen({ navigation, route }) {
    const [conversation, setConversation] = useState(route?.params?.conversation || null);
    const [conversationId, setConversationId] = useState(route?.params?.conversationId || null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [otherUserPresence, setOtherUserPresence] = useState({
        online: false,
        lastSeenAt: null,
    });
    const [typingUserId, setTypingUserId] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [otherUserId, setOtherUserId] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imageViewerUri, setImageViewerUri] = useState(null);

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "error",
        showCancelButton: false,
        cancelText: "Cancel",
        buttonText: "OK",
        onConfirm: null,
        onClose: null,
    });

    const showAlert = (title, message, type = "error", extraProps = {}) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            showCancelButton: false,
            buttonText: "OK",
            cancelText: "Cancel",
            onConfirm: null,
            onClose: null,
            ...extraProps,
        });
    };

    const hideAlert = () => {
        if (alertConfig.onClose) {
            const cb = alertConfig.onClose;
            setAlertConfig({ visible: false, title: "", message: "", type: "error", showCancelButton: false, cancelText: "Cancel", buttonText: "OK", onConfirm: null, onClose: null });
            cb();
        } else {
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }
    };

    const socketRef = useRef(null);
    const scrollRef = useRef(null);
    const activeConversationIdRef = useRef(route?.params?.conversationId || null);
    const sharedAdSentRef = useRef(false);
    const adRefSentRef = useRef(false);

    const sellerName = conversation?.otherUser?.name || route?.params?.sellerName || "Chat";

    const addOrMergeMessage = useCallback((message) => {
        if (!message?.id) return;

        setMessages((previous) => {
            const existingIndex = previous.findIndex((item) => item.id === message.id);
            if (existingIndex >= 0) {
                const updated = [...previous];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...message,
                };
                return updated;
            }

            return [...previous, message].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
        });
    }, []);

    const scrollToLatest = useCallback((animated = true) => {
        requestAnimationFrame(() => {
            scrollRef.current?.scrollToOffset({ offset: 0, animated });
        });
    }, []);

    const loadConversationMessages = useCallback(async (targetConversationId) => {
        const data = await listMessages(targetConversationId, 1, 100);
        const items = Array.isArray(data?.items) ? data.items : [];
        setMessages(items.reverse());
    }, []);

    useEffect(() => {
        let isMounted = true;

        const bootstrapChat = async () => {
            try {
                setLoading(true);

                const auth = await getAuthContext();
                if (!auth?.token || !auth?.userId) {
                    throw new Error("Please login again to open chats");
                }
                if (isMounted) {
                    setCurrentUserId(auth.userId);
                }

                let finalConversation = route?.params?.conversation || conversation;
                let finalConversationId = route?.params?.conversationId || conversationId;

                if (!finalConversationId && route?.params?.adId) {
                    finalConversation = await startConversation({
                        adId: route.params.adId,
                        sellerId: route.params.sellerId,
                    });
                    finalConversationId = finalConversation?.id;
                }

                if (!finalConversationId) {
                    throw new Error("Conversation not found");
                }

                if (isMounted) {
                    setConversation(finalConversation || null);
                    setConversationId(finalConversationId);
                    setOtherUserId(finalConversation?.otherUser?.id || "");

                }
                activeConversationIdRef.current = finalConversationId;

                await loadConversationMessages(finalConversationId);
                scrollToLatest(false);

                const socket = await connectChatSocket();
                socketRef.current = socket;

                socket.on("connect", () => {
                    socket.emit("join_conversation", { conversationId: finalConversationId });
                    socket.emit("mark_read", { conversationId: finalConversationId });
                });

                socket.on("disconnect", () => {
                    console.log("chat socket disconnected");
                });

                socket.on("new_message", (message) => {
                    if (message?.conversationId !== finalConversationId) return;
                    addOrMergeMessage(message);
                    scrollToLatest(true);

                    // If chat is open and an incoming message arrives, mark it as read immediately.
                    if (String(message?.senderId) !== String(auth.userId)) {
                        socket.emit("mark_read", { conversationId: finalConversationId });

                        const senderName = message?.sender?.name || sellerName || "New Message";
                        const textPreview = message?.text || (Array.isArray(message?.attachments) && message.attachments.length ? "📷 Photo" : "Sent a message");

                        triggerChatNotification({
                            title: senderName,
                            body: textPreview,
                            conversationId: finalConversationId,
                            sellerName,
                        });
                    }
                });

                socket.on("conversation_updated", (payload) => {
                    if (!payload?.conversationId) return;

                    const isIncoming = payload?.message && String(payload.message.senderId) !== String(auth.userId);
                    if (isIncoming && payload.conversationId !== finalConversationId) {
                        const senderName = payload.message?.sender?.name || "New Message";
                        const textPreview = payload.lastMessageText || payload.message?.text || "Sent a message";

                        triggerChatNotification({
                            title: senderName,
                            body: textPreview,
                            conversationId: payload.conversationId,
                            sellerName: senderName,
                        });
                    }
                });

                socket.on("presence_state", (payload) => {
                    if (!payload?.userId) return;
                    const otherUserId = finalConversation?.otherUser?.id;
                    if (otherUserId && String(payload.userId) !== String(otherUserId)) return;

                    setOtherUserPresence({
                        online: !!payload.online,
                        lastSeenAt: payload.lastSeenAt || null,
                    });
                });

                socket.on("typing_state", (payload) => {
                    if (!payload?.conversationId || payload.conversationId !== finalConversationId) return;
                    if (String(payload.userId) === String(auth.userId)) return;

                    setTypingUserId(payload.isTyping ? payload.userId : null);
                });

                socket.on("messages_read", (payload) => {
                    if (!payload?.conversationId || payload.conversationId !== finalConversationId) return;
                    if (!Array.isArray(payload.messageIds)) return;

                    const readerId = String(payload.readerId || "");
                    const messageIds = payload.messageIds.map((id) => String(id));

                    setMessages((previous) =>
                        previous.map((msg) => {
                            if (!messageIds.includes(String(msg.id))) return msg;

                            const existingReadBy = Array.isArray(msg.readBy)
                                ? msg.readBy.map((id) => String(id))
                                : [];
                            if (!readerId || existingReadBy.includes(readerId)) return msg;

                            return {
                                ...msg,
                                readBy: [...existingReadBy, readerId],
                            };
                        }),
                    );
                });

                socket.on("chat_error", (payload) => {
                    console.log("chat_error", payload);
                });
            } catch (error) {
                let msg = error?.message || "Unable to open this chat";
                if (msg.includes("Cast to ObjectId") || msg.includes("ObjectId failed")) {
                    msg = "Unable to open this chat at this time.";
                }
                showAlert("Chat Error", msg, "error", {
                    onClose: () => { navigation.goBack(); }
                });
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        bootstrapChat();

        return () => {
            isMounted = false;
            if (socketRef.current && activeConversationIdRef.current) {
                socketRef.current.emit("leave_conversation", { conversationId: activeConversationIdRef.current });
            }
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [
        addOrMergeMessage,
        loadConversationMessages,
        scrollToLatest,
        navigation,
        route?.params?.conversation,
        route?.params?.conversationId,
        route?.params?.adId,
        route?.params?.sellerId,
    ]);

    const emitTyping = useCallback((isTyping) => {
        if (!conversationId || !socketRef.current?.connected) return;

        socketRef.current.emit(isTyping ? "typing_start" : "typing_stop", {
            conversationId,
        });
    }, [conversationId]);

    useEffect(() => {
        let isMounted = true;
        const restoreDraft = async () => {
            const key = getDraftKey(conversationId, route?.params);
            const fallbackKey = conversationId ? getDraftKey(null, route?.params) : null;
            const savedDraft = await loadDraft(key, fallbackKey);
            if (isMounted && savedDraft) {
                setInputText(savedDraft);
                if (key && fallbackKey && savedDraft) {
                    saveDraft(key, savedDraft);
                    saveDraft(fallbackKey, "");
                }
            }
        };
        restoreDraft();
        return () => {
            isMounted = false;
        };
    }, [conversationId, route?.params?.adId, route?.params?.sellerId]);

    const handleInputChange = (text) => {
        setInputText(text);
        emitTyping(text.trim().length > 0);

        const key = getDraftKey(conversationId, route?.params);
        saveDraft(key, text);
    };

    const sendMessageRealtime = useCallback((payload) => {
        return new Promise((resolve, reject) => {
            if (!conversationId) {
                reject(new Error("Conversation not ready"));
                return;
            }

            if (!socketRef.current?.connected) {
                sendMessage(conversationId, payload)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            let handled = false;
            const timeoutId = setTimeout(() => {
                if (handled) return;
                handled = true;
                console.warn("Socket send_message timed out, falling back to REST API");
                sendMessage(conversationId, payload)
                    .then(resolve)
                    .catch(reject);
            }, 5000);

            try {
                socketRef.current.emit("send_message", payload, (response) => {
                    if (handled) return;
                    handled = true;
                    clearTimeout(timeoutId);

                    if (!response?.success) {
                        sendMessage(conversationId, payload)
                            .then(resolve)
                            .catch((err) => reject(new Error(response?.message || err.message || "Failed to send message")));
                        return;
                    }

                    resolve(response?.data || null);
                });
            } catch (err) {
                if (handled) return;
                handled = true;
                clearTimeout(timeoutId);
                sendMessage(conversationId, payload)
                    .then(resolve)
                    .catch(reject);
            }
        });
    }, [conversationId]);

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !conversationId || sending || uploadingImage) return;

        try {
            setSending(true);
            emitTyping(false);

            const message = await sendMessageRealtime({
                conversationId,
                text,
                adId: conversation?.adId,
            });

            addOrMergeMessage(message);
            scrollToLatest(true);
            setInputText("");

            const key = getDraftKey(conversationId, route?.params);
            const fallbackKey = getDraftKey(null, route?.params);
            saveDraft(key, "");
            if (fallbackKey) saveDraft(fallbackKey, "");

            socketRef.current?.emit("mark_read", { conversationId });
        } catch (error) {
            showAlert("Send Failed", error.message || "Unable to send message", "error");
        } finally {
            setSending(false);
        }
    };

    const handlePickSource = () => {
        if (!conversationId || sending || uploadingImage) return;
        setShowImagePicker(true);
    };

    const handleAttachFromGallery = async () => {
        setShowImagePicker(false);
        try {
            if (!conversationId || sending || uploadingImage) return;

            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showAlert("Permission Needed", "Please allow gallery access to attach images.", "warning");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || "images",
                allowsEditing: false,
                quality: 0.7,
            });

            if (pickerResult.canceled || !pickerResult.assets?.length) return;

            await _uploadAndSendImage(pickerResult.assets[0]);
        } catch (error) {
            showAlert("Attachment Failed", error.message || "Could not send image", "error");
        }
    };

    const handleAttachFromCamera = async () => {
        setShowImagePicker(false);
        try {
            if (!conversationId || sending || uploadingImage) return;

            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                showAlert("Permission Needed", "Please allow camera access to take photos.", "warning");
                return;
            }

            const cameraResult = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || "images",
                allowsEditing: false,
                quality: 0.7,
            });

            if (cameraResult.canceled || !cameraResult.assets?.length) return;

            await _uploadAndSendImage(cameraResult.assets[0]);
        } catch (error) {
            showAlert("Camera Failed", error.message || "Could not send photo", "error");
        }
    };

    const _uploadAndSendImage = async (asset) => {
        setUploadingImage(true);
        try {
            const uploadedUrl = await uploadChatImage(
                asset.uri,
                asset.fileName || `chat-${Date.now()}.jpg`,
                asset.mimeType || "image/jpeg",
            );

            const message = await sendMessageRealtime({
                conversationId,
                text: "📷 Photo",
                adId: conversation?.adId || undefined,
                attachments: [
                    {
                        name: asset.fileName || `chat-${Date.now()}.jpg`,
                        mimeType: asset.mimeType || "image/jpeg",
                        url: uploadedUrl,
                        type: "image",
                        size: asset.fileSize,
                    },
                ],
            });

            if (message) {
                addOrMergeMessage(message);
                scrollToLatest(true);
                socketRef.current?.emit("mark_read", { conversationId });
            }
        } catch (error) {
            showAlert("Send Failed", error.message || "Could not send image", "error");
        } finally {
            setUploadingImage(false);
        }
    };


    useEffect(() => {
        let cancelled = false;

        const forwardSharedAd = async () => {
            try {
                const shareAd = route?.params?.shareAd;
                if (!shareAd || !conversationId) return;
                if (route?.params?._sharedOnce || sharedAdSentRef.current) return;

                sharedAdSentRef.current = true;

                const sharedAd = shareAd;

                // Use REST for the one-time forwarded ad so sharing works even if socket reconnect is in progress.
                const message = await sendMessage(conversationId, {
                    text: `Shared an ad: ${sharedAd?.title || "Ad"}`,
                    adId: sharedAd?.adId || sharedAd?._id,
                });

                if (!cancelled) {
                    addOrMergeMessage(message);
                    scrollToLatest(true);
                    navigation.setParams({ _sharedOnce: true, shareAd: null });
                }
            } catch (error) {
                sharedAdSentRef.current = false;
                if (!cancelled) {
                    showAlert("Share Failed", error.message || "Could not forward the ad", "error");
                }
            }
        };

        forwardSharedAd();

        return () => {
            cancelled = true;
        };
    }, [addOrMergeMessage, conversationId, navigation, route?.params?.shareAd, route?.params?._sharedOnce, scrollToLatest]);

    // ─── Auto-send ad reference card when chat opens from an ad ───
    useEffect(() => {
        let cancelled = false;

        const sendAdReference = async () => {
            try {
                const adRef = route?.params?.adRef;
                if (!adRef || !conversationId) return;
                if (route?.params?._adRefSent || adRefSentRef.current) return;

                adRefSentRef.current = true;

                const message = await sendMessage(conversationId, {
                    text: `📌 Ad Reference: ${adRef.title || "Ad"}`,
                    adId: adRef.adId,
                    attachments: adRef.image
                        ? [
                            {
                                name: "ad-thumbnail.jpg",
                                mimeType: "image/jpeg",
                                url: adRef.image,
                                type: "image",
                            },
                        ]
                        : [],
                });

                if (!cancelled) {
                    addOrMergeMessage(message);
                    scrollToLatest(true);
                    navigation.setParams({ _adRefSent: true, adRef: null });
                }
            } catch (error) {
                adRefSentRef.current = false;
                if (!cancelled) {
                    showAlert("Reference Failed", error.message || "Could not send ad reference", "error");
                }
            }
        };

        sendAdReference();

        return () => {
            cancelled = true;
        };
    }, [addOrMergeMessage, conversationId, navigation, route?.params?.adRef, route?.params?._adRefSent, scrollToLatest]);

    const isSharedAdMessage = (message) => {
        const text = String(message?.text || "").toLowerCase();
        return text.startsWith("shared an ad:");
    };

    const isAdRefMessage = (message) => {
        const text = String(message?.text || "");
        return text.startsWith("📌 Ad Reference:");
    };

    const formatTime = (dateValue) => {
        if (!dateValue) return "";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const renderPresence = () => {
        if (typingUserId) {
            return "typing...";
        }

        if (otherUserPresence.online) {
            return "online";
        }

        if (otherUserPresence.lastSeenAt) {
            const lastSeen = new Date(otherUserPresence.lastSeenAt);
            if (!Number.isNaN(lastSeen.getTime())) {
                return `last seen ${lastSeen.toLocaleString()}`;
            }
        }

        return "offline";
    };

    const handleClearChat = () => {
        setShowMenu(false);
        if (!conversationId) return;

        showAlert(
            "Clear chat",
            "All messages in this conversation will be cleared. Continue?",
            "warning",
            {
                showCancelButton: true,
                buttonText: "Clear",
                cancelText: "Cancel",
                onConfirm: async () => {
                    hideAlert();
                    try {
                        await clearChat(conversationId);
                        setMessages([]);
                    } catch (error) {
                        showAlert("Clear Failed", error.message || "Could not clear chat", "error");
                    }
                },
            }
        );
    };

    const handleDeleteChat = () => {
        setShowMenu(false);
        if (!conversationId) return;

        showAlert(
            "Delete chat",
            "This conversation will be deleted for you. Continue?",
            "warning",
            {
                showCancelButton: true,
                buttonText: "Delete",
                cancelText: "Cancel",
                onConfirm: async () => {
                    hideAlert();
                    try {
                        await deleteConversation(conversationId);
                        navigation.navigate("ChatPage");
                    } catch (error) {
                        showAlert("Delete Failed", error.message || "Could not delete chat", "error");
                    }
                },
            }
        );
    };

    useEffect(() => {
        const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
            // scroll to latest message when keyboard opens
            setTimeout(() => {
                scrollRef.current?.scrollToOffset({
                    offset: 0,
                    animated: true,
                });
            }, 100);
        });
        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#157a4f" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <LinearGradient
                    colors={["#f8a812", "#fad081", "#f8f6f265"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
                />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={26} style={{ padding: 5 }} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{sellerName}</Text>
                        {/* <Text style={styles.presenceText}>{renderPresence()}</Text> */}
                    </View>
                    <View>
                        <TouchableOpacity onPress={() => setShowMenu(true)}>
                            <Ionicons name="ellipsis-vertical" size={22} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dropdown Menu */}
                <Modal visible={showMenu} transparent animationType="fade" statusBarTranslucent>
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenu(false)}
                    >
                        <View style={styles.menuDropdown}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
                                <Ionicons name="trash-bin-outline" size={18} color="#333" />
                                <Text style={styles.menuItemText}>Clear Chat</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteChat}>
                                <Ionicons name="close-circle-outline" size={18} color="#c0392b" />
                                <Text style={[styles.menuItemText, { color: "#c0392b" }]}>Delete Chat</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />

                <FlatList
                    ref={scrollRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    inverted
                    contentContainerStyle={{
                        padding: 16,
                        paddingTop: 10,
                        paddingBottom: keyboardVisible ? 80 : 20,
                    }}
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews={true}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => {
                        scrollRef.current?.scrollToOffset({
                            offset: 0,
                            animated: false,
                        });
                    }}
                    renderItem={({ item: message }) => {
                        const isMine = String(message.senderId) === String(currentUserId);
                        const adRef = isAdRefMessage(message);

                        return (
                            <View style={isMine ? styles.rightBubble : styles.leftBubble}>
                                {adRef ? (
                                    <TouchableOpacity
                                        style={styles.adRefCard}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            const refAdId = message.adId || message.ad?.id;
                                            if (refAdId) {
                                                navigation.navigate("AdDetails", { adId: refAdId });
                                            }
                                        }}
                                    >
                                        {Array.isArray(message.attachments) && message.attachments.length > 0 && message.attachments[0]?.url ? (
                                            <Image
                                                source={{ uri: message.attachments[0].url }}
                                                style={styles.adRefImage}
                                            />
                                        ) : null}
                                        <Text style={[styles.adRefTitle, { color: isMine ? "#fff" : "#111" }]}>
                                            {String(message.text || "").replace(/^📌 Ad Reference:\s*/, "")}
                                        </Text>
                                        <Text style={[styles.adRefHint, { color: isMine ? "#d0f0e3" : "#888" }]}>
                                            Tap to view ad
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        <Text style={{
                                            color: isMine ? "#ffffff" : "#111111",
                                            ...textPresets.label,
                                        }}>
                                            {message.text || "Attachment"}
                                        </Text>

                                        {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                            <View style={styles.attachmentsWrap}>
                                                {message.attachments.map((attachment, index) => (
                                                    <TouchableOpacity
                                                        key={`${message.id}-att-${index}`}
                                                        activeOpacity={0.85}
                                                        onPress={() => setImageViewerUri(attachment.url)}
                                                    >
                                                        <Image
                                                            source={{ uri: attachment.url }}
                                                            style={styles.attachmentImage}
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}

                                <Text style={[styles.msgTime, { color: isMine ? "#d0f0e3" : "#555" }]}>
                                    {formatTime(message.createdAt)}
                                    {isMine && (
                                        <Text>
                                            {Array.isArray(message.readBy) &&
                                                otherUserId &&
                                                message.readBy.map((id) => String(id)).includes(String(otherUserId))
                                                ? "  ✓✓"
                                                : "  ✓"}
                                        </Text>
                                    )}
                                </Text>
                            </View>
                        );
                    }}
                />

                <View style={styles.inputRow}>
                    <TouchableOpacity onPress={handlePickSource} disabled={uploadingImage || sending}>
                        {uploadingImage ? (
                            <View style={styles.uploadingIndicator}>
                                <ActivityIndicator size="small" color="#157a4f" />
                            </View>
                        ) : (
                            <View style={styles.attachBtn}>
                                <Ionicons name="image-outline" size={22} color="#157a4f" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Type a message..."
                        style={styles.input}
                        value={inputText}
                        onChangeText={handleInputChange}
                        onFocus={() => scrollToLatest(false)}
                        editable={!sending && !uploadingImage}
                    />
                    <TouchableOpacity onPress={handleSend} disabled={sending || uploadingImage}>
                        {sending ? (
                            <ActivityIndicator size="small" color="#157a4f" />
                        ) : (
                            <View style={[styles.sendBtn, (!inputText.trim() || uploadingImage) && styles.sendBtnDisabled]}>
                                <Ionicons name="send" size={18} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Image Source Picker Modal */}
                <Modal
                    visible={showImagePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowImagePicker(false)}
                    statusBarTranslucent
                >
                    <TouchableOpacity
                        style={styles.pickerOverlay}
                        activeOpacity={1}
                        onPress={() => setShowImagePicker(false)}
                    >
                        <View style={styles.pickerSheet}>
                            <View style={styles.pickerHandle} />
                            <Text style={styles.pickerTitle}>Share an Image</Text>
                            <TouchableOpacity style={styles.pickerOption} onPress={handleAttachFromCamera}>
                                <View style={styles.pickerOptionIcon}>
                                    <Ionicons name="camera-outline" size={22} color="#157a4f" />
                                </View>
                                <View>
                                    <Text style={styles.pickerOptionLabel}>Take a Photo</Text>
                                    <Text style={styles.pickerOptionSub}>Use your camera</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickerOption} onPress={handleAttachFromGallery}>
                                <View style={styles.pickerOptionIcon}>
                                    <Ionicons name="images-outline" size={22} color="#157a4f" />
                                </View>
                                <View>
                                    <Text style={styles.pickerOptionLabel}>Choose from Gallery</Text>
                                    <Text style={styles.pickerOptionSub}>Pick an existing photo</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.pickerCancel}
                                onPress={() => setShowImagePicker(false)}
                            >
                                <Text style={styles.pickerCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Full-Screen Image Viewer */}
                <Modal
                    visible={!!imageViewerUri}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setImageViewerUri(null)}
                    statusBarTranslucent
                >
                    <View style={styles.imageViewerOverlay}>
                        <TouchableOpacity
                            style={styles.imageViewerClose}
                            onPress={() => setImageViewerUri(null)}
                        >
                            <Ionicons name="close-circle" size={34} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: imageViewerUri }}
                            style={styles.imageViewerImage}
                            resizeMode="contain"
                        />
                    </View>
                </Modal>
            </KeyboardAvoidingView>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttonText={alertConfig.buttonText}
                showCancelButton={alertConfig.showCancelButton}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onClose={hideAlert}
                onCancel={hideAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fffaf2" },
    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    header: {
        flexDirection: "row",
        padding: 16,
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    headerTitle: {
        ...textPresets.title
    },
    presenceText: {
        color: "#4d4d4d",
        ...textPresets.label,
        marginTop: 2,
    },
    menuOverlay: {
        flex: 1,
    },
    menuDropdown: {
        position: "absolute",
        top: 90,
        right: 0,
        backgroundColor: "#fff",
        paddingVertical: 6,
        minWidth: 150,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        lineHeight: Math.round(14 * 1.5),
        color: "#333",
        ...textPresets.body
    },
    systemMsg: {
        backgroundColor: "#ddd",
        padding: 8,
        borderRadius: 8,
        alignSelf: "center",
        marginBottom: 12
    },
    leftBubble: {
        backgroundColor: "#f5b849",
        padding: 10,
        borderRadius: 16,
        alignSelf: "flex-start",
        marginVertical: 4,
        maxWidth: "80%",
    },
    rightBubble: {
        backgroundColor: "#0c6b4f",
        padding: 10,
        borderRadius: 16,
        alignSelf: "flex-end",
        marginTop: 8,
        maxWidth: "80%",
    },
    msgTime: {
        marginTop: 4,
        textAlign: "right",
        ...textPresets.caption
    },
    attachmentsWrap: {
        marginTop: 8,
        gap: 6,
    },
    attachmentImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        backgroundColor: "#cfcfcf",
    },
    sharedAdCard: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
        borderRadius: 10,
        padding: 8,
    },
    sharedAdImage: {
        width: 160,
        height: 110,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: "#d4d4d4",
    },
    sharedAdTitle: {
        ...textPresets.label
    },
    adRefCard: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
        borderRadius: 10,
        padding: 6,
        backgroundColor: "rgba(0,0,0,0.06)",
    },
    adRefImage: {
        width: "100%",
        height: 120,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: "#d4d4d4",
    },
    adRefTitle: {
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
    },
    adRefHint: {
        marginTop: 4,
        ...textPresets.label
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderColor: "#eee",
        gap: 8,
        backgroundColor: "#fff",
    },
    attachBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#e8f5ef",
        alignItems: "center",
        justifyContent: "center",
    },
    uploadingIndicator: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#e8f5ef",
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#157a4f",
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        backgroundColor: "#aaa",
    },
    input: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 42,
        ...textPresets.body,
    },
    // Image source picker bottom sheet
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    pickerSheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 12,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ddd",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    pickerTitle: {
        color: "#111",
        marginBottom: 16,
        ...textPresets.label
    },
    pickerOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    pickerOptionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#e8f5ef",
        alignItems: "center",
        justifyContent: "center",
    },
    pickerOptionLabel: {
        color: "#111",
        ...textPresets.label
    },
    pickerOptionSub: {
        color: "#888",
        marginTop: 2,
        ...textPresets.label
    },
    pickerCancel: {
        marginTop: 16,
        alignItems: "center",
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "#f5f5f5",
    },
    pickerCancelText: {
        color: "#c0392b",
        ...textPresets.label
    },
    // Full-screen image viewer
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        alignItems: "center",
        justifyContent: "center",
    },
    imageViewerClose: {
        position: "absolute",
        top: 48,
        right: 20,
        zIndex: 10,
    },
    imageViewerImage: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height * 0.8,
    },
});