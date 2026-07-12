import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

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

export default function ProductDetail({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const routeProduct = route?.params?.product;
  const routeProductId = route?.params?.productId || route?.params?.id;
  const initialProduct = routeProduct || {};
  const [product, setProduct] = useState(initialProduct);
  const [hasFetchedProduct, setHasFetchedProduct] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const sliderRef = useRef(null);
  const timerRef = useRef(null);

  const resolvedProductId = resolveProductId(initialProduct) || routeProductId;

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

  const name = getProductName(product);
  const price = getProductPrice(product);
  const details = getProductDescription(product) || "No additional product details available.";
  const extraFields = buildProductFields(product);

  const allImages = useMemo(() => getAllProductImages(product), [product]);

  const startAutoSlide = () => {
    stopAutoSlide();
    if (allImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveImageIndex((prev) => {
        const nextIndex = (prev + 1) % allImages.length;
        sliderRef.current?.scrollTo({
          x: nextIndex * CONTAINER_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
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
  }, [allImages]);

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
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          {allImages.length > 1 ? (
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
                {allImages.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{ width: CONTAINER_WIDTH, height: 260, resizeMode: "cover" }}
                  />
                ))}
              </ScrollView>

              <View style={styles.dotsContainer}>
                {allImages.map((_, index) => (
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
          ) : allImages.length === 1 ? (
            <Image source={{ uri: allImages[0] }} style={styles.productImage} />
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