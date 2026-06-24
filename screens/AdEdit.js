import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateAd } from "../services/analyticsService";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { BASE_URL } from "../config";

const CATEGORY_DTO_FIELD_BY_LABEL = {
  Vehicle: "vehicleData",
  Property: "propertyData",
  Service: "serviceData",
  Mobiles: "mobileData",
  "Electronics & Home appliances": "electronicsData",
  Furniture: "furnitureData",
  Education: "educationData",
  Pets: "petsData",
  Matrimonial: "matrimonialData",
  Business: "businessData",
  Travel: "travelData",
  Astrology: "astrologyData",
  Employment: "employmentData",
  "Lost & Found": "lostFoundData",
  Personal: "personalData",
  Greetings: "greetingsData",
  "Greetings & Tributes": "greetingsData",
  Others: "otherData",
  Other: "otherData",
};

function getResolvedAdId(ad, fallbackAdId) {
  return ad?.adId || ad?._id || fallbackAdId;
}

function parseNumberInput(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRemoteUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getFileMetaFromUri(uri) {
  const fileName = uri?.split("/")?.pop() || `ad-${Date.now()}.jpg`;
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  const ext = (match?.[1] || "jpg").toLowerCase();
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  return { fileName, mimeType };
}

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dcm1plq42";
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "choja_preset";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

async function uploadAdImageToCloud(uri) {
  if (!uri) return null;
  if (isRemoteUrl(uri)) return uri;

  const { fileName, mimeType } = getFileMetaFromUri(uri);
  const uploadBody = new FormData();
  uploadBody.append("file", {
    uri,
    name: fileName,
    type: mimeType,
  });
  uploadBody.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  uploadBody.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: uploadBody,
  });

  const data = await response.json().catch(() => ({}));
  const imageUrl = data?.secure_url || data?.url;

  if (!response.ok || !imageUrl) {
    throw new Error(data?.error?.message || "Failed to upload image");
  }

  return imageUrl;
}

function prettifyKey(key = "") {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function buildCategoryEditorData(source = {}) {
  const draft = {};
  const typeMap = {};

  Object.entries(source || {}).forEach(([key, value]) => {
    if (value == null) return;

    if (typeof value === "boolean") {
      draft[key] = value;
      typeMap[key] = "boolean";
      return;
    }

    if (typeof value === "number") {
      draft[key] = String(value);
      typeMap[key] = "number";
      return;
    }

    if (Array.isArray(value)) {
      draft[key] = value.map((item) => String(item)).join(", ");
      typeMap[key] = "array";
      return;
    }

    if (typeof value === "object") {
      draft[key] = JSON.stringify(value);
      typeMap[key] = "json";
      return;
    }

    draft[key] = String(value);
    typeMap[key] = "string";
  });

  return { draft, typeMap };
}

function buildTypedCategoryPayload(draft = {}, typeMap = {}) {
  const payload = {};

  Object.entries(draft).forEach(([key, value]) => {
    const fieldType = typeMap[key] || "string";

    if (fieldType === "boolean") {
      payload[key] = Boolean(value);
      return;
    }

    if (fieldType === "number") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) payload[key] = parsed;
      return;
    }

    if (fieldType === "array") {
      const arr = String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      payload[key] = arr;
      return;
    }

    if (fieldType === "json") {
      try {
        payload[key] = JSON.parse(String(value || "{}"));
      } catch {
        payload[key] = value;
      }
      return;
    }

    const text = String(value || "").trim();
    if (text.length) payload[key] = text;
  });

  return payload;
}

export default function AdEdit({ route, navigation }) {
    const [reporting, setReporting] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [showReportBox, setShowReportBox] = useState(false);

  const { adId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ad, setAd] = useState(null);
  const [images, setImages] = useState([]);
  const [categoryDraft, setCategoryDraft] = useState({});
  const [categoryTypeMap, setCategoryTypeMap] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    contactName: "",
    contactPhone: "",
  });

  const colors = useContext(ThemeContext);

  const templateNumber = useMemo(() => {
    const parsed = Number(ad?.templateId ?? ad?.template ?? 1);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [ad?.templateId, ad?.template]);

  const showImageSection = templateNumber === 1 || templateNumber === 2;
  const allowsMultipleImages = templateNumber === 1;

  useEffect(() => {
    const fetchAd = async () => {
      try {
        if (!adId) {
          Alert.alert("Error", "Ad id is missing");
          navigation.goBack();
          return;
        }

        if (!BASE_URL) {
          throw new Error("BASE_URL is not configured");
        }

        const response = await fetch(`${BASE_URL}/ads/${encodeURIComponent(adId)}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success || !data?.data) {
          throw new Error(data?.message || "Failed to load ad details");
        }

        const fetchedAd = data.data;
        const categoryDtoField = CATEGORY_DTO_FIELD_BY_LABEL[fetchedAd?.category] || null;
        const categorySource = fetchedAd?.categorySpecificData || (categoryDtoField ? fetchedAd?.[categoryDtoField] : null) || {};
        const editorData = buildCategoryEditorData(categorySource);
        const fetchedImages = Array.isArray(fetchedAd?.images) ? fetchedAd.images : [];
        const normalizedImages = Number(fetchedAd?.templateId ?? fetchedAd?.template ?? 1) === 2 ? fetchedImages.slice(0, 1) : fetchedImages;

        setAd(fetchedAd);
        setImages(normalizedImages);
        setCategoryDraft(editorData.draft);
        setCategoryTypeMap(editorData.typeMap);
        setForm({
          title: fetchedAd?.title || "",
          description: fetchedAd?.description || "",
          price: fetchedAd?.price != null ? String(fetchedAd.price) : "",
          location: fetchedAd?.location || "",
          contactName: fetchedAd?.contactInfo?.name || "",
          contactPhone: fetchedAd?.contactInfo?.phone || "",
        });
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load ad details");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId, BASE_URL, navigation]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCategoryFieldChange = (key, value) => {
    setCategoryDraft((prev) => ({ ...prev, [key]: value }));
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions
        ? ImagePicker.MediaTypeOptions.Images
        : "Images",
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const selectedUris = result.assets.map((asset) => asset.uri).filter(Boolean);
      const incomingUris = allowsMultipleImages ? selectedUris : selectedUris.slice(0, 1);

      setImages((prev) => {
        const combined = [...prev, ...incomingUris];
        return allowsMultipleImages ? combined : combined.slice(0, 1);
      });
    }
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!form.title.trim()) {
        Alert.alert("Validation", "Title is required");
        return;
      }

      if (!form.description.trim()) {
        Alert.alert("Validation", "Description is required");
        return;
      }

      const resolvedAdId = getResolvedAdId(ad, adId);
      if (!resolvedAdId) {
        Alert.alert("Error", "Ad id is missing");
        return;
      }

      setSaving(true);


      const existingContactInfo = ad?.contactInfo || {};
      const token = await AsyncStorage.getItem("customerToken");
      if (!token) {
        throw new Error("Please login again to update ad");
      }

      if (!BASE_URL) {
        throw new Error("BASE_URL is not configured");
      }

      const uploadedImages = [];
      if (showImageSection) {
        for (const imageUri of images) {
          const uploaded = await uploadAdImageToCloud(imageUri);
          if (uploaded) uploadedImages.push(uploaded);
        }
      }

      // Clean contactInfo: only allowed fields
      const allowedContactFields = ["name", "phone", "email", "whatsapp", "website", "preferredContactMethod"];
      const cleanedContactInfo = {};
      for (const key of allowedContactFields) {
        if ((form[key] && typeof form[key] === "string" && form[key].trim()) || existingContactInfo[key]) {
          cleanedContactInfo[key] = form[key]?.trim() || existingContactInfo[key];
        }
      }

      const categoryDtoField = CATEGORY_DTO_FIELD_BY_LABEL[ad?.category] || null;
      const categoryPayload = buildTypedCategoryPayload(categoryDraft, categoryTypeMap);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseNumberInput(form.price, parseNumberInput(ad?.price, 0)),
        location: form.location.trim() || ad?.location || "",
        images: uploadedImages,
        contactInfo: cleanedContactInfo,
        ...(categoryDtoField ? { [categoryDtoField]: categoryPayload } : {}),
        // Do NOT include categorySpecificData
      };

      await updateAd(resolvedAdId, payload);

      Alert.alert("Success", "Ad updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Update failed", error?.message || "Unable to update ad");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#157a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
       <LinearGradient
                      colors={["#f8a812", "#fad081", "#f8f6f265"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                  />
      <Topbar />
  
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} >
          <MaterialIcons name="arrow-back-ios" size={22} style={{ padding:10 }} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Ad</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ height: 1, backgroundColor: "#000000", marginVertical:6 }} />

      <ScrollView contentContainerStyle={styles.content} style={{ backgroundColor: colors.background }}>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Ad Details</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(text) => onChange("title", text)}
          placeholder="Enter title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(text) => onChange("description", text)}
          placeholder="Enter description"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={form.price}
          onChangeText={(text) => onChange("price", text)}
          keyboardType="numeric"
          placeholder="Enter price"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={(text) => onChange("location", text)}
          placeholder="Enter location"
        />

        <Text style={styles.label}>Contact Name</Text>
        <TextInput
          style={styles.input}
          value={form.contactName}
          onChangeText={(text) => onChange("contactName", text)}
          placeholder="Enter contact person"
        />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={form.contactPhone}
          onChangeText={(text) => onChange("contactPhone", text)}
          keyboardType="phone-pad"
          placeholder="Enter phone number"
        />

        {showImageSection ? (
          <>
            <Text style={styles.sectionTitle}>Images</Text>
            <View style={styles.imageList}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageTileWrap}>
                  <Image source={{ uri }} style={styles.imageTile} />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => removeImageAt(index)}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={pickImages}>
              <Text style={styles.secondaryBtnText}>{allowsMultipleImages ? "Add Images" : "Add Image"}</Text>
            </TouchableOpacity>

            {!allowsMultipleImages ? (
              <Text style={styles.helperText}>Only one image is allowed for this template.</Text>
            ) : null}
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Category Details</Text>
        {!Object.keys(categoryDraft).length && (
          <Text style={styles.emptyText}>No category-specific fields found for this ad.</Text>
        )}

        {Object.keys(categoryDraft).map((key) => {
          const fieldType = categoryTypeMap[key];

          if (fieldType === "boolean") {
            return (
              <View key={key} style={styles.switchRow}>
                <Text style={[styles.label, { marginTop: 0 }]}>{prettifyKey(key)}</Text>
                <Switch
                  value={Boolean(categoryDraft[key])}
                  onValueChange={(value) => onCategoryFieldChange(key, value)}
                />
              </View>
            );
          }

          return (
            <View key={key}>
              <Text style={styles.label}>{prettifyKey(key)}</Text>
              <TextInput
                style={styles.input}
                value={String(categoryDraft[key] || "")}
                onChangeText={(text) => onCategoryFieldChange(key, text)}
                placeholder={`Enter ${prettifyKey(key)}`}
                multiline={fieldType === "json"}
                textAlignVertical={fieldType === "json" ? "top" : "center"}
              />
            </View>
          );
        })}

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Update Ad</Text>}
        </TouchableOpacity>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }} >
        <ChojaBottom />
      </SafeAreaView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Medium",
    lineHeight: Math.round(22 * 1.0),
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom:110,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    marginTop: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  textArea: {
    minHeight: 100,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#111",
    marginBottom: 8,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
  imageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageTileWrap: {
    position: "relative",
  },
  imageTile: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
  },
  imageRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#cfcfcf",
  },
  secondaryBtnText: {
    color: "#157a4f",
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 6,
  },
  emptyText: {
    color: "#666",
    fontFamily: "Medium",
    marginBottom: 4,
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: "#157a4f",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
});