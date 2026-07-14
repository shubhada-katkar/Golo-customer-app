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
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../config';
import Topbar from '../components/Topbar';
import { ensureAuthenticated } from '../services/authService';
import {
  checkFollowStatus,
  fetchAllOffers,
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

const leafletHtml = (lat, lng, name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #f8f9fa;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var marker = L.marker([${lat}, ${lng}]).addTo(map);
    marker.bindPopup("<b>${name.replace(/"/g, '\\"')}</b>").openPopup();
  </script>
</body>
</html>
`;

const getOfferImage = (item) =>
  item?.imageUrl ||
  item?.selectedProducts?.[0]?.imageUrl ||
  item?.products?.[0]?.images?.[0] ||
  item?.products?.[0]?.image?.url ||
  "";

const getOfferTitle = (item) => item?.bannerTitle || item?.title || "Untitled Offer";

const getOfferSubtitle = (item) =>
  item?.shopName ||
  item?.merchantName ||
  item?.businessName ||
  item?.sellerName ||
  item?.storeName ||
  item?.merchant?.name ||
  item?.merchant?.storeName ||
  item?.selectedProducts?.[0]?.productName ||
  item?.selectedProducts?.[0]?.name ||
  "Nearby merchant";

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `Rs ${numericValue}` : String(value);
};

const getOfferDisplayPrice = (item) => {
  const directPrice = formatPrice(
    item?.displayPrice ||
    item?.discountedPrice ||
    item?.offerPrice ||
    item?.salePrice ||
    item?.finalPrice ||
    item?.price
  );
  if (directPrice) {
    return directPrice;
  }
  const selectedProducts = Array.isArray(item?.selectedProducts)
    ? item.selectedProducts
    : [];
  const lowestProductPrice = selectedProducts
    .map((product) =>
      formatPrice(
        product?.offerPrice ||
        product?.discountedPrice ||
        product?.salePrice ||
        product?.finalPrice ||
        product?.displayPrice ||
        product?.price
      )
    )
    .filter(Boolean)
    .map((value) => Number(String(value).replace(/[^0-9.-]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)[0];
  return lowestProductPrice !== undefined ? formatPrice(lowestProductPrice) : null;
};

export default function StorePage({ route, navigation }) {
  const [merchantDetails, setMerchantDetails] = useState(null);
  const [merchantOwnerName, setMerchantOwnerName] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [ratingStats, setRatingStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [dealsLoading, setDealsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

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

          // Fetch deals
          if (isMounted) setDealsLoading(true);
          try {
            const allOffers = await fetchAllOffers({ limit: 1000 });
            const merchantDeals = allOffers.filter(offer =>
              String(offer?.merchantId || offer?.merchant?.merchantId || '') === String(resolvedMerchantId)
            );
            if (isMounted) setDeals(merchantDeals);
          } catch (e) {
            console.warn('Failed to load merchant deals', e);
          } finally {
            if (isMounted) setDealsLoading(false);
          }

          // Fetch products
          if (isMounted) setProductsLoading(true);
          try {
            const prodRes = await fetch(`${BASE_URL}/merchant/products/public/${resolvedMerchantId}`);
            if (prodRes.ok) {
              const prodJson = await prodRes.json();
              if (isMounted) {
                setProducts(prodJson?.data?.products || []);
              }
            }
          } catch (e) {
            console.warn('Failed to load merchant products', e);
          } finally {
            if (isMounted) setProductsLoading(false);
          }

          // Fetch ratings
          if (isMounted) setRatingLoading(true);
          try {
            const ratingRes = await fetch(`${BASE_URL}/reviews/merchant/${resolvedMerchantId}/public-stats`);
            if (ratingRes.ok) {
              const ratingJson = await ratingRes.json();
              if (isMounted && ratingJson?.success && ratingJson?.data) {
                setRatingStats(ratingJson.data);
              }
            }
          } catch (e) {
            console.warn('Failed to load rating stats', e);
          } finally {
            if (isMounted) setRatingLoading(false);
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

  const latitude =
    merchantDetails?.storeLocationLatitude ||
    merchantDetails?.latitude ||
    merchantDetails?.merchant?.storeLocationLatitude ||
    null;

  const longitude =
    merchantDetails?.storeLocationLongitude ||
    merchantDetails?.longitude ||
    merchantDetails?.merchant?.storeLocationLongitude ||
    null;

  const hasCoords =
    latitude !== null &&
    longitude !== null &&
    Number(latitude) !== 0 &&
    Number(longitude) !== 0;

  const DealCard = ({ item }) => {
    const productImage = getOfferImage(item);
    const title = getOfferTitle(item);
    const subtitle = getOfferSubtitle(item);
    const offerType = item?.bannerCategory || item?.offerType || item?.category || "-";
    const endDate = item?.endDate || item?.validTo || null;
    const displayPrice = getOfferDisplayPrice(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => navigation.navigate("OfferDetails", { offerData: item })}
      >
        <View style={styles.cardInner}>
          {productImage ? (
            <Image source={{ uri: resolveImageUrl(productImage) }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <MaterialIcons name="image" size={28} color="#8a8a8a" />
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {displayPrice ? (
                <Text style={styles.discountPrice} numberOfLines={1}>
                  {displayPrice}
                </Text>
              ) : null}
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              By {subtitle}
            </Text>

            <Text style={styles.metaText} numberOfLines={1}>Offer Type: {offerType}</Text>

            <Text style={styles.validText} numberOfLines={1}>
              Expires: {endDate ? new Date(endDate).toDateString() : "-"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ProductCard = ({ item }) => {
    const productImage = item?.image;
    const title = item?.name || "Product";
    const subtitle = item?.category || "Category";
    const displayPrice = item?.priceLabel || (item?.price ? `₹${item?.price}` : null);

    // Stock and Status calculation
    const stockInfo = item?.stock !== undefined && item?.stock !== null ? String(item.stock) : (item?.stockQuantity !== undefined && item?.stockQuantity !== null ? `${item.stockQuantity} units` : "N/A");

    const getStockStatus = (p) => {
      if (p?.status === "out of stock" || p?.status === "out_of_stock") {
        return "Out of stock";
      }
      if (p?.status === "in stock" || p?.status === "in_stock") {
        return "In stock";
      }
      const qty = Number(p?.stock ?? p?.stockQuantity ?? p?.quantity ?? 1);
      if (Number.isFinite(qty) && qty <= 0) {
        return "Out of stock";
      }
      return "In stock";
    };

    const statusLabel = getStockStatus(item);
    const isOutOfStock = statusLabel.toLowerCase() === "out of stock";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <View style={styles.cardInner}>
          {productImage ? (
            <Image source={{ uri: resolveImageUrl(productImage) }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <MaterialIcons name="image" size={28} color="#8a8a8a" />
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {displayPrice ? (
                <Text style={styles.discountPrice} numberOfLines={1}>
                  {displayPrice}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.distanceMetaText,
                  { color: isOutOfStock ? "#e74c3c" : "#27ae60", fontFamily: "Bold" }
                ]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              Category: {subtitle}
            </Text>

            <Text style={styles.metaText} numberOfLines={1}>Stock: {stockInfo}</Text>
            <Text style={styles.validText} numberOfLines={1}>
              Status: {statusLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

                <View style={styles.statsRow}>
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={16} color="#f8a812" />
                    <Text style={styles.ratingText}>
                      {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : '0.0'}
                      {` (${ratingStats.totalReviews})`}
                    </Text>
                  </View>
                </View>

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

          {/* Map Card */}
          {hasCoords ? (
            <View style={styles.mapCard}>
              <Text style={styles.sectionTitle}>Store Location on Map</Text>
              <View style={styles.mapContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: leafletHtml(latitude, longitude, storeName) }}
                  style={styles.mapWebView}
                  scrollEnabled={false}
                />
              </View>
            </View>
          ) : (
            <View style={styles.mapCard}>
              <Text style={styles.sectionTitle}>Store Location on Map</Text>
              <View style={[styles.mapContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', height: 180 }]}>
                <MaterialIcons name="map" size={36} color="#ccc" />
                <Text style={styles.noDealsText}>Store location coordinates are not available.</Text>
              </View>
            </View>
          )}

          {/* Deals & Offers Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Merchant's Active Deals</Text>
            {dealsLoading && <ActivityIndicator size="small" color="#f8a812" style={{ marginLeft: 8 }} />}
          </View>
          {deals.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {deals.map((item, index) => (
                <DealCard key={item?.offerId || item?._id || `deal-${index}`} item={item} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.noDealsText}>No active deals available for this merchant.</Text>
            </View>
          )}

          {/* Products Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            {productsLoading && <ActivityIndicator size="small" color="#f8a812" style={{ marginLeft: 8 }} />}
          </View>
          {products.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {products.map((item, index) => (
                <ProductCard key={item?.id || item?._id || `product-${index}`} item={item} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.noDealsText}>No products available for this merchant.</Text>
            </View>
          )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  horizontalList: {
    paddingLeft: 4,
    paddingRight: 16,
    paddingBottom: 8,
  },
  emptySection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  noDealsText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Medium',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: 'SemiBold',
    marginLeft: 4,
    lineHeight: Math.round(12 * 1.5),
  },
  bulletSeparator: {
    marginHorizontal: 8,
    color: '#9ca3af',
  },
  followersText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Medium',
  },
  card: {
    width: 170,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ececec",
    elevation: 2,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardInner: {
    flexDirection: "column",
  },
  image: {
    width: "100%",
    height: 100,
    backgroundColor: "#f3f4f6",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: "Bold",
    lineHeight: 18,
    color: '#111827',
    marginTop: 4,
  },
  subtitle: {
    marginTop: 2,
    color: "#6b7280",
    fontFamily: "Medium",
    fontSize: 11,
    lineHeight: 15,
  },
  metaText: {
    marginTop: 2,
    fontFamily: "Medium",
    fontSize: 11,
    lineHeight: 15,
    color: "#6b7280",
  },
  validText: {
    fontSize: 9,
    marginTop: 4,
    color: "#9ca3af",
    fontFamily: "Medium",
    lineHeight: 12,
  },
  discountPrice: {
    color: "green",
    fontFamily: "Bold",
    fontSize: 13,
  },
  distanceMetaText: {
    fontSize: 11,
    fontFamily: "Medium",
    color: '#6b7280',
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 20,
    marginBottom: 20,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mapWebView: {
    flex: 1,
  },
});