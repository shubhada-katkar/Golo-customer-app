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
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import GoloBottom from "../components/GoloBottom";
import { BASE_URL } from "../config";

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
    { label: "Price", value: getProductPrice(product) },
    { label: "SKU", value: product?.sku || product?.productCode || product?.id },
    { label: "Quantity", value: product?.quantity || product?.qty },
    { label: "Unit", value: product?.unit },
    { label: "Category", value: product?.category },
    { label: "Brand", value: product?.brand || product?.manufacturer },
    { label: "Color", value: product?.color },
    { label: "Size", value: product?.size || product?.dimension },
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
    product?.sku ||
    null
  );
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
      try {
        const response = await fetch(`${BASE_URL}/products/${encodeURIComponent(resolvedProductId)}`);
        if (!response.ok) return;
        const json = await response.json();
        if (!isMounted) return;
        if (json?.data) {
          setProduct((current) => ({ ...current, ...json.data }));
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
  const details = getProductDescription(product) || "No additional product details available.";
  const extraFields = buildProductFields(product);

  return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Topbar />
                <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.card }]}> 
              <Ionicons name="image-outline" size={60} color="#9a9a9a" />
            </View>
          )}
        </View>

        <View style={styles.card}> 
          <Text style={[styles.productName, { color: colors.text }]}>{name}</Text>
          {extraFields.length > 0 && (
            <View style={styles.fieldsSection}>
              {extraFields.map((field) => (
                <View key={field.label} style={styles.fieldRow}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>{field.label}</Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>{field.value}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text }]}>{details}</Text>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "SemiBold",
    lineHeight: Math.round(18 * 1.5),
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
    marginBottom: 16,
  },
  productImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "#4b4b4b",
  },
  imagePlaceholder: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#4b4b4b",
    borderRadius: 16,
  },
  productName: {
    fontSize: 20,
    fontFamily: "Bold",
    marginBottom: 12,
    lineHeight: Math.round(20 * 1.5),
  },
  fieldsSection: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  fieldValue: {
    fontSize: 12,
    fontFamily: "Medium",
    maxWidth: "55%",
    textAlign: "right",
    lineHeight: Math.round(12 * 1.5),
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "SemiBold",
    marginBottom: 8,
    lineHeight: Math.round(16 * 1.5),
  },
  description: {
    fontSize: 12,
    lineHeight: Math.round(12 * 1.5),
    fontFamily: "Medium",
  },
});
