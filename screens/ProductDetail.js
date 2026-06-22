import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

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

  const image = getProductImage(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const details = getProductDescription(product) || "No additional product details available.";
  const extraFields = buildProductFields(product);

  return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <LinearGradient
                    colors={["#f8a812", "#fad081",  "#f8f6f265"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
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
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} />
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
    padding:10
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
    paddingBottom: 24,
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
    alignItems:"center",
    marginBottom:10
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
    color:"#666"
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
});