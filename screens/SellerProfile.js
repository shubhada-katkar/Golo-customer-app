import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { submitReport } from '../services/reportService';
import { BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function SellerProfile({ route, navigation }) {
  const { sellerId, adId, adTitle, adImage } = route.params || {};
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        if (!sellerId) {
          Alert.alert('Error', 'Seller ID is missing');
          navigation.goBack();
          return;
        }

        const res = await fetch(`${BASE_URL}/users/${sellerId}`);
        const json = await res.json();

        if (json.success && json.data) {
          setSeller(json.data);
        } else {
          Alert.alert('Error', json.message || 'Failed to load seller details');
          navigation.goBack();
        }
      } catch (err) {
        console.error('Error fetching seller details:', err);
        Alert.alert('Error', 'Unable to fetch seller details at this time.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, BASE_URL]);

  const handleCall = () => {
    const phone = seller?.profile?.phone;
    if (!phone) {
      Alert.alert("Error", "No phone number available for this seller.");
      return;
    }
    const cleanedNumber = String(phone).replace('+91', '');
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const handleOpenChat = () => {
    navigation.navigate('ChatScreen', {
      adId: adId || 'general',
      sellerId: seller?.id || sellerId,
      sellerName: seller?.name || 'Seller',
      adRef: adId ? {
        adId: adId,
        title: adTitle || 'Ad',
        image: adImage || null,
      } : null,
    });
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason");
      return;
    }

    try {
      await submitReport('SELLER', sellerId, selectedReason, details);
      
      Alert.alert("Thank You", "Profile has been reported and sent for review.", [
        { text: 'OK', onPress: () => {
          setShowReportModal(false);
          setSelectedReason(null);
          setDetails("");
        }}
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit report. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9a641', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!seller) return null;

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#f9a641', '#f5b849', '#ffffff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back-ios" size={26} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Seller Profile</Text>
            <TouchableOpacity onPress={() => setShowReportModal(true)}>
              <Ionicons name="flag-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarWrapper}>
                {seller?.profile?.avatar ? (
                  <Image source={{ uri: seller.profile.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle" size={100} color="#157a4f" style={styles.fallbackAvatar} />
                )}
              </View>

              <Text style={styles.sellerName}>{seller?.name || "Anonymous User"}</Text>

              <View style={styles.memberSinceContainer}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.memberSinceText}>
                  Member since {seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                </Text>
              </View>

              {/* Bio Section */}
              {seller?.profile?.bio && (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>"{seller.profile.bio}"</Text>
                </View>
              )}

              {/* Location */}
              {(seller?.profile?.city || seller?.profile?.state) && (
                <View style={[styles.infoRow, { marginTop: 15 }]}>
                  <Ionicons name="location" size={20} color="#157a4f" />
                  <Text style={styles.infoText}>
                    {[seller?.profile?.city, seller?.profile?.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions Card */}
            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Contact Seller</Text>

              <TouchableOpacity style={styles.chatButtonLarge} onPress={handleOpenChat}>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Start Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callButtonLarge, !seller?.profile?.phone && { backgroundColor: '#ccc' }]}
                onPress={handleCall}
                disabled={!seller?.profile?.phone}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callButtonText}>
                  {seller?.profile?.phone ? `Call ${seller.profile.phone}` : "Phone Not Provided"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report Profile</Text>
                <TouchableOpacity onPress={() => setShowReportModal(false)}>
                  <Ionicons name="close" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Please tell us why you are reporting this seller. Your report will be kept anonymous.</Text>

              {[
                "Suspicious behavior",
                "Offensive or abusive language",
                "Spam or scam attempt",
                "Posting deceptive ads",
                "Other",
              ].map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.option}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={{
                    fontSize: 14, fontFamily: "Medium",
                    lineHeight: Math.round(14 * 1.5)
                  }}>{reason}</Text>
                  <View style={[
                    styles.radio,
                    selectedReason === reason && styles.radioSelected
                  ]} />
                </TouchableOpacity>
              ))}

              <Text style={{
                fontSize: 14, fontFamily: "SemiBold", marginTop: 20, marginBottom: 10,
                lineHeight: Math.round(14 * 1.5)
              }}>Additional Details</Text>
              <TextInput
                placeholder="Optional information..."
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={500}
                style={styles.textArea}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReportModal(false)}>
                  <Text style={styles.btnTextConfig}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.submitBtn, !selectedReason && { backgroundColor: '#ccc' }]} onPress={handleSubmitReport} disabled={!selectedReason}>
                  <Text style={[styles.btnTextConfig, { color: '#fff' }]}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Bold',
    color: '#000',
    lineHeight: Math.round(20 * 1.5)
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  avatarWrapper: {
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderRadius: 60,
    backgroundColor: '#fff',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#f5b849',
  },
  fallbackAvatar: {
    margin: -10,
  },
  sellerName: {
    fontSize: 24,
    fontFamily: 'SemiBold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: Math.round(24 * 1.5)
  },
  memberSinceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSinceText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Medium',
    lineHeight: Math.round(13 * 1.5)
  },
  bioContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Italic',
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Math.round(14 * 1.5)
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Medium',
    color: '#444',
    lineHeight: Math.round(16 * 1.5)
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    color: '#333',
    marginBottom: 16,
    lineHeight: Math.round(16 * 1.5)
  },
  chatButtonLarge: {
    backgroundColor: '#157a4f',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SemiBold',
    lineHeight: Math.round(14 * 1.5)
  },
  callButtonLarge: {
    backgroundColor: '#f9a641',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SemiBold',
    lineHeight: Math.round(14 * 1.5)
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#f8f8f8ff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "SemiBold",
    lineHeight: Math.round(20 * 1.5)
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: "Medium",
    color: "#666",
    marginBottom: 20,
    lineHeight: Math.round(12 * 1.5)
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9e9e9eff',
  },
  radioSelected: {
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#9e9e9eff',
    borderRadius: 10,
    padding: 12,
    height: 100,
    fontFamily: "Medium",
    marginBottom: 20,
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
  },
  btnTextConfig: {
    fontFamily: "SemiBold",
    fontSize: 16,
    lineHeight: Math.round(16 * 1.5)
  }
});