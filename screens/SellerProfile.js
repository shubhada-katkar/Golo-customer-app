import React, { useState, useEffect, useContext } from 'react';
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
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { submitReport } from '../services/reportService';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { ThemeContext } from '../theme/ThemeContext';
import { ensureAuthenticated } from '../services/authService';
import { textPresets } from '../theme/typography';

// Fixed-size ad card that deliberately avoids FlatList/VirtualizedList internally
// so it is safe to render inside a plain ScrollView without the nested-list warning.
const AD_CARD_WIDTH = 220;
const AD_CARD_HEIGHT = 260;

function SellerAdCard({ ad, navigation }) {
  const coverImage = ad?.images?.[0] || null;
  const title = ad?.title || 'Ad';
  const price = ad?.price ? `₹${ad.price}` : '';
  const description = ad?.description || '';
  const location = ad?.location || ad?.city || '';
  const adId = ad?.adId || ad?._id;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={sellerAdStyles.card}
      onPress={() => navigation.navigate('AdDetails', { adId })}
    >
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={sellerAdStyles.image} resizeMode="cover" />
      ) : (
        <View style={sellerAdStyles.imagePlaceholder}>
          {/* <Ionicons name="image-outline" size={32} color="#bbb" /> */}
          <Text style={sellerAdStyles.noImageText}>Text Only Ad</Text>
        </View>
      )}
      <View style={sellerAdStyles.info}>
        <Text style={sellerAdStyles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        {!!description && <Text style={sellerAdStyles.description} numberOfLines={1} ellipsizeMode="tail">{description}</Text>}
        {!!location && (
          <View style={sellerAdStyles.locationRow}>
            <Entypo name="location-pin" size={13} color="#d62c2c" />
            <Text style={sellerAdStyles.locationText} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
          </View>
        )}
        {!!price && <Text style={sellerAdStyles.price}>{price}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const sellerAdStyles = StyleSheet.create({
  card: {
    width: AD_CARD_WIDTH,
    height: AD_CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: AD_CARD_WIDTH,
    height: 150,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: AD_CARD_WIDTH,
    height: 150,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    ...textPresets.label,
    color: '#555',
    textAlign: 'center',
  },
  info: {
    flex: 1,
    padding: 10,
  },
  title: {
    ...textPresets.body,
    color: '#222',
    lineHeight: Math.round(14 * 1.4),
    marginBottom: 4,
  },
  description: {
    color: '#555',
    marginBottom: 4,
    ...textPresets.label,
  },
  price: {
    ...textPresets.body,
    color: '#157a4f',
    lineHeight: Math.round(14 * 1.4),
    marginBottom: 4,
    alignSelf: "flex-end"
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  locationText: {
    color: '#555',
    flex: 1,
    ...textPresets.label,
  },
});

const { width } = Dimensions.get('window');

const SELLER_REPORT_REASONS = [
  { label: 'Harassment', value: 'harassment' },
  { label: 'Abuse', value: 'abuse' },
  { label: 'Fraud', value: 'fraud' },
  { label: 'Scam', value: 'scam' },
  { label: 'Fake Account', value: 'fake_account' },
  { label: 'Spam', value: 'spam' },
  { label: 'Other', value: 'other' },
];

export default function SellerProfile({ route, navigation }) {
  const { sellerId, adId, adTitle, adImage } = route.params || {};
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState("");
  const { colors } = useContext(ThemeContext);

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

    const fetchSellerAds = async () => {
      try {
        const res = await fetch(`${BASE_URL}/ads/user/${sellerId}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const filtered = json.data.filter(item => (item.adId || item._id || item.id) !== adId);
          setAds(filtered);
        }
      } catch (err) {
        console.error('Error fetching seller ads:', err);
      } finally {
        setAdsLoading(false);
      }
    };

    fetchSellerData();
    fetchSellerAds();
  }, [sellerId, adId, BASE_URL]);

  const handleCall = async () => {
    const phone = seller?.profile?.phone;
    if (!phone) {
      Alert.alert("Error", "No phone number available for this seller.");
      return;
    }

    try {
      await ensureAuthenticated(navigation);
    } catch {
      return;
    }

    const cleanedNumber = String(phone).replace('+91', '');
    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const handleOpenChat = async () => {
    try {
      await ensureAuthenticated(navigation);
    } catch {
      return;
    }

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
        {
          text: 'OK', onPress: () => {
            setShowReportModal(false);
            setSelectedReason(null);
            setDetails("");
          }
        }
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
          colors={["#f8a812", "#fad081", "#f8f6f265"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
        />
        <Topbar />
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back-ios" size={22} color="#000"
                style={{ padding: 10 }} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Seller Profile</Text>
          </View>
          <TouchableOpacity onPress={() => setShowReportModal(true)}>
            <Ionicons name="flag-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: "#000000", height: 1, marginVertical: 6 }} />

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

          {/* Other Ads Section */}
          <View style={styles.otherAdsSection}>
            <Text style={styles.otherAdsTitle}>Other Ads Posted by Seller</Text>
            {adsLoading ? (
              <ActivityIndicator size="small" color="#157a4f" style={{ marginVertical: 20 }} />
            ) : ads.length === 0 ? (
              <Text style={styles.noAdsText}>No other ads posted by this seller.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalAdsList}
                nestedScrollEnabled={false}
              >
                {ads.map((item, index) => (
                  <SellerAdCard
                    key={`${item._id || item.adId}-${index}`}
                    ad={item}
                    navigation={navigation}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
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

              {SELLER_REPORT_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.option}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Text style={{
                    ...textPresets.body,
                    lineHeight: Math.round(14 * 1.5)
                  }}>{reason.label}</Text>
                  <View style={[
                    styles.radio,
                    selectedReason === reason.value && styles.radioSelected
                  ]} />
                </TouchableOpacity>
              ))}

              <Text style={{
                ...textPresets.body, marginTop: 20, marginBottom: 10,
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
    paddingVertical: 10,
  },
  headerTitle: {
    ...textPresets.title
  },
  scrollContent: {
    paddingBottom: 10,
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
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
    ...textPresets.title
  },
  memberSinceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSinceText: {
    color: '#666',
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },
  bioContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  bioText: {
    color: '#555',
    textAlign: 'center',
    ...textPresets.body
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#444',
    ...textPresets.subtitle
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
    color: '#333',
    marginBottom: 16,
    ...textPresets.subtitle
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
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
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
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
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
    ...textPresets.subtitle
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 20,
    ...textPresets.label
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
    marginBottom: 20,
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
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
    ...textPresets.subtitle,

  },
  otherAdsSection: {
    marginTop: 16,
    paddingBottom: 20,
  },
  otherAdsTitle: {
    color: '#333',
    marginBottom: 12,
    marginLeft: 16,
    ...textPresets.subtitle
  },
  horizontalAdsList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  noAdsText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
});