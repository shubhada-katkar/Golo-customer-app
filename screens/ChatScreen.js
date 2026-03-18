import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import {
    connectChatSocket,
    getAuthContext,
    listMessages,
    sendMessage,
    startConversation,
    uploadChatImage,
    deleteConversation,
} from "../services/chatService";

export default function ChatScreen({ navigation, route }) {
    const { colors } = useContext(ThemeContext);
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

    const socketRef = useRef(null);
    const scrollRef = useRef(null);
    const activeConversationIdRef = useRef(route?.params?.conversationId || null);
    const sharedAdSentRef = useRef(false);

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
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
        });
    }, []);

    const loadConversationMessages = useCallback(async (targetConversationId) => {
        const data = await listMessages(targetConversationId, 1, 100);
        const items = Array.isArray(data?.items) ? data.items : [];
        setMessages(items);
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

                    setMessages((previous) =>
                        previous.map((msg) => {
                            if (!payload.messageIds.includes(msg.id)) return msg;

                            const existingReadBy = Array.isArray(msg.readBy) ? msg.readBy : [];
                            if (existingReadBy.includes(payload.readerId)) return msg;

                            return {
                                ...msg,
                                readBy: [...existingReadBy, payload.readerId],
                            };
                        }),
                    );
                });

                socket.on("chat_error", (payload) => {
                    console.log("chat_error", payload);
                });
            } catch (error) {
                Alert.alert("Chat Error", error.message || "Unable to open this chat");
                navigation.goBack();
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
        navigation,
        route?.params?.conversation,
        route?.params?.conversationId,
        route?.params?.adId,
        route?.params?.sellerId,
    ]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const emitTyping = useCallback((isTyping) => {
        if (!conversationId || !socketRef.current?.connected) return;

        socketRef.current.emit(isTyping ? "typing_start" : "typing_stop", {
            conversationId,
        });
    }, [conversationId]);

    const handleInputChange = (text) => {
        setInputText(text);
        emitTyping(text.trim().length > 0);
    };

    const sendMessageRealtime = useCallback((payload) => {
        return new Promise((resolve, reject) => {
            if (!conversationId) {
                reject(new Error("Conversation not ready"));
                return;
            }

            if (!socketRef.current?.connected) {
                reject(new Error("Chat socket is not connected"));
                return;
            }

            socketRef.current.emit("send_message", payload, (response) => {
                if (!response?.success) {
                    reject(new Error(response?.message || "Failed to send message"));
                    return;
                }

                resolve(response?.data || null);
            });
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
            setInputText("");
            socketRef.current?.emit("mark_read", { conversationId });
        } catch (error) {
            Alert.alert("Send Failed", error.message || "Unable to send message");
        } finally {
            setSending(false);
        }
    };

    const handleAttachImage = async () => {
        try {
            if (!conversationId || sending || uploadingImage) return;

            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission Needed", "Please allow gallery access to attach images.");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.6,
            });

            if (pickerResult.canceled || !pickerResult.assets?.length) {
                return;
            }

            const asset = pickerResult.assets[0];

            setUploadingImage(true);

            const uploadedUrl = await uploadChatImage(
                asset.uri,
                asset.fileName || `chat-${Date.now()}.jpg`,
                asset.mimeType || "image/jpeg",
            );

            const message = await sendMessageRealtime({
                conversationId,
                text: "",
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

            addOrMergeMessage(message);
            socketRef.current?.emit("mark_read", { conversationId });
        } catch (error) {
            Alert.alert("Attachment Failed", error.message || "Could not send image");
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
                    navigation.setParams({ _sharedOnce: true, shareAd: null });
                }
            } catch (error) {
                sharedAdSentRef.current = false;
                if (!cancelled) {
                    Alert.alert("Share Failed", error.message || "Could not forward the ad");
                }
            }
        };

        forwardSharedAd();

        return () => {
            cancelled = true;
        };
    }, [addOrMergeMessage, conversationId, navigation, route?.params?.shareAd, route?.params?._sharedOnce]);

    const isSharedAdMessage = (message) => {
        const text = String(message?.text || "").toLowerCase();
        return text.startsWith("shared an ad:");
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

    const handleDeleteChat = () => {
        if (!conversationId) return;

        Alert.alert(
            "Delete chat",
            "This conversation will be deleted for you. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteConversation(conversationId);
                            navigation.navigate("ChatPage");
                        } catch (error) {
                            Alert.alert("Delete Failed", error.message || "Could not delete chat");
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#157a4f" />
                </View>
            </SafeAreaView>
        );
    }

    return (

        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 70}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={26} style={{ padding: 5 }} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{sellerName}</Text>
                        <Text style={styles.presenceText}>{renderPresence()}</Text>
                    </View>
                    <TouchableOpacity onPress={handleDeleteChat}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 && (
                        <View style={styles.systemMsg}>
                            <Text>No messages yet. Start the conversation.</Text>
                        </View>
                    )}

                    {messages.map((message) => {
                        const isMine = String(message.senderId) === String(currentUserId);
                        return (
                            <View
                                key={message.id}
                                style={isMine ? styles.rightBubble : styles.leftBubble}
                            >
                                <Text style={{ color: isMine ? "#ffffff" : "#111111" }}>
                                    {message.text || "Attachment"}
                                </Text>

                                {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                    <View style={styles.attachmentsWrap}>
                                        {message.attachments.map((attachment, index) => (
                                            <Image
                                                key={`${message.id}-att-${index}`}
                                                source={{ uri: attachment.url }}
                                                style={styles.attachmentImage}
                                            />
                                        ))}
                                    </View>
                                )}

                                {!!message?.adTitle && isSharedAdMessage(message) && (
                                    <TouchableOpacity
                                        style={styles.sharedAdCard}
                                        onPress={() => {
                                            if (!message?.adId) {
                                                Alert.alert("Ad not available", "This shared ad cannot be opened.");
                                                return;
                                            }
                                            navigation.navigate("AdDetails", { adId: message.adId });
                                        }}
                                    >
                                        {message?.adImage ? (
                                            <Image source={{ uri: message.adImage }} style={styles.sharedAdImage} />
                                        ) : null}
                                        <Text style={[styles.sharedAdTitle, { color: isMine ? "#ffffff" : "#111111" }]}>
                                            {message.adTitle}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <Text style={[styles.msgTime, { color: isMine ? "#d0f0e3" : "#555" }]}>
                                    {formatTime(message.createdAt)}
                                    {isMine && (
                                        <Text>
                                            {Array.isArray(message.readBy) && otherUserId && message.readBy.includes(otherUserId)
                                                ? "  ✓✓"
                                                : "  ✓"}
                                        </Text>
                                    )}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>

                <View style={styles.inputRow}>
                    <TouchableOpacity onPress={handleAttachImage} disabled={uploadingImage || sending}>
                        <Ionicons
                            name="attach"
                            size={24}
                            color={uploadingImage ? "#999" : "#157a4f"}
                        />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Type a message..."
                        style={styles.input}
                        value={inputText}
                        onChangeText={handleInputChange}
                        editable={!sending && !uploadingImage}
                    />
                    <TouchableOpacity onPress={handleSend} disabled={sending || uploadingImage}>
                        <Ionicons name="send" size={24} color={sending || uploadingImage ? "#999" : "#157a4f"} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    headerTitle: { fontSize: 20 },
    presenceText: {
        color: "#4d4d4d",
        fontSize: 12,
        marginTop: 2,
    },

    deleteText: {
        fontSize: 14,
        color: "#c0392b",
        fontFamily: "SemiBold",
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
        fontSize: 11,
        textAlign: "right",
    },

    attachmentsWrap: {
        marginTop: 8,
    },

    attachmentImage: {
        width: 180,
        height: 180,
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
        fontSize: 13,
        fontFamily: "Medium",
    },

    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderTopWidth: 1,
        borderColor: "#eee",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 12,
        marginHorizontal: 8,
        minHeight: 42,
    }
});