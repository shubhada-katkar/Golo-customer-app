import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Voice from "@react-native-voice/voice";

export default function VoiceSearchButton({ onResult, color = "#555", activeColor = "#157a4f", size = 21 }) {
    const [isListening, setIsListening] = useState(false);
    const hasResultRef = useRef(false);
    const voiceAvailable = Boolean(Voice && typeof Voice.start === "function");

    useEffect(() => {
        if (!voiceAvailable) {
            return;
        }

        Voice.onSpeechStart = () => {
            hasResultRef.current = false;
            setIsListening(true);
        };

        Voice.onSpeechEnd = () => {
            setIsListening(false);
        };

        Voice.onSpeechResults = (event) => {
            const spokenText = event?.value?.[0]?.trim();
            if (spokenText) {
                hasResultRef.current = true;
                onResult(spokenText);
            }
        };

        Voice.onSpeechPartialResults = (event) => {
            const spokenText = event?.value?.[0]?.trim();
            if (spokenText && !hasResultRef.current) {
                onResult(spokenText);
            }
        };

        Voice.onSpeechError = (event) => {
            setIsListening(false);
            const message = event?.error?.message || "Please try speaking again.";
            Alert.alert("Voice search", message);
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, [onResult]);

    const toggleListening = async () => {
        try {
            if (!voiceAvailable) {
                Alert.alert("Voice search", "Voice recognition not available on this device.");
                return;
            }

            if (isListening) {
                await Voice.stop();
                setIsListening(false);
                return;
            }

            hasResultRef.current = false;
            const locale = Platform.OS === "ios" ? "en-US" : "en-US";
            await Voice.start(locale);
        } catch (error) {
            setIsListening(false);
            Alert.alert("Voice search", error?.message || "Voice search is not available right now.");
        }
    };

    return (
        <TouchableOpacity
            onPress={toggleListening}
            style={[styles.button, isListening && styles.activeButton]}
            accessibilityRole="button"
            accessibilityLabel={isListening ? "Stop voice search" : "Start voice search"}
            activeOpacity={0.75}
        >
            {isListening ? (
                <ActivityIndicator size="small" color={activeColor} />
            ) : (
                <Ionicons name="mic-outline" size={size} color={color} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    activeButton: {
        backgroundColor: "#e7f4ee",
    },
});
