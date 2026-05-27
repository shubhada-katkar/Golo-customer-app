import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    clearChat,
    togglePinChat,
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
    const [showMenu, setShowMenu] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    const [keyboardVisible, setKeyboardVisible] = useState(false);

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

                    const pinnedKey = `pinned_chats_${auth.userId}`;
                    const pinnedStr = await AsyncStorage.getItem(pinnedKey);
                    const pinnedIds = pinnedStr ? JSON.parse(pinnedStr) : [];
                    const pinned = pinnedIds.includes(finalConversationId);
                    setIsPinned(pinned);
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
            scrollToLatest(true);
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
            scrollToLatest(true);
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
                    scrollToLatest(true);
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
                    Alert.alert("Reference Failed", error.message || "Could not send ad reference");
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

        Alert.alert(
            "Clear chat",
            "All messages in this conversation will be cleared. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearChat(conversationId);
                            setMessages([]);
                        } catch (error) {
                            Alert.alert("Clear Failed", error.message || "Could not clear chat");
                        }
                    },
                },
            ],
        );
    };

    const handlePinChat = async () => {
        setShowMenu(false);
        if (!conversationId) return;

        try {
            const result = await togglePinChat(conversationId);
            const pinned = result?.pinned ?? !isPinned;
            setIsPinned(pinned);
            Alert.alert(pinned ? "Pinned" : "Unpinned", pinned ? "This chat has been pinned." : "This chat has been unpinned.");
        } catch (error) {
            Alert.alert("Pin Failed", error.message || "Could not update pin status");
        }
    };

    const handleDeleteChat = () => {
        setShowMenu(false);
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

    useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => { setKeyboardVisible(true);
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
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={26} style={{ padding: 5, color: colors.text }} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{sellerName}</Text>
                        <Text style={[styles.presenceText, { color: colors.text }]}>{renderPresence()}</Text>
                    </View>
                    <View>
                        <TouchableOpacity onPress={() => setShowMenu(true)}>
                            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dropdown Menu */}
                <Modal visible={showMenu} transparent animationType="fade">
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
                            <TouchableOpacity style={styles.menuItem} onPress={handlePinChat}>
                                <Ionicons name={isPinned ? "pin" : "pin-outline"} size={18} color="#333" />
                                <Text style={styles.menuItemText}>{isPinned ? "Unpin Chat" : "Pin Chat"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteChat}>
                                <Ionicons name="close-circle-outline" size={18} color="#c0392b" />
                                <Text style={[styles.menuItemText, { color: "#c0392b" }]}>Delete Chat</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider }} />

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
                                            color: isMine ? "#ffffff" : "#111111", fontFamily: "Medium",
                                            fontSize: 12, lineHeight: Math.round(12 * 1.5)
                                        }}>
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
                        onFocus={() => scrollToLatest(false)}
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
    headerTitle: {
        fontSize: 20,
        fontFamily: "SemiBold",
        lineHeight: Math.round(20 * 1.5),
    },

    presenceText: {
        color: "#4d4d4d",
        fontSize: 12,
        marginTop: 2,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },

    menuOverlay: {
        flex: 1,
    },

    menuDropdown: {
        position: "absolute",
        top: 42,
        right: 0,
        backgroundColor: "#fff",
        paddingVertical: 6,
        minWidth: 180,
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
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
        color: "#333",
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
        fontFamily: "Medium",
        lineHeight: Math.round(11 * 1.5),
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
        lineHeight: Math.round(13 * 1.5),
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
        fontSize: 14,
        fontFamily: "SemiBold",
        lineHeight: Math.round(14 * 1.5),
    },

    adRefHint: {
        fontSize: 11,
        marginTop: 4,
        fontFamily: "Medium",
        lineHeight: Math.round(11 * 1.5),
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