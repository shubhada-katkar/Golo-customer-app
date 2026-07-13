import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const CONTAINER_WIDTH = width - 32;

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `₹${numericValue}` : String(value);
};

const getProductImage = (product) => {
  return (
    product?.imageUrl ||
    product?.image?.url ||
    product?.images?.[0] ||
    product?.selectedProducts?.[0]?.imageUrl ||
    product?.photo ||
    null
  );
};

const getAllProductImages = (product) => {
  if (!product) return [];

  // 1. Check if product.images is a populated array
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images
      .map((img) => (typeof img === "string" ? img : img?.url || img?.imageUrl || img))
      .filter((img) => typeof img === "string" && img.length > 0);
  }

  // 2. Check if product.imageUrl is an array
  if (Array.isArray(product?.imageUrl)) {
    return product.imageUrl.filter((img) => typeof img === "string" && img.length > 0);
  }

  // 3. Check selectedProducts array
  if (Array.isArray(product?.selectedProducts) && product.selectedProducts.length > 0) {
    const images = product.selectedProducts
      .map((p) => p?.imageUrl || p?.image?.url || p?.photo)
      .filter((img) => typeof img === "string" && img.length > 0);
    if (images.length > 0) return images;
  }

  // 4. Fallback to single image resolving function
  const singleImage = getProductImage(product);
  return singleImage ? [singleImage] : [];
};

const getAllMediaItems = (product) => {
  const images = getAllProductImages(product);
  const media = images.map((uri) => ({ type: "image", uri }));
  const videoUrl = getProductVideo(product);

  if (videoUrl) {
    media.push({
      type: "video",
      uri: videoUrl,
      title: getProductVideoName(product),
    });
  }

  return media;
};

const getProductName = (product) => {
  return (
    product?.productName ||
    product?.name ||
    product?.title ||
    product?.label ||
    "Product"
  );
};

const getProductPrice = (product) => {
  return (
    formatPrice(product?.price) ||
    formatPrice(product?.mrp) ||
    formatPrice(product?.offerPrice) ||
    formatPrice(product?.salePrice) ||
    formatPrice(product?.finalPrice)
  );
};

const getVideoFileName = (videoUrl) => {
  if (typeof videoUrl !== "string" || !videoUrl.trim()) {
    return null;
  }

  const sanitizedUrl = videoUrl.split("?")[0].split("#")[0];
  const fileName = sanitizedUrl.split("/").pop();

  if (!fileName || fileName === "upload") {
    return null;
  }

  return fileName;
};

const getProductVideo = (product) => {
  if (!product) return null;

  const videoObject = product?.video && typeof product.video === "object" ? product.video : null;

  const candidate =
    product?.videoUrl ||
    product?.video ||
    videoObject?.url ||
    videoObject?.videoUrl ||
    videoObject?.uri ||
    null;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }

  return null;
};

const getProductVideoName = (product) => {
  const videoObject = product?.video && typeof product.video === "object" ? product.video : null;
  const directName =
    typeof videoObject?.fileName === "string" && videoObject.fileName.trim()
      ? videoObject.fileName.trim()
      : typeof videoObject?.name === "string" && videoObject.name.trim()
        ? videoObject.name.trim()
        : typeof product?.videoName === "string" && product.videoName.trim()
          ? product.videoName.trim()
          : typeof product?.fileName === "string" && product.fileName.trim()
            ? product.fileName.trim()
            : null;

  if (directName) return directName;

  const fallbackName = getVideoFileName(getProductVideo(product));
  return fallbackName || "Uploaded video";
};

const buildProductFields = (product) => {
  const fields = [
    { label: "Quantity", value: product?.quantity || product?.qty, icon: "format-list-numbered" },
    { label: "Unit", value: product?.unit, icon: "straighten" },
    { label: "Category", value: product?.category, icon: "category" },
    { label: "Brand", value: product?.brand || product?.manufacturer, icon: "verified" },
    { label: "Color", value: product?.color, icon: "palette" },
    { label: "Size", value: product?.size || product?.dimension, icon: "aspect-ratio" },
  ];

  return fields.filter((item) => item.value != null && String(item.value).trim().length > 0);
};

const getProductDescription = (product) => {
  if (!product) return null;

  const candidate =
    product?.description ||
    product?.details ||
    product?.productDescription ||
    product?.shortDescription ||
    product?.longDescription ||
    product?.desc ||
    product?.detail ||
    product?.descriptionText ||
    product?.description?.text ||
    product?.description?.description ||
    null;

  if (candidate && typeof candidate === "object") {
    return String(candidate?.text || candidate?.description || JSON.stringify(candidate));
  }

  return String(candidate || "").trim() || null;
};

const resolveProductId = (product) => {
  if (!product) return null;
  return (
    product?.productId ||
    product?.id ||
    product?._id ||
    product?.product_id ||
    null
  );
};

const isMongoObjectId = (value) =>
  typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const buildProductFetchUrls = (resolvedProductId, product) => {
  const encodedId = encodeURIComponent(resolvedProductId);
  const webEndpoint = `${BASE_URL}/products/${encodedId}`;
  const merchantPublicEndpoint = `${BASE_URL}/merchant/products/public/item/${encodedId}`;
  if (isMongoObjectId(resolvedProductId) && !product?.productId) {
    return [merchantPublicEndpoint, webEndpoint];
  }
  return [webEndpoint, merchantPublicEndpoint];
};

// Helper to resolve the offerId associated with the product (for like/wishlist)
const resolveOfferIdForProduct = (product, routeParams) => {
  return (
    routeParams?.offerId ||
    product?.offerId ||
    product?.offer_id ||
    product?.requestId ||
    null
  );
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("customerToken");
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export default function ProductDetail({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const routeProduct = route?.params?.product;
  const routeProductId = route?.params?.productId || route?.params?.id;
  const initialProduct = routeProduct || {};
  const [product, setProduct] = useState(initialProduct);
  const [hasFetchedProduct, setHasFetchedProduct] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Like / share state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const sliderRef = useRef(null);
  const timerRef = useRef(null);

  const resolvedProductId = resolveProductId(initialProduct) || routeProductId;
  const offerId = resolveOfferIdForProduct(initialProduct, route?.params);

  useEffect(() => {
    const shouldFetchDescription =
      resolvedProductId &&
      !hasFetchedProduct &&
      !getProductDescription(product) &&
      !product?.details &&
      !product?.description;

    if (!shouldFetchDescription) return;

    let isMounted = true;
    const fetchProduct = async () => {
      const urls = buildProductFetchUrls(resolvedProductId, product);
      try {
        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              continue;
            }
            const json = await response.json();
            if (!isMounted) return;
            if (json?.data) {
              setProduct((current) => ({ ...current, ...json.data }));
              return;
            }
          } catch (fetchError) {
            console.warn('[ProductDetail] fetch error for', url, fetchError);
          }
        }
      } catch (error) {
        console.warn('[ProductDetail] Failed to fetch product details:', error);
      } finally {
        if (isMounted) setHasFetchedProduct(true);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [resolvedProductId, product, hasFetchedProduct]);

  // Check if product/offer is already in wishlist
  const checkFavoriteStatus = useCallback(async () => {
    const idToCheck = offerId || resolvedProductId;
    if (!idToCheck) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const response = await fetch(`${BASE_URL}/users/wishlist/ids`, { headers });
      if (response?.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data)) {
          setIsFavorite(json.data.some((id) => String(id) === String(idToCheck)));
        }
      }
    } catch (error) {
      console.warn("[ProductDetail] Failed to check favorite status:", error);
    }
  }, [offerId, resolvedProductId]);

  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
    }, [checkFavoriteStatus])
  );

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;
    const idToLike = offerId || resolvedProductId;
    if (!idToLike) {
      Alert.alert("Cannot Like", "Product identifier is not available.");
      return;
    }
    setFavoriteLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        Alert.alert("Login Required", "Please log in to like products.");
        setFavoriteLoading(false);
        return;
      }

      // If we have an offerId, use the product like endpoint which also records product details
      if (offerId) {
        const response = await fetch(`${BASE_URL}/users/likes/product`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            offerId,
            product: {
              productId: resolvedProductId || "",
              productName: getProductName(product),
              imageUrl: getProductImage(product) || "",
              category: product?.category || "",
              price: product?.price || product?.mrp || 0,
            },
          }),
        });
        if (response?.ok) {
          const json = await response.json();
          const liked = json?.data?.liked ?? true;
          setIsFavorite(liked);
          Alert.alert(liked ? "Liked!" : "Removed", liked ? "Product liked successfully." : "Product removed from likes.");
          return;
        }
      }

      // Fallback: use the general wishlist toggle
      const response = await fetch(
        `${BASE_URL}/users/wishlist/${encodeURIComponent(idToLike)}`,
        { method: "POST", headers }
      );
      if (response?.ok) {
        const json = await response.json();
        const added = Boolean(json?.data?.added);
        setIsFavorite(added);
        Alert.alert(added ? "Liked!" : "Removed", added ? "Added to your favorites." : "Removed from favorites.");
      } else {
        Alert.alert("Error", "Unable to update like status.");
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to update like right now.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShareProduct = async () => {
    try {
      const name = getProductName(product);
      const price = getProductPrice(product);
      const description = getProductDescription(product);
      const shareMessage = [
        `Product: ${name}`,
        price ? `Price: ${price}` : null,
        product?.category ? `Category: ${product.category}` : null,
        description ? `Details: ${description}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await Share.share({
        title: name,
        message: shareMessage,
      });
    } catch (error) {
      Alert.alert("Share Error", error?.message || "Unable to share this product right now.");
    }
  };

  const name = getProductName(product);
  const price = getProductPrice(product);
  const details = getProductDescription(product) || "No additional product details available.";
  const extraFields = buildProductFields(product);

  const allMedia = useMemo(() => getAllMediaItems(product), [product]);

  const [videoPlaying, setVideoPlaying] = useState(false);

  const startAutoSlide = () => {
    stopAutoSlide();
    if (allMedia.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveImageIndex((prev) => {
        const nextIndex = (prev + 1) % allMedia.length;
        sliderRef.current?.scrollTo({
          x: nextIndex * CONTAINER_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };


  useEffect(() => {
    setActiveImageIndex(0);
    startAutoSlide();
    return () => stopAutoSlide();
  }, [allMedia]);


  useEffect(() => {
    if (videoPlaying) {
      stopAutoSlide();
    } else {
      startAutoSlide();
    }
  }, [videoPlaying]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
      />
      <Topbar />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleToggleFavorite} disabled={favoriteLoading}>
            {favoriteLoading ? (
              <ActivityIndicator size="small" color="#e74c3c" style={styles.icon} />
            ) : (
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite ? "#e74c3c" : colors.text}
                style={styles.icon}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareProduct}>
            <Ionicons name="share-social-outline" size={22} style={{ color: colors.text }} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          {allMedia.length > 1 ? (
            <View style={styles.carouselContainer}>
              <ScrollView
                ref={sliderRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / CONTAINER_WIDTH);
                  setActiveImageIndex(index);
                }}
                onScrollBeginDrag={stopAutoSlide}
                onScrollEndDrag={startAutoSlide}
              >
                {allMedia.map((item, index) =>
                  item.type === "video" ? (
                    <View
                      key={`${item.uri}-${index}`}
                      style={[styles.mediaSlide, { backgroundColor: colors.card || "#fff" }]}
                    >
                      <Video
                        source={{ uri: item.uri }}
                        style={styles.videoPlayer}
                        useNativeControls
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isLooping={false}
                        onPlaybackStatusUpdate={(status) => {
                          if (status.isLoaded && status.isPlaying !== videoPlaying) {
                            setVideoPlaying(status.isPlaying);
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <Image
                      key={`${item.uri}-${index}`}
                      source={{ uri: item.uri }}
                      style={{ width: CONTAINER_WIDTH, height: 260, resizeMode: "cover" }}
                    />
                  )
                )}
              </ScrollView>

              <View style={styles.dotsContainer}>
                {allMedia.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeImageIndex === index ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : allMedia.length === 1 ? (
            allMedia[0]?.type === "video" ? (
              <View style={[styles.mediaSlide, { backgroundColor: colors.card || "#fff" }]}>
                <Video
                  source={{ uri: allMedia[0].uri }}
                  style={styles.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                />
              </View>
            ) : (
              <Image source={{ uri: allMedia[0].uri }} style={styles.productImage} />
            )
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.card || "#fff" }]}>
              <Ionicons name="image-outline" size={60} color="#9a9a9a" />
            </View>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card || "#fff",
              borderColor: colors.border || "#eee",
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.productName, { color: colors.text }]}>{name}</Text>
            {price && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{price}</Text>
              </View>
            )}
          </View>

          {extraFields.length > 0 && (
            <View style={styles.chipsWrap}>
              {extraFields.map((field) => (
                <View key={field.label} style={styles.chip}>
                  <Feather name="box" size={16} color="#157a4f" style={styles.chipIcon} />
                  <Text style={styles.chipLabel}>{field.label}: </Text>
                  <Text style={styles.chipValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="description" size={18} color="#157a4f" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          </View>
          <Text style={[styles.description, { color: colors.subtext || "#666" }]}>{details}</Text>
        </View>
      </ScrollView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }}
      >
        <GoloBottom />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 10
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "SemiBold",
    lineHeight: Math.round(20 * 1.5),
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  icon: {
    marginRight: 12,
  },
  headerPlaceholder: {
    width: 32,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 18,
  },
  productImage: {
    width: "100%",
    height: 260,
    borderRadius: 18,
    resizeMode: "cover",
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  imagePlaceholder: {
    width: "100%",
    height: 260,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  productName: {
    fontSize: 20,
    fontFamily: "Bold",
    lineHeight: Math.round(20 * 1.5),
    flex: 1,
    marginRight: 10,
  },
  priceBadge: {
    backgroundColor: "#157a4f",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontFamily: "Medium",
    color: "#ffffff",
    lineHeight: Math.round(14 * 1.3),
  },
  chipsWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
  },
  chipIcon: {
    marginRight: 10,
  },
  chipLabel: {
    fontSize: 16,
    fontFamily: "SemiBold",
    color: "#000",
    lineHeight: Math.round(16 * 1.5),
  },
  chipValue: {
    fontSize: 13,
    fontFamily: "SemiBold",
    lineHeight: Math.round(13 * 1.5),
    color: "#666"
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "SemiBold",
    lineHeight: Math.round(16 * 1.5),
    marginLeft: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: Math.round(13 * 1.6),
    fontFamily: "Medium",
  },
  carouselContainer: {
    width: CONTAINER_WIDTH,
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mediaSlide: {
    width: CONTAINER_WIDTH,
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: CONTAINER_WIDTH,
    height: 260,
    borderRadius: 18,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#ffffff",
  },
  inactiveDot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});