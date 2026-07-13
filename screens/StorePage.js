import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { ensureAuthenticated } from '../services/authService';
import {
  checkFollowStatus,
  fetchOfferDetails,
  fetchPublicMerchantProfile,
  toggleFollowMerchant,
} from '../services/offersService';

const resolveImageUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
  return `${BASE_URL}/${trimmed}`;
};

const normalizeFollowerCount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const formatFollowerLabel = (value) => {
  const count = normalizeFollowerCount(value);
  return `${count} ${count === 1 ? 'follower' : 'followers'}`;
};

export default function StorePage({ route, navigation }) {
  const [merchantDetails, setMerchantDetails] = useState(null);
  const [merchantOwnerName, setMerchantOwnerName] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMerchantOwnerName = async (id) => {
      if (!id) {
        if (isMounted) {
          setMerchantOwnerName('');
        }
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        const resolvedName = data?.data?.name || data?.user?.name || '';

        if (isMounted) {
          setMerchantOwnerName(resolvedName);
        }
      } catch (error) {
        console.warn('Failed to load merchant owner name', error);
        if (isMounted) {
          setMerchantOwnerName('');
        }
      }
    };

    const loadMerchantDetails = async () => {
      try {
        setLoading(true);
        setMerchantOwnerName('');
        setIsFollowing(false);

        const passedMerchant = route?.params?.merchantProfile || route?.params?.merchant || null;
        const merchantId = route?.params?.merchantId || passedMerchant?.merchantId || passedMerchant?.userId || passedMerchant?.id || passedMerchant?._id || '';

        let details = null;

        if (passedMerchant && typeof passedMerchant === 'object') {
          details = passedMerchant;
        }

        if (!details && merchantId) {
          const publicProfile = await fetchPublicMerchantProfile(merchantId);
          details = publicProfile || null;
        }

        if (!details && route?.params?.offerId) {
          const offer = await fetchOfferDetails(route.params.offerId);
          details = offer?.merchant || offer?.merchantProfile || null;
        }

        const resolvedMerchantId =
          merchantId ||
          details?.merchantId ||
          details?.userId ||
          details?.id ||
          details?._id ||
          '';

        if (isMounted) {
          setMerchantDetails(details || null);
          setFollowersCount(
            normalizeFollowerCount(
              details?.followersCount ||
                details?.followerCount ||
                passedMerchant?.followersCount ||
                passedMerchant?.followerCount ||
                route?.params?.followersCount ||
                route?.params?.followerCount ||
                0
            )
          );
        }

        if (resolvedMerchantId) {
          await fetchMerchantOwnerName(resolvedMerchantId);

          const followState = await checkFollowStatus(resolvedMerchantId);
          if (isMounted) {
            setIsFollowing(Boolean(followState?.isFollowing));
          }
        }
      } catch (error) {
        console.warn('Failed to load merchant details', error);
        if (isMounted) {
          setMerchantDetails(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMerchantDetails();

    return () => {
      isMounted = false;
    };
  }, [route?.params?.merchantId, route?.params?.offerId, route?.params?.merchantProfile, route?.params?.merchant]);

  const handleFollowToggle = async () => {
    const merchantId =
      route?.params?.merchantId ||
      merchantDetails?.merchantId ||
      merchantDetails?.userId ||
      merchantDetails?.id ||
      merchantDetails?._id ||
      '';

    if (!merchantId) {
      return;
    }

    setFollowLoading(true);

    try {
      await ensureAuthenticated(navigation);
      const result = await toggleFollowMerchant(merchantId);
      const nextIsFollowing = Boolean(result?.isFollowing);

      setIsFollowing(nextIsFollowing);
      setFollowersCount((currentCount) => Math.max(0, currentCount + (nextIsFollowing ? 1 : -1)));
    } catch (error) {
      console.warn('Failed to toggle follow status', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const merchantName =
    merchantOwnerName ||
    merchantDetails?.merchantName ||
    merchantDetails?.name ||
    merchantDetails?.user?.name ||
    merchantDetails?.ownerName ||
    merchantDetails?.contactInfo?.name ||
    (typeof route?.params?.merchant === 'string' ? route.params.merchant : 'Merchant');

  const storeName =
    merchantDetails?.storeName ||
    merchantDetails?.businessName ||
    merchantDetails?.shopName ||
    merchantDetails?.merchant?.storeName ||
    'Store';

  const phoneNumber =
    merchantDetails?.contactNumber ||
    merchantDetails?.phoneNumber ||
    merchantDetails?.phone ||
    merchantDetails?.mobile ||
    merchantDetails?.merchant?.contactNumber ||
    merchantDetails?.user?.phoneNumber ||
    'Not available';

  const storeLocation =
    merchantDetails?.storeLocation ||
    merchantDetails?.address ||
    merchantDetails?.location ||
    merchantDetails?.shopAddress ||
    merchantDetails?.merchant?.storeLocation ||
    'Location not available';

  const profilePic = resolveImageUrl(
    merchantDetails?.profilePhoto ||
      merchantDetails?.profilePic ||
      merchantDetails?.avatar ||
      merchantDetails?.merchant?.profilePhoto ||
      merchantDetails?.merchant?.profilePic
  );

  const storePic = resolveImageUrl(
    merchantDetails?.shopPhoto ||
      merchantDetails?.storePic ||
      merchantDetails?.storePhoto ||
      merchantDetails?.merchant?.shopPhoto ||
      merchantDetails?.merchant?.storePic ||
      route?.params?.offerImage
  );

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#000" style={{ padding: 10 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
      </View>

      <View style={styles.divider} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#f8a812" />
          <Text style={styles.emptyText}>Loading merchant details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.coverCard}>
            {storePic ? (
              <Image source={{ uri: storePic }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialIcons name="storefront" size={42} color="#f8a812" />
              </View>
            )}

            <View style={styles.profileRow}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileFallback}>
                  <MaterialIcons name="person" size={26} color="#fff" />
                </View>
              )}
              <View style={styles.profileTextBox}>
                <Text style={styles.merchantName}>{merchantName}</Text>
                <Text style={styles.storeName}>{storeName}</Text>
                  <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followButtonActive]}
                    onPress={handleFollowToggle}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={isFollowing ? '#f8a812' : '#fff'} />
                    ) : (
                      <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Merchant details</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="person-outline" size={18} color="#f8a812" />
              <Text style={styles.infoLabel}>Merchant name</Text>
              <Text style={styles.infoValue}>{merchantName}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="storefront" size={18} color="#f8a812" />
              <Text style={styles.infoLabel}>Store name</Text>
              <Text style={styles.infoValue}>{storeName}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={18} color="#f8a812" />
              <Text style={styles.infoLabel}>Phone number</Text>
              <Text style={styles.infoValue}>{phoneNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={18} color="#f8a812" />
              <Text style={styles.infoLabel}>Store location</Text>
              <Text style={styles.infoValue}>{storeLocation}</Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SemiBold',
    lineHeight: Math.round(20 * 1.5),
  },
  divider: {
    backgroundColor: '#000000',
    height: 1,
    marginVertical: 6,
    opacity: 0.15,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: Math.round(13 * 1.5),
  },
  coverCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#fef3c7',
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: -24,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f3f4f6',
  },
  profileFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f8a812',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  followerCount: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: Math.round(12 * 1.5),
    fontFamily: 'Medium',
  },
  followButton: {
    backgroundColor: '#f8a812',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 94,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  followButtonActive: {
    backgroundColor: '#fff4d8',
    borderWidth: 1,
    borderColor: '#f8a812',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SemiBold',
    lineHeight: Math.round(12 * 1.5),
  },
  followButtonTextActive: {
    color: '#f8a812',
  },
  merchantName: {
    fontSize: 18,
    fontFamily: 'SemiBold',
    color: '#111827',
    lineHeight: Math.round(18 * 1.5),
    paddingTop: 16,
  },
  storeName: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: Math.round(14 * 1.5),
    fontFamily: 'Medium',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SemiBold',
    marginBottom: 12,
    color: '#111827',
    lineHeight: Math.round(16 * 1.5),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    width: 96,
    fontFamily: 'Medium',
    lineHeight: Math.round(13 * 1.5),
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    marginLeft: 6,
    lineHeight: Math.round(13 * 1.5),
    fontFamily: 'Medium',
  },
});