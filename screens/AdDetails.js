import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
  Dimensions, Share, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from '../services/favoritesService';
import { trackAdCardClick, trackContactClick, trackWishlistSave } from '../services/analyticsService';
import { submitReport } from '../services/reportService';
import { ensureAuthenticated } from '../services/authService';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { textPresets } from '../theme/typography';
import CustomAlertModal from '../components/CustomeAlertModal';

const { width, height } = Dimensions.get('window');

const REPORT_REASONS = [
  { label: 'Spam or Misleading', value: 'spam' },
  { label: 'Inappropriate Content', value: 'inappropriate' },
  { label: 'Fraud or Scam', value: 'fraud' },
  { label: 'Duplicate Posting', value: 'duplicate' },
  { label: 'Other', value: 'other' },
];

const COMMON_AD_KEYS = new Set([
  '_id',
  'adId',
  'title',
  'description',
  'category',
  'subCategory',
  'images',
  'videos',
  'price',
  'negotiable',
  'location',
  'city',
  'state',
  'pincode',
  'contactInfo',
  'userId',
  'userType',
  'viewCount',
  'views',
  'wishlistSaves',
  'cardClicks',
  'contactClicks',
  'uniqueVisitors',
  'status',
  'createdAt',
  'updatedAt',
  'selectedDates',
  'cities',
  'templateId',
  'language',
  'primaryContact',
  'metadata',
  'tags',
  'expiryDate',
  'isPromoted',
  'promotedUntil',
  'promotionPackage',
  'categorySpecificData',
]);

const CATEGORY_DATA_FIELD_BY_LABEL = {
  Vehicle: 'vehicleData',
  Property: 'propertyData',
  Service: 'serviceData',
  Mobiles: 'mobileData',
  'Electronics & Home appliances': 'electronicsData',
  Furniture: 'furnitureData',
  Education: 'educationData',
  Pets: 'petsData',
  Matrimonial: 'matrimonialData',
  Business: 'businessData',
  Travel: 'travelData',
  Astrology: 'astrologyData',
  Employment: 'employmentData',
  'Lost & Found': 'lostFoundData',
  Personal: 'personalData',
  Greetings: 'greetingsData',
  Others: 'otherData',
  'Public Notice': 'publicNoticeData',
};

function prettifyKey(key = '') {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatDetailValue(value) {
  if (value == null) return null;

  if (Array.isArray(value)) {
    const filtered = value.filter((item) => item != null && String(item).trim() !== '');
    return filtered.length ? filtered.join(', ') : null;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    const compactEntries = Object.entries(value).filter(([, v]) => {
      if (v == null) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });

    if (!compactEntries.length) return null;
    return compactEntries
      .map(([k, v]) => `${prettifyKey(k)}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .join(' | ');
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function getCategoryDetails(adData) {
  if (!adData) return [];

  const categoryField = CATEGORY_DATA_FIELD_BY_LABEL[adData.category] || null;
  const explicitCategoryData = categoryField ? adData?.[categoryField] : null;
  const source = adData?.categorySpecificData || explicitCategoryData || {};

  const sourceEntries = Object.entries(source).filter(([, value]) => formatDetailValue(value) !== null);

  if (sourceEntries.length > 0) {
    return sourceEntries.map(([key, value]) => ({
      label: prettifyKey(key),
      value: formatDetailValue(value),
    }));
  }

  return Object.entries(adData)
    .filter(([key, value]) => !COMMON_AD_KEYS.has(key) && formatDetailValue(value) !== null)
    .map(([key, value]) => ({
      label: prettifyKey(key),
      value: formatDetailValue(value),
    }));
}

function getCommonAdDetails(adData) {
  if (!adData) return [];

  const details = [
    { label: 'Cities', value: adData.cities },

    { label: 'Posted On', value: adData.createdAt ? new Date(adData.createdAt).toLocaleDateString() : null },
    { label: 'Expires On', value: adData.expiryDate ? new Date(adData.expiryDate).toLocaleDateString() : null },
  ];

  return details
    .filter((item) => formatDetailValue(item.value) !== null)
    .map((item) => ({
      ...item,
      value: formatDetailValue(item.value),
    }));
}

export default function AdDetails({ route, navigation }) {
  const routeAdId = route?.params?.adId || route?.params?.id || route?.params?.ad?.adId || route?.params?.ad?._id || "";
  const { adId } = route.params || {};
  const resolvedAdId = routeAdId || adId || "";
  const [ad, setAd] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const sliderRef = useRef(null);

  const commonAdDetails = getCommonAdDetails(ad);
  const categoryDetails = getCategoryDetails(ad);
  const hasDetails = commonAdDetails.length > 0 || categoryDetails.length > 0;
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "error", onClose: null });

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

  const sellerName = seller?.name || ad?.sellerName || ad?.user?.name || ad?.contactInfo?.name || ad?.contactInfo?.sellerName || 'Seller';
  const sellerPhone = seller?.profile?.phone || ad?.contactInfo?.phone || '';
  const sellerAvatar = seller?.profile?.avatar || null;

  const handleOpenChat = async () => {
    const currentAdId = ad?.adId || ad?._id || resolvedAdId || adId;
    if (currentAdId) {
      console.log('[AdDetails] Tracking contact click for ad:', currentAdId);
      trackContactClick(currentAdId).catch((error) => {
        console.warn('[AdDetails] Failed to track contact click:', error.message);
      });
    }

    try {
      await ensureAuthenticated(navigation);
    } catch {
      return;
    }

    const resolvedSellerId = ad?.userId || ad?.user?.id || ad?.user?._id || seller?._id || seller?.id;

    navigation.navigate('ChatScreen', {
      adId: currentAdId,
      sellerId: resolvedSellerId,
      sellerName,
      adRef: {
        adId: currentAdId,
        title: ad?.title || 'Ad',
        image: ad?.images?.[0] || null,
      },
    });
  };

  const handleCall = async (phone) => {
    if (!phone) return;

    try {
      await ensureAuthenticated(navigation);
    } catch {
      return;
    }

    // Remove +91 if present
    const cleanedNumber = phone.replace('+91', '');

    const currentAdId = ad?.adId || ad?._id || adId;
    if (currentAdId) {
      console.log('[AdDetails] Tracking contact click for ad:', currentAdId);
      trackContactClick(currentAdId);
    }

    Linking.openURL(`tel:${cleanedNumber}`);
  };


  useEffect(() => {
    const fetchAdDetails = async () => {
      try {
        if (!resolvedAdId) {
          showAlert('Error', 'Ad ID not found', 'error', { onClose: () => { navigation.goBack(); } });
          return;
        }

        const res = await fetch(`${BASE_URL}/ads/${resolvedAdId}`);
        const json = await res.json();

        if (json.success && json.data) {
          setAd(json.data);
          // Use the same adId extraction logic as other handlers
          const currentAdId = json.data?.adId || json.data?._id || resolvedAdId;
          if (route?.params?.skipCardTrack !== true) {
            console.log('[AdDetails] Tracking card click for ad:', currentAdId);
            trackAdCardClick(currentAdId);
          }

          const sellerId = json.data?.userId || json.data?.user?.id;
          if (sellerId) {
            try {
              const sellerRes = await fetch(`${BASE_URL}/users/${encodeURIComponent(sellerId)}`);
              const sellerJson = await sellerRes.json();
              if (sellerJson.success && sellerJson.data) {
                setSeller(sellerJson.data);
              }
            } catch (sellerErr) {
              console.warn('[AdDetails] Failed to fetch seller info:', sellerErr.message);
            }
          }

        } else {
          showAlert('Error', json.message || 'Failed to load ad details', 'error', { onClose: () => { navigation.goBack(); } });
        }
      } catch (err) {
        console.error('Error fetching ad details:', err);
        showAlert('Error', 'Failed to load ad details', 'error', { onClose: () => { navigation.goBack(); } });
      } finally {
        setLoading(false);
      }
    };

    fetchAdDetails();
  }, [adId, BASE_URL]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      const currentAdId = getAdId(ad) || resolvedAdId;
      if (!currentAdId) return;
      const value = await isFavoriteAdId(currentAdId);
      setIsFavorite(value);
    };

    loadFavoriteState();
  }, [ad, adId]);

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const payload = ad
        ? {
          ...ad,
          adId: ad?.adId || ad?._id || resolvedAdId,
          images: ad?.images || [],
        }
        : { adId: resolvedAdId };

      const result = await toggleFavoriteAd(payload);
      setIsFavorite(result.isFavorite);

      if (result.isFavorite) {
        const currentAdId = ad?.adId || ad?._id || resolvedAdId;
        console.log('[AdDetails] Tracking wishlist save for ad:', currentAdId);
        trackWishlistSave(currentAdId);
      }
    } catch (error) {
      showAlert('Favorite Error', error.message || 'Failed to update favorites', 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShareInChat = () => {
    navigation.navigate('ChatPage', {
      shareAd: {
        adId: ad?.adId || ad?._id || adId,
        _id: ad?._id,
        title: ad?.title,
        description: ad?.description,
        price: ad?.price,
        image: ad?.images?.[0] || null,
      },
    });
  };

  const handleShareExternally = async () => {
    try {
      const resolvedShareAdId = ad?.adId || ad?._id || resolvedAdId;
      if (!resolvedShareAdId) {
        showAlert('Share Error', 'Ad details are not available yet', 'error');
        return;
      }

      const getAbsoluteImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("data:")) {
          return null;
        }
        if (url.startsWith("http://") || url.startsWith("https://")) {
          return url;
        }
        const baseUrlClean = BASE_URL.replace(/\/+$/, "");
        const urlClean = url.startsWith("/") ? url : `/${url}`;
        return `${baseUrlClean}${urlClean}`;
      };

      const websiteUrl = `https://golo-frontend-inky.vercel.app/product/${encodeURIComponent(resolvedShareAdId)}`;

      const firstImage = ad?.images?.[0] || null;
      const absoluteImage = getAbsoluteImageUrl(firstImage);

      const messageLines = [
        `${ad?.title || 'Ad'}`,
        ad?.description ? `Details: ${ad.description}` : null,
        `${websiteUrl}`,
      ].filter(Boolean);

      const message = messageLines.join('\n');

      await Share.share({
        message,
        url: websiteUrl,
        title: ad?.title || 'Shared Ad',
      });
    } catch (error) {
      showAlert('Share Error', error?.message || 'Unable to share this ad right now', 'error');
    }
  };

  const handleShare = () => {
    handleShareExternally();
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      showAlert('Error', 'Please select a reason before submitting.', 'warning');
      return;
    }
    const currentAdId = ad?.adId || ad?._id || adId;
    if (!currentAdId) {
      showAlert('Error', 'Ad ID is missing.', 'error');
      return;
    }
    try {
      await submitReport('AD', currentAdId, selectedReason, details);
      showAlert('Success', 'Ad reported successfully. Thank you for your feedback.', 'success', {
        onClose: () => {
          setShowReportModal(false);
          setSelectedReason(null);
          setDetails('');
        }
      });
    } catch (err) {
      showAlert('Error', err.message || 'Failed to submit report. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#157a4f" />
      </SafeAreaView>
    );
  }

  if (!ad) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ ...textPresets.label }}>Ad not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={{ color: '#fff', ...textPresets.label }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
              <MaterialIcons name="arrow-back-ios" size={22} style={{ padding: 10 }} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ad Details</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleToggleFavorite} disabled={favoriteLoading}>
              {favoriteLoading ? (
                <ActivityIndicator size="small" color="#e74c3c" />
              ) : (
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#e74c3c' : '#111'} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-social" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 1, marginVertical: 6, backgroundColor: "#000" }} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Carousel */}
          {ad.images && ad.images.length > 0 ? (
            <View style={styles.imageContainer}>
              <ScrollView
                ref={sliderRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={true}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImageIndex(index);
                }}
              >
                {ad.images.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.adImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Image Counter */}
              {ad.images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {activeImageIndex + 1} / {ad.images.length}
                  </Text>
                </View>
              )}
            </View>
          ) : Number(ad?.templateId || 0) !== 3 ? (
            <View style={[styles.adImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={40} color="#999" />
            </View>
          ) : null}

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Title & Price */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>{ad.title}</Text>
              {ad.price ? (
                <Text style={styles.price}>₹{ad.price}</Text>
              ) : (
                <Text style={styles.price}>Contact for more details</Text>
              )}
            </View>

            <View style={styles.categoryRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Category : {ad.category}</Text>
              </View>
            </View>

            <View style={styles.categoryRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#146e47ff" />
                <Text style={[styles.metaText, { color: "#146e47ff" }]}>{ad.location || ad.city || 'N/A'}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={{ marginVertical: 12 }}>
              <Text style={styles.sectionTitle}>Ad Description</Text>
              <Text style={styles.description}>{ad.description}</Text>
            </View>

            {/* Details */}
            <Text style={styles.sectionTitle}>Details</Text>
            {hasDetails ? (
              <>
                {commonAdDetails.map((item, index) => (
                  <View style={styles.detailRow} key={`common-${item.label}-${index}`}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}

                {categoryDetails.map((item, index) => (
                  <View style={styles.detailRow} key={`category-${item.label}-${index}`}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.description}>No additional details available for this ad.</Text>
            )}

            {/* Seller Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller Information</Text>
              <TouchableOpacity
                style={styles.sellerInfo}
                onPress={() => {
                  const sellerId = ad?.userId || ad?.user?.id;
                  if (sellerId) {
                    navigation.navigate('SellerProfile', {
                      sellerId,
                      adId: ad?.adId || ad?._id || adId,
                      adTitle: ad?.title || 'Ad',
                      adImage: ad?.images?.[0] || null,
                    });
                  } else {
                    showAlert('Info', 'Seller ID is missing for this ad', 'info');
                  }
                }}
              >
                <View style={styles.sellerAvatar}>
                  {sellerAvatar ? (
                    <Image source={{ uri: sellerAvatar }} style={styles.sellerAvatarImage} />
                  ) : (
                    <Ionicons name="person-circle" size={48} color="#157a4f" />
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{sellerName || 'Anonymous'}</Text>
                  {(sellerPhone || ad.contactInfo?.phone) && (
                    <TouchableOpacity
                      onPress={() => {
                        handleCall(sellerPhone || ad.contactInfo?.phone);
                      }}
                      style={styles.callBtn}
                    >
                      <Text style={{
                        color: "#ffffff", ...textPresets.label
                      }}>{sellerPhone || ad.contactInfo?.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            </View>

          </View>

          {/* Action Buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.chatButtonLarge} onPress={handleOpenChat}>
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callButtonLarge}
              onPress={() => handleCall(ad.contactInfo?.phone)}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.reportButton} onPress={() => setShowReportModal(true)}>
            <Ionicons name="flag-outline" size={22} color="#ffffff" />
            <Text style={styles.reportButtonText}>Report this Ad</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>

      <Modal visible={showReportModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled">

              <Text style={styles.modalTitle}>Report This Ad</Text>
              <Text style={styles.modalSubtitle}>Help us review suspicious listings.</Text>
              <Text style={{ ...textPresets.body, lineHeight: Math.round(14 * 1.5) }}>Why are you reporting this ad?</Text>

              {REPORT_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.option}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Text style={{ ...textPresets.label }}>{reason.label}</Text>
                  <View style={[
                    styles.radio,
                    selectedReason === reason.value && styles.radioSelected
                  ]} />
                </TouchableOpacity>
              ))}

              <Text style={{ marginTop: 20, ...textPresets.body, lineHeight: Math.round(14 * 1.5) }}>Additional Details (Optional)</Text>

              <TextInput
                placeholder="Please provide more details..."
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={500}
                style={styles.textArea}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowReportModal(false)}
                >
                  <Text style={{
                    lineHeight: Math.round(14 * 1.2), ...textPresets.body
                  }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, !selectedReason && { backgroundColor: '#ccc' }]}
                  onPress={handleSubmitReport}
                  disabled={!selectedReason}
                >
                  <Text style={{
                    lineHeight: Math.round(14 * 1.2), ...textPresets.body
                  }}>Submit Report</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>

          </View>
        </View>
      </Modal>
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  headerTitle: {
    ...textPresets.title
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
  },
  adImage: {
    width: width,
    height: height * 0.35,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  imageCounterText: {
    color: '#fff',
    ...textPresets.label,
  },
  contentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 16,
    marginBottom: 30,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    ...textPresets.subtitle
  },
  price: {
    ...textPresets.label,
    color: '#157a4f',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  badge: {
    backgroundColor: '#f5b849',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    ...textPresets.label,
    color: '#fff',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...textPresets.label,
  },
  section: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    marginBottom: 10,
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },
  description: {
    ...textPresets.body,
    color: '#555',
    lineHeight: Math.round(14 * 1.5)
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    ...textPresets.body,
    marginBottom: 6,
    lineHeight: Math.round(14 * 1.5)
  },
  callBtn: {
    backgroundColor: '#157a4f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  callBtnText: {
    color: '#fff',
    ...textPresets.label,
  },
  detailRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailLabel: {
    ...textPresets.body,
    color: '#808080',
    lineHeight: Math.round(14 * 1.5),
    textAlign: 'left',
    marginBottom: 4,
  },
  detailValue: {
    ...textPresets.body,
    color: '#333',
    lineHeight: Math.round(14 * 1.5),
    textAlign: 'left',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10
  },
  chatButtonLarge: {
    backgroundColor: '#f5b849',
    paddingVertical: 14,
    width: "48%",
    borderRadius: 10,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  callButtonLarge: {
    backgroundColor: '#157a4f',
    paddingVertical: 14,
    width: "48%",
    borderRadius: 10,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#fff',
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#157a4f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    ...textPresets.subtitle
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 10,
    ...textPresets.label
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 10,
    marginTop: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#000000",
  },
  radioSelected: {
    backgroundColor: "#157a4f",
    borderColor: "#157a4f",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 10,
    padding: 10,
    height: 80,
    marginTop: 8,
    ...textPresets.label
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    marginRight: 6,
  },
  submitBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    marginRight: 6,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#d84040",
    marginTop: 6,
    marginHorizontal: 16,
  },
  reportButtonText: {
    color: "#ffffff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    marginLeft: 6,
  }
});