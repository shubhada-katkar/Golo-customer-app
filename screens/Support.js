import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { textPresets } from '../theme/typography';

const TOPICS = [
    'General Inquiry',
    'Billing & Payments',
    'Technical Issue',
    'Report a Listing or User',
    'Feature Request',
];

export default function Support({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [userId, setUserId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('customerData');
                const storedId = await AsyncStorage.getItem('customerId');

                if (storedId) {
                    setUserId(storedId);
                }

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser) {
                        const name = parsedUser.name || parsedUser.fullName || parsedUser.username || '';
                        const userEmail = parsedUser.email || '';
                        if (name) setFullName(name);
                        if (userEmail) setEmail(userEmail);
                        if (parsedUser._id || parsedUser.id) {
                            setUserId(String(parsedUser._id || parsedUser.id));
                        }
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
            Alert.alert('Missing info', 'Please fill in your name, email, and topic.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
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

            Alert.alert('Request submitted', 'Our support team will get back to you soon.');
            setTopic('');
            setMessage('');
        } catch (err) {
            Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
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
                style={styles.headerGradient}
            />
            <Topbar />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={22} color="#000" style={{ padding: 10 }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support & Help</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.heroTitle}>How can we help you?</Text>
                <Text style={styles.heroSubtitle}>
                    Submit a request and our support team will get back to you as soon as possible.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.label}>
                        Full Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#a3a3a3"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <Text style={styles.label}>
                        Email Address <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        placeholderTextColor="#a3a3a3"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>
                        What do you need help with? <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={styles.dropdownField}
                        activeOpacity={0.8}
                        onPress={() => setDropdownOpen((prev) => !prev)}
                    >
                        <Text style={topic ? styles.dropdownValue : styles.dropdownPlaceholder}>
                            {topic || 'Select a topic'}
                        </Text>
                        <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
                    </TouchableOpacity>

                    {dropdownOpen && (
                        <View style={styles.dropdownList}>
                            {TOPICS.map((item, index) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.dropdownItem,
                                        index === TOPICS.length - 1 && { borderBottomWidth: 0 },
                                    ]}
                                    onPress={() => {
                                        setTopic(item);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item}</Text>
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
        justifyContent: 'space-between',
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
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
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
    dropdownField: {
        borderWidth: 1,
        borderColor: '#f9a641',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    dropdownPlaceholder: {
        color: '#a3a3a3',
        ...textPresets.body,
    },
    dropdownValue: {
        color: '#000',
        ...textPresets.body,
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: '#e2e2e2',
        borderRadius: 10,
        marginTop: 6,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        ...textPresets.body,
        color: '#333',
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
});