import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { textPresets } from '../theme/typography';

export default function RatingsBox({
    visible: controlledVisible,
    onClose,
    onSubmit,
}) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [internalVisible, setInternalVisible] = useState(false);

    const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

    const handleClose = () => {
        setInternalVisible(false);
        onClose?.();
    };

    const handleSubmit = async () => {
        if (rating < 1) {
            Alert.alert('Rating Required', 'Please select a star rating from 1 to 5.');
            return;
        }

        if (!feedback.trim()) {
            Alert.alert('Feedback Required', 'Please write a brief feedback message.');
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
                source: 'website',
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

            Alert.alert('Thank You!', 'Your feedback has been submitted to our team.');
            onSubmit?.({ rating, feedback, data });
            setRating(0);
            setFeedback('');
            setInternalVisible(false);
            onClose?.();
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to submit feedback. Please try again.');
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
        fontWeight: '600',
    },
});