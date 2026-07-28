import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { textPresets } from '../theme/typography';
import CustomAlertModal from '../components/CustomeAlertModal';
import { getValidToken } from '../services/authService';

const TOPICS = [
    'Account Issue',
    'Payment Problem',
    'Deal Claim Query',
    'Technical Support',
    'Other',
];

export default function Support({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showTopicDropdown, setShowTopicDropdown] = useState(false);
    const [userId, setUserId] = useState(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error" });

    const showAlert = (title, message, type = "error") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('customerId');
                if (storedUserId) {
                    setUserId(storedUserId);
                }

                // Try to pre-fill profile for logged-in users; guests fill manually
                let token = null;
                try {
                    token = await getValidToken();
                } catch {
                    // Guest user — no token, skip profile prefill
                }
                if (token) {
                    const res = await fetch(`${BASE_URL}/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const json = await res.json();
                    if (res.ok && json.data) {
                        setFullName(json.data.name || '');
                        setEmail(json.data.email || '');
                    }
                }
            } catch (error) {
                console.log('Error loading customer data for support:', error);
            }
        };

        loadUserData();
    }, []);

    const handleSubmit = async () => {
        if (!fullName.trim() || !email.trim() || !topic) {
            showAlert('Missing info', 'Please fill in your name, email, and topic.', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            showAlert('Invalid Email', 'Please enter a valid email address.', 'warning');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                customerName: fullName.trim(),
                email: email.trim().toLowerCase(),
                issueType: topic,
                description: message.trim() || topic,
            };

            if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                payload.userId = userId;
            }

            const res = await fetch(`${BASE_URL}/support-tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorMsg = Array.isArray(data.message)
                    ? data.message.join(', ')
                    : (data.message || 'Failed to submit request');
                throw new Error(errorMsg);
            }

            showAlert('Request submitted', 'Our support team will get back to you soon.', 'success');
            setTopic('');
            setMessage('');
        } catch (err) {
            showAlert('Error', err.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#1f2937" />
                </TouchableOpacity>
                <Text style={{ ...textPresets.title }}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Submit a Request</Text>

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#a3a3a3"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#a3a3a3"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Select Topic</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowTopicDropdown(!showTopicDropdown)}
                        activeOpacity={0.8}
                    >
                        <Text style={topic ? styles.dropdownText : styles.dropdownPlaceholder}>
                            {topic || 'Choose a category...'}
                        </Text>
                        <Feather name={showTopicDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                    </TouchableOpacity>

                    {showTopicDropdown && (
                        <View style={styles.dropdownMenu}>
                            {TOPICS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setTopic(item);
                                        setShowTopicDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, topic === item && styles.selectedTopic]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us more about your request..."
                        placeholderTextColor="#a3a3a3"
                        multiline
                        numberOfLines={4}
                        value={message}
                        onChangeText={setMessage}
                    />

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Feather name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Submit Request</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={hideAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerGradient: {
        height: 220,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...textPresets.title,
    },
    headerBadge: {
        ...textPresets.label,
        color: '#8a5a00',
        backgroundColor: '#fff3d6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        zIndex: 1,
    },
    heroTitle: {
        ...textPresets.subtitle,
        textAlign: 'center',
        marginTop: 12,
    },
    heroSubtitle: {
        ...textPresets.label,
        textAlign: 'center',
        color: '#4a4a4a',
        marginTop: 6,
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    label: {
        ...textPresets.label,
        marginTop: 14,
        marginBottom: 6,
        color: '#222',
    },
    required: {
        color: '#e53935',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e2e2',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        ...textPresets.body,
        color: '#000',
        backgroundColor: '#fafafa',
    },
    textArea: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    dropdownMenu: {
        borderWidth: 1,
        borderColor: '#969696ff',
        borderRadius: 10,
        marginTop: 6,
        overflow: 'hidden',
    },
    dropdownPlaceholder: {
        color: '#a3a3a3',
        ...textPresets.body,
    },
    dropdownValue: {
        color: '#000',
        ...textPresets.body,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: '#b8b8b8ff',
    },
    dropdownItemText: {
        ...textPresets.body,
        color: '#333',
    },
    dropdownText: {
        ...textPresets.body,
        color: '#333',
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#969696ff',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#157a4f',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        ...textPresets.body,
        color: '#fff',
        lineHeight: Math.round(14 * 1.5)
    },
    sectionTitle: {
        ...textPresets.subtitle,
    }
});