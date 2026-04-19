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
import { submitReport } from "../services/reportService";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";

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
  Others: "othersData",
  "Public Notice": "publicNoticeData",
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

async function uploadAdImageToCloud(uri, token, baseUrl) {
  if (!uri) return null;
  if (isRemoteUrl(uri)) return uri;

  const { fileName, mimeType } = getFileMetaFromUri(uri);
  const uploadBody = new FormData();
  uploadBody.append("file", {
    uri,
    name: fileName,
    type: mimeType,
  });

  const response = await fetch(`${baseUrl}/ads/upload/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: uploadBody,
  });

  const data = await response.json().catch(() => ({}));
  const imageUrl = data?.data?.url;

  if (!response.ok || !imageUrl) {
    throw new Error(data?.message || "Failed to upload image");
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
    // Handler to submit ad report
    const handleReportAd = async () => {
      if (!ad) {
        Alert.alert("Error", "Ad not loaded");
        return;
      }
      if (!reportReason.trim()) {
        Alert.alert("Validation", "Please enter a reason for reporting this ad.");
        return;
      }
      setReporting(true);
      try {
        await submitReport("ad", getResolvedAdId(ad, adId), reportReason.trim(), "");
        setShowReportBox(false);
        setReportReason("");
        Alert.alert("Reported", "Thank you for reporting. Our team will review this ad.");
      } catch (error) {
        Alert.alert("Report failed", error?.message || "Unable to submit report");
      } finally {
        setReporting(false);
      }
    };
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

  const baseUrl = useMemo(
    () => (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, ""),
    [],
  );

  const colors = useContext(ThemeContext);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        if (!adId) {
          Alert.alert("Error", "Ad id is missing");
          navigation.goBack();
          return;
        }

        if (!baseUrl) {
          throw new Error("EXPO_PUBLIC_API_URL is not configured");
        }

        const response = await fetch(`${baseUrl}/ads/${encodeURIComponent(adId)}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success || !data?.data) {
          throw new Error(data?.message || "Failed to load ad details");
        }

        const fetchedAd = data.data;
        const categoryDtoField = CATEGORY_DTO_FIELD_BY_LABEL[fetchedAd?.category] || null;
        const categorySource = fetchedAd?.categorySpecificData || (categoryDtoField ? fetchedAd?.[categoryDtoField] : null) || {};
        const editorData = buildCategoryEditorData(categorySource);

        setAd(fetchedAd);
        setImages(Array.isArray(fetchedAd?.images) ? fetchedAd.images : []);
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
  }, [adId, baseUrl, navigation]);

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
      setImages((prev) => [...prev, ...selectedUris]);
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

      if (!baseUrl) {
        throw new Error("EXPO_PUBLIC_API_URL is not configured");
      }

      const uploadedImages = [];
      for (const imageUri of images) {
        const uploaded = await uploadAdImageToCloud(imageUri, token, baseUrl);
        if (uploaded) uploadedImages.push(uploaded);
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
      <Topbar />
      {/* Report Ad Button */}
      <View style={{ alignItems: "flex-end", margin: 10 }}>
        <TouchableOpacity
          style={{ backgroundColor: "#e53935", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
          onPress={() => setShowReportBox((v) => !v)}
        >
          <Text style={{ color: "#fff", fontFamily: "Medium" }}>Report This Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Report Reason Box */}
      {showReportBox && (
        <View style={{ backgroundColor: "#fff0f0", borderRadius: 10, margin: 10, padding: 12, borderWidth: 1, borderColor: "#e53935" }}>
          <Text style={{ color: "#e53935", fontFamily: "Medium", marginBottom: 6 }}>Reason for reporting:</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: "#e53935", borderRadius: 8, padding: 8, backgroundColor: "#fff", marginBottom: 10 }}
            value={reportReason}
            onChangeText={setReportReason}
            placeholder="Enter reason (required)"
            multiline
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#cfcfcf", marginRight: 8 }}
              onPress={() => { setShowReportBox(false); setReportReason(""); }}
              disabled={reporting}
            >
              <Text style={{ color: "#333" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#e53935" }}
              onPress={handleReportAd}
              disabled={reporting}
            >
              {reporting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff" }}>Submit Report</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Ad</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ height: 1, backgroundColor: "#050505" }} />

      <ScrollView contentContainerStyle={styles.content}>

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
          <Text style={styles.secondaryBtnText}>Add Images</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Medium",
    lineHeight: Math.round(22 * 1.5),
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 85,
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