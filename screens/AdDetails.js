import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from '../services/favoritesService';
import { trackAdCardClick, trackContactClick, trackWishlistSave } from '../services/analyticsService';

const { width, height } = Dimensions.get('window');

export default function AdDetails({ route, navigation }) {
  const { adId } = route.params || {};
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const sliderRef = useRef(null);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  const handleOpenChat = () => {
    navigation.navigate('ChatScreen', {
      adId: ad?.adId || ad?._id || adId,
      sellerId: ad?.userId || ad?.user?.id,
      sellerName: ad?.contactInfo?.name || 'Seller',
    });
  };

  const handleCall = (phone) => {
    if (!phone) return;

    // Remove +91 if present
    const cleanedNumber = phone.replace('+91', '');

    const currentAdId = ad?.adId || ad?._id || adId;
    trackContactClick(currentAdId);

    Linking.openURL(`tel:${cleanedNumber}`);
  };


  useEffect(() => {
    const fetchAdDetails = async () => {
      try {
        if (!adId) {
          Alert.alert('Error', 'Ad ID not found');
          navigation.goBack();
          return;
        }

        const res = await fetch(`${BASE_URL}/ads/${adId}`);
        const json = await res.json();

        if (json.success && json.data) {
          setAd(json.data);
          trackAdCardClick(adId);
        } else {
          Alert.alert('Error', json.message || 'Failed to load ad details');
          navigation.goBack();
        }
      } catch (err) {
        console.error('Error fetching ad details:', err);
        Alert.alert('Error', 'Failed to load ad details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchAdDetails();
  }, [adId, BASE_URL]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      const currentAdId = getAdId(ad) || adId;
      if (!currentAdId) return;
      const value = await isFavoriteAdId(currentAdId);
      setIsFavorite(value);
    };

    loadFavoriteState();
  }, [ad, adId]);

  const handleToggleFavorite = async () => {
    try {
      const payload = ad
        ? {
          ...ad,
          adId: ad?.adId || ad?._id || adId,
          images: ad?.images || [],
        }
        : { adId };

      const result = await toggleFavoriteAd(payload);
      setIsFavorite(result.isFavorite);

      if (result.isFavorite) {
        const currentAdId = ad?.adId || ad?._id || adId;
        trackWishlistSave(currentAdId);
      }
    } catch (error) {
      Alert.alert('Favorite Error', error.message || 'Failed to update favorites');
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
      const resolvedAdId = ad?.adId || ad?._id || adId;
      if (!resolvedAdId) {
        Alert.alert('Share Error', 'Ad details are not available yet');
        return;
      }

      const shareUrl = `${BASE_URL}/ads/share/${encodeURIComponent(resolvedAdId)}`;
      const deepLink = `golo://ad/${encodeURIComponent(resolvedAdId)}`;

      const message = [
        `Check this ad on GOLO: ${ad?.title || 'Ad'}`,
        shareUrl,
        `App link: ${deepLink}`,
      ].join('\n');

      await Share.share({
        message,
        url: shareUrl,
        title: ad?.title || 'Shared Ad',
      });
    } catch (error) {
      Alert.alert('Share Error', error?.message || 'Unable to share this ad right now');
    }
  };

  const handleShare = () => {
    Alert.alert('Share Ad', 'Choose where to share this ad', [
      { text: 'In GOLO Chat', onPress: handleShareInChat },
      { text: 'WhatsApp / Messages', onPress: handleShareExternally },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
        <Text>Ad not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
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
            <MaterialIcons name="arrow-back-ios" size={26} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ad Details</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#e74c3c' : '#111'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-social" size={24} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="flag-outline" size={24} color="#ce3d3d" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Carousel */}
          {ad.images && ad.images.length > 0 ? (
            <View style={styles.imageContainer}>
              <ScrollView
                ref={sliderRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
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
          ) : (
            <View style={[styles.adImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={40} color="#999" />
            </View>
          )}

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Title & Price */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>{ad.title}</Text>
              {ad.price ? (
                <Text style={styles.price}>₹{ad.price}</Text>
              ) : (
                <Text style={styles.price}>Call for Price</Text>
              )}
            </View>

            {/* Category & SubCategory */}
            <View style={styles.categoryRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{ad.category}</Text>
              </View>
              {ad.subCategory && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{ad.subCategory}</Text>
                </View>
              )}
            </View>

            {/* Location & Views */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{ad.location || ad.city || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{ad.viewCount || 0} views</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{ad.description}</Text>
            </View>

            {/* Seller Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller Information</Text>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person-circle" size={48} color="#157a4f" />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{ad.contactInfo?.name || 'Anonymous'}</Text>
                  {ad.contactInfo?.phone && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(ad.contactInfo.phone)}
                    >
                      <Text style={styles.callBtnText}>📞 {ad.contactInfo.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Category-Specific Data */}
            {ad.educationData && Object.keys(ad.educationData).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education Details</Text>
                {ad.educationData.institutionType && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Institution Type:</Text>
                    <Text style={styles.detailValue}>{ad.educationData.institutionType}</Text>
                  </View>
                )}
                {ad.educationData.institutionName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Institution Name:</Text>
                    <Text style={styles.detailValue}>{ad.educationData.institutionName}</Text>
                  </View>
                )}
                {ad.educationData.courseName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Course:</Text>
                    <Text style={styles.detailValue}>{ad.educationData.courseName}</Text>
                  </View>
                )}
                {ad.educationData.duration && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{ad.educationData.duration}</Text>
                  </View>
                )}
                {ad.educationData.fees && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fees:</Text>
                    <Text style={styles.detailValue}>₹{ad.educationData.fees}</Text>
                  </View>
                )}
                {ad.educationData.contactNumber && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{ad.educationData.contactNumber}</Text>
                  </View>
                )}
                {ad.educationData.website && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Website:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{ad.educationData.website}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Posted Date */}
            <View style={styles.footerMeta}>
              <Text style={styles.footerMetaText}>
                Posted on {new Date(ad.createdAt || Date.now()).toLocaleDateString()}
              </Text>
              {ad.viewCount && (
                <Text style={styles.footerMetaText}>
                  👁️ {ad.viewCount} people viewed this
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.chatButtonLarge} onPress={handleOpenChat}>
            <Text style={styles.chatButtonText}>💬 Chat with Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButtonLarge}
            onPress={() => handleCall(ad.contactInfo?.phone)}
          >
            <Text style={styles.callButtonText}>📞 Call Seller</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Medium',
    lineHeight: Math.round(18 * 1.5)
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
    backgroundColor: '#e0e0e0',
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
    fontSize: 12,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  contentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 16,
    marginBottom: 80,
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontFamily: "Medium",
    lineHeight: Math.round(22 * 1.5)
  },
  price: {
    fontSize: 18,
    fontFamily: "Medium",
    lineHeight: Math.round(18 * 1.5),
    color: '#157a4f',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f5b849',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  section: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5)
  },
  description: {
    fontSize: 14,
    color: '#555',
    fontFamily: "Medium",
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: "Medium",
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
    fontSize: 12,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  footerMeta: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerMetaText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    fontFamily: "Medium",
    lineHeight: Math.round(11 * 1.5)
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatButtonLarge: {
    flex: 1,
    backgroundColor: '#f5b849',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5)
  },
  callButtonLarge: {
    flex: 1,
    backgroundColor: '#157a4f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5)
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#157a4f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});