import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    AppState,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { textPresets } from '../theme/typography';
import CustomAlertModal from './CustomeAlertModal';

const ASYNC_KEY_ACCUMULATED_TIME = '@golo_ratings_accumulated_seconds';
const DEFAULT_INTERVAL_MINUTES = 20;

export default function RatingsBox({
    visible: controlledVisible,
    onClose,
    onSubmit,
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
    enableTimer = true,
}) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [internalVisible, setInternalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error", onClose: null });

    const accumulatedSecondsRef = useRef(0);
    const isControlled = controlledVisible !== undefined;
    const targetSeconds = (intervalMinutes || DEFAULT_INTERVAL_MINUTES) * 60;

    useEffect(() => {
        if (isControlled || !enableTimer) return;

        let intervalId = null;

        const loadSavedTime = async () => {
            try {
                const saved = await AsyncStorage.getItem(ASYNC_KEY_ACCUMULATED_TIME);
                if (saved !== null) {
                    const parsed = parseInt(saved, 10);
                    if (!isNaN(parsed) && parsed >= 0) {
                        accumulatedSecondsRef.current = parsed;
                    }
                }
            } catch (err) {
                console.error("Error loading accumulated time:", err);
            }
        };

        const saveTime = async (seconds) => {
            try {
                await AsyncStorage.setItem(ASYNC_KEY_ACCUMULATED_TIME, String(seconds));
            } catch (err) {
                console.error("Error saving accumulated time:", err);
            }
        };

        const startTimer = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
                accumulatedSecondsRef.current += 1;

                if (accumulatedSecondsRef.current % 10 === 0) {
                    saveTime(accumulatedSecondsRef.current);
                }

                if (accumulatedSecondsRef.current >= targetSeconds) {
                    setInternalVisible(true);
                    accumulatedSecondsRef.current = 0;
                    saveTime(0);
                }
            }, 1000);
        };

        const stopTimer = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            saveTime(accumulatedSecondsRef.current);
        };

        loadSavedTime().then(() => {
            if (AppState.currentState === 'active') {
                startTimer();
            }
        });

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                startTimer();
            } else if (nextAppState.match(/inactive|background/)) {
                stopTimer();
            }
        });

        return () => {
            stopTimer();
            subscription?.remove();
        };
    }, [isControlled, enableTimer, targetSeconds]);

    const showAlert = (title, message, type = "error", extraProps = {}) => {
        setAlertConfig({ visible: true, title, message, type, onClose: null, ...extraProps });
    };

    const hideAlert = () => {
        if (alertConfig.onClose) {
            const cb = alertConfig.onClose;
            setAlertConfig({ visible: false, title: "", message: "", type: "error", onClose: null });
            cb();
        } else {
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }
    };

    const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

    const handleClose = () => {
        setInternalVisible(false);
        accumulatedSecondsRef.current = 0;
        AsyncStorage.setItem(ASYNC_KEY_ACCUMULATED_TIME, '0').catch(() => { });
        onClose?.();
    };

    const handleSubmit = async () => {
        if (rating < 1) {
            showAlert('Rating Required', 'Please select a star rating from 1 to 5.', 'warning');
            return;
        }

        if (!feedback.trim()) {
            showAlert('Feedback Required', 'Please write a brief feedback message.', 'warning');
            return;
        }

        try {
            setSubmitting(true);

            let userId = await AsyncStorage.getItem('customerId');
            if (!userId) {
                const storedUser = await AsyncStorage.getItem('customerData');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    userId = parsedUser?._id || parsedUser?.id || null;
                }
            }

            const payload = {
                rating,
                content: feedback.trim(),
                source: 'app',
            };

            if (userId && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
                payload.userId = String(userId);
            }

            const res = await fetch(`${BASE_URL}/reviews/platform`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorMsg = Array.isArray(data.message)
                    ? data.message.join(', ')
                    : (data.message || 'Failed to submit feedback');
                throw new Error(errorMsg);
            }

            showAlert('Thank You!', 'Your feedback has been submitted to our team.', 'success', {
                onClose: () => {
                    onSubmit?.({ rating, feedback, data });
                    setRating(0);
                    setFeedback('');
                    setInternalVisible(false);
                    accumulatedSecondsRef.current = 0;
                    AsyncStorage.setItem(ASYNC_KEY_ACCUMULATED_TIME, '0').catch(() => { });
                    onClose?.();
                }
            });
        } catch (err) {
            showAlert('Error', err.message || 'Failed to submit feedback. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Feather name="x" size={20} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.title}>How are we doing?</Text>
                    <Text style={styles.subtitle}>
                        We'd love to hear about your overall experience with GOLO.{'\n'}
                        Your feedback helps us improve!
                    </Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <MaterialIcons
                                    name={star <= rating ? 'star' : 'star-border'}
                                    size={32}
                                    color={star <= rating ? '#f9a641' : '#c9c9c9'}
                                    style={{ marginHorizontal: 4 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.tellUsMore}>Tell us more</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="What do you love? What could be better?"
                        placeholderTextColor="#a3a3a3"
                        multiline
                        numberOfLines={4}
                        value={feedback}
                        onChangeText={setFeedback}
                    />

                    <TouchableOpacity
                        style={styles.submitButton}
                        activeOpacity={0.85}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={hideAlert}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fdf8ee',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 1,
        padding: 4,
    },
    title: {
        ...textPresets.title,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        ...textPresets.caption,
        textAlign: 'center',
        color: '#555',
        marginBottom: 18,
    },
    starsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tellUsMore: {
        ...textPresets.label,
        alignSelf: 'flex-start',
        color: '#222',
        marginBottom: 8,
    },
    textArea: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e2e2e2',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 90,
        textAlignVertical: 'top',
        color: '#000',
        backgroundColor: '#fff',
        marginBottom: 20,
        ...textPresets.label
    },
    submitButton: {
        width: '100%',
        backgroundColor: '#157a4f',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonText: {
        ...textPresets.label,
        color: '#fff',
    },
});