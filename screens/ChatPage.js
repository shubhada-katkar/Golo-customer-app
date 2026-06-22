import React, { useCallback, useContext, useRef, useState } from "react";
import {
    View,
    StyleSheet,
    Image,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons, Ionicons, Entypo } from "@expo/vector-icons";
import { connectChatSocket, listConversations, getAuthContext } from "../services/chatService";
import { LinearGradient } from "expo-linear-gradient";

export default function ChatPage({ navigation, route }) {
    const { colors } = useContext(ThemeContext);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const socketRef = useRef(null);

    const shareAd = route?.params?.shareAd || null;

    const loadConversations = useCallback(async (isPullToRefresh = false) => {
        try {
            if (isPullToRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await listConversations();
            const conversationList = Array.isArray(data) ? data : [];

            const auth = await getAuthContext();
            const userId = auth?.userId || "";
            if (userId) setCurrentUserId(userId);
            
            const talkedUsersOnly = conversationList;

            // Sort pinned conversations to the top
            talkedUsersOnly.sort((a, b) => {
                const aPinned = Array.isArray(a.pinnedBy) && a.pinnedBy.includes(userId) ? 1 : 0;
                const bPinned = Array.isArray(b.pinnedBy) && b.pinnedBy.includes(userId) ? 1 : 0;
                if (aPinned !== bPinned) return bPinned - aPinned;
                return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
            });

            setConversations(talkedUsersOnly);
        } catch (error) {
            Alert.alert("Chat Error", error.message || "Failed to load chats");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadConversations(false);

            const setupSocket = async () => {
                try {
                    const socket = await connectChatSocket();
                    socketRef.current = socket;

                    socket.on("conversation_updated", (payload) => {
                        if (!payload?.conversationId) return;

                        setConversations((previous) => {
                            const index = previous.findIndex((item) => item.id === payload.conversationId);
                            if (index === -1) {
                                loadConversations(false);
                                return previous;
                            }

                            const updated = [...previous];
                            updated[index] = {
                                ...updated[index],
                                lastMessageText: payload.lastMessageText || updated[index].lastMessageText,
                                lastMessageAt: payload.lastMessageAt || updated[index].lastMessageAt,
                                lastMessageAdId: payload.lastMessageAdId || updated[index].lastMessageAdId,
                                lastMessageAdTitle: payload.lastMessageAdTitle || updated[index].lastMessageAdTitle,
                                messagesCount: Number(updated[index].messagesCount || 0) + 1,
                            };

                            return updated.sort((a, b) => {
                                const aPinned = Array.isArray(a.pinnedBy) && a.pinnedBy.includes(currentUserId) ? 1 : 0;
                                const bPinned = Array.isArray(b.pinnedBy) && b.pinnedBy.includes(currentUserId) ? 1 : 0;
                                if (aPinned !== bPinned) return bPinned - aPinned;
                                return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                            });
                        });
                    });
                } catch (error) {
                    console.log("chat list socket connect failed", error.message);
                }
            };

            setupSocket();

            return () => {
                socketRef.current?.disconnect();
                socketRef.current = null;
            };
        }, [loadConversations]),
    );

const AVATAR_COLORS = ["#157a4f", "#e8b923", "#e8743b", "#c0392b", "#2c6fbb", "#7c4dbd", "#16a0a0"];

const getAvatarColor = (seed) => {
    const str = String(seed || "?");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

    const openConversation = (conversation) => {
        const pendingShare = shareAd;

        if (pendingShare) {
            navigation.setParams({ shareAd: null });
        }

        navigation.navigate("ChatScreen", {
            conversationId: conversation.id,
            conversation,
            shareAd: pendingShare,
        });
    };

    const formatTime = (timeValue) => {
        if (!timeValue) return "";
        const date = new Date(timeValue);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderConversationList = () => {
        if (loading) {
            return (
                <View style={styles.centerWrap}>
                    <ActivityIndicator size="large" color="#157a4f" />
                </View>
            );
        }

        if (conversations.length === 0) {
            return (
                <View style={styles.centerWrap}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>No chats yet</Text>
                    <Text style={[styles.emptySubText, { color: colors.text }]}>Start a chat from any ad</Text>
                </View>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={{ paddingBottom: 90 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadConversations(true)}
                    />
                }
            >
                {conversations.map((conversation) => (
                    <TouchableOpacity
                        key={conversation.id}
                        style={styles.chatCard}
                        onPress={() => openConversation(conversation)}
                    >
                        {conversation?.otherUser?.avatar ? (
                            <Image source={{ uri: conversation.otherUser.avatar }} style={styles.avatar} />
                        ) : (
                            <View
                                style={[
                                    styles.avatar,
                                    styles.avatarFallback,
                                    { backgroundColor: getAvatarColor(conversation?.otherUser?.name || conversation?.otherUser?.id || conversation.id) },
                                ]}
                            >
                                <Text style={styles.avatarInitial}>
                                    {(conversation?.otherUser?.name || "?").trim().charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={[styles.name, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                                    {conversation?.otherUser?.name || "Unknown User"}
                                </Text>
                            </View>
                            <Text style={[styles.message, { color: colors.text }]} numberOfLines={1}>
                                {conversation?.lastMessageText || "Tap to open chat"}
                            </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.time}>{formatTime(conversation?.lastMessageAt)}</Text>
                        </View>
                        {Array.isArray(conversation.pinnedBy) && conversation.pinnedBy.includes(currentUserId) && (
                            <Entypo name="pin" size={20} color="#f5b846ff" style={{ left: 5 }} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
              <LinearGradient
                    colors={["#f8a812", "#fad081", "#f8f6f265"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                />
                                <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("ChojaHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 20, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.2) }}>Chats</Text>
            </View>

            {shareAd && (
                <View style={styles.shareHintWrap}>
                    <Text style={styles.shareHintText}>
                        Select a chat to forward: {shareAd?.title || "this ad"}
                    </Text>
                </View>
            )}

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical:6 }} />

            {renderConversationList()}

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
                <ChojaBottom />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14
    },
    centerWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: "SemiBold",
        lineHeight: Math.round(18 * 1.5),
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 14,
        opacity: 0.8,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#e6e6e6",
    },
    shareHintWrap: {
        backgroundColor: "#f5b849",
        marginHorizontal: 12,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    shareHintText: {
        color: "#1e1e1e",
        fontFamily: "Medium",
        fontSize: 13,
        lineHeight: Math.round(13 * 1.5),
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    avatarFallback: {
        justifyContent: "center",
        alignItems: "center",
    },
    avatarInitial: {
        color: "#fff",
        fontSize: 20,
        fontFamily: "Medium",
        lineHeight:Math.round(20*1.5)
    },
    name: {
        fontSize: 16,
        fontFamily: "SemiBold",
        color: "#111",
        lineHeight: Math.round(16 * 1.2)
    },
    message: {
        fontSize: 13,
        color: "#777",
        lineHeight: Math.round(13 * 1.5),
        marginTop: 2,
        fontFamily: "Medium",
    },
    time: {
        fontSize: 12,
        color: "#999",
        lineHeight: Math.round(12 * 1.5),
        fontFamily: "Medium",
    },
})