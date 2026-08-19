import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateAd } from "../services/analyticsService";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";
import { getValidToken } from "../services/authService";
import RatingsBox from "../components/RatingsBox";

// Category-specific form components
import AstrologyForm from "../components/Astrology";
import BusinessForm from "../components/Business";
import EducationForm from "../components/Education";
import ElectronicsForm from "../components/Electronics";
import EmploymentForm from "../components/Employment";
import FurnitureForm from "../components/Furniture";
import GreetingsForm from "../components/Greetings";
import LostandFoundForm from "../components/LostandFound";
import MatrimonialForm from "../components/Matrimonial";
import MobilesForm from "../components/Mobiles";
import OthersForm from "../components/Others";
import PersonalForm from "../components/Personal";
import PetsForm from "../components/Pets";
import PropertyForm from "../components/Property";
import ServiceForm from "../components/Service";
import TravelForm from "../components/Travel";
import VehiclesForm from "../components/Vehicles";

// Maps ad.category label → component category.id (used by each form's guard)
const CATEGORY_ID_MAP = {
  Vehicle: "vehicles",
  Property: "property",
  Service: "service",
  Mobiles: "mobiles",
  "Electronics & Home appliances": "electronics_home",
  Furniture: "furniture",
  Education: "education",
  Pets: "pets",
  Matrimonial: "matrimonial",
  Business: "business",
  Travel: "travel",
  Astrology: "astrology",
  Employment: "employment",
  "Lost & Found": "lostandfound",
  Personal: "personal",
  Greetings: "greetings",
  "Greetings & Tributes": "greetings",
  Others: "others",
  Other: "others",
};

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

function isRemoteUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getFileMetaFromUri(uri) {
  const fileName = uri?.split("/")?.pop() || `ad-${Date.now()}.jpg`;
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  const ext = (match?.[1] || "jpg").toLowerCase();
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { fileName, mimeType };
}

function getErrorMessageFromResponse(data) {
  const candidates = [];
  const pushValue = (value) => {
    if (typeof value === "string" && value.trim()) {
      candidates.push(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(pushValue);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(pushValue);
    }
  };
  if (typeof data === "string" && data.trim()) return data.trim();
  pushValue(data?.message);
  pushValue(data?.error);
  pushValue(data?.details);
  return candidates.join(" ");
}

function isModerationFailureResponse(data) {
  const message = getErrorMessageFromResponse(data).toLowerCase();
  return [
    "inappropriate",
    "moderation",
    "flagged",
    "content policy",
    "cannot be uploaded",
    "policy violation",
    "violat",
    "unsafe",
  ].some((token) => message.includes(token));
}

const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

async function uploadAdImageToCloud(uri) {
  if (!uri) return null;
  if (isRemoteUrl(uri)) return uri;
  const { fileName, mimeType } = getFileMetaFromUri(uri);
  const uploadBody = new FormData();
  uploadBody.append("file", { uri, name: fileName, type: mimeType });
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

function parseNumberInput(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function AdEdit({ route, navigation }) {
  const { adId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ad, setAd] = useState(null);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({});
  const [flaggedModalVisible, setFlaggedModalVisible] = useState(false);

  const [restrictionModalVisible, setRestrictionModalVisible] = useState(false);
  const [restrictionUntil, setRestrictionUntil] = useState(null);
  const [countdownText, setCountdownText] = useState("");

  const colors = useContext(ThemeContext);

  const templateNumber = useMemo(() => {
    const parsed = Number(ad?.templateId ?? ad?.template ?? 1);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [ad?.templateId, ad?.template]);

  const showImageSection = templateNumber === 1 || templateNumber === 2;
  const allowsMultipleImages = templateNumber === 1;

  // Derive the category object expected by each form component
  const categoryObj = useMemo(() => {
    const label = ad?.category || "";
    const id = CATEGORY_ID_MAP[label] || label.toLowerCase();
    return { id, label };
  }, [ad?.category]);

  useEffect(() => {
    const checkRestrictionStatus = async () => {
      try {
        const customerId = await AsyncStorage.getItem("customerId") || "default";
        const restrictionKey = `golo_restricted_until:${customerId}`;
        const flaggedKey = `golo_images_flagged:${customerId}`;
        const untilStr = await AsyncStorage.getItem(restrictionKey);
        if (untilStr) {
          const untilDate = new Date(untilStr);
          if (untilDate > new Date()) {
            setRestrictionUntil(untilDate);
            setRestrictionModalVisible(true);
          } else {
            await AsyncStorage.removeItem(restrictionKey);
            await AsyncStorage.removeItem(flaggedKey);
            setRestrictionUntil(null);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkRestrictionStatus();
  }, []);

  useEffect(() => {
    if (!restrictionUntil) {
      setCountdownText("");
      return;
    }
    const updateTimer = async () => {
      const now = new Date();
      const diffMs = restrictionUntil - now;
      if (diffMs <= 0) {
        setRestrictionUntil(null);
        setCountdownText("");
        setRestrictionModalVisible(false);
        try {
          const customerId = await AsyncStorage.getItem("customerId") || "default";
          await AsyncStorage.removeItem(`golo_restricted_until:${customerId}`);
          await AsyncStorage.removeItem(`golo_images_flagged:${customerId}`);
        } catch (e) { }
        return;
      }
      const hrs = String(Math.floor(diffMs / 3600000)).padStart(2, "0");
      const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, "0");
      const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, "0");
      setCountdownText(`${hrs}:${mins}:${secs}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [restrictionUntil]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        if (!adId) {
          Alert.alert("Error", "Ad id is missing");
          navigation.goBack();
          return;
        }
        const response = await fetch(
          `${BASE_URL}/ads/${encodeURIComponent(adId)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success || !data?.data) {
          throw new Error(data?.message || "Failed to load ad details");
        }
        const fetchedAd = data.data;
        const categoryDtoField =
          CATEGORY_DTO_FIELD_BY_LABEL[fetchedAd?.category] || null;

        const rawCategorySource = {
          ...(categoryDtoField ? (fetchedAd?.[categoryDtoField] || {}) : {}),
          ...(fetchedAd?.categorySpecificData || {}),
        };

        const categorySource = {};
        Object.entries(rawCategorySource).forEach(([key, val]) => {
          if (val != null) {
            categorySource[key] = typeof val === "number" ? String(val) : val;
          }
        });

        // Vehicle field alias & string conversion normalization
        if (fetchedAd?.category === "Vehicle") {
          const kmVal =
            categorySource.kilometersDriven ??
            categorySource.kmDriven ??
            categorySource.kmsDriven ??
            categorySource.km_driven;
          if (kmVal != null) {
            categorySource.kilometersDriven = String(kmVal);
          }
          const yearVal =
            categorySource.year ?? categorySource.yearOfRegistration;
          if (yearVal != null) {
            categorySource.year = String(yearVal);
          }
        }

        const fetchedImages = Array.isArray(fetchedAd?.images)
          ? fetchedAd.images
          : [];
        const normalizedImages =
          Number(fetchedAd?.templateId ?? fetchedAd?.template ?? 1) === 2
            ? fetchedImages.slice(0, 1)
            : fetchedImages;

        // Build formData from ad fields + category-specific data
        const initialFormData = {
          heading: fetchedAd?.title || "",
          body: fetchedAd?.description || "",
          price: fetchedAd?.price != null ? String(fetchedAd.price) : "",
          location: fetchedAd?.location || "",
          contact: fetchedAd?.contactInfo?.phone || "",
          contactPerson: fetchedAd?.contactInfo?.name || "",
          images: normalizedImages,
          ...(categorySource || {}),
        };

        setAd(fetchedAd);
        setImages(normalizedImages);
        setFormData(initialFormData);
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load ad details");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [adId]);

  const pickImages = async () => {
    if (restrictionUntil && restrictionUntil > new Date()) {
      setRestrictionModalVisible(true);
      return;
    }
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow gallery access to upload images"
      );
      return;
    }
    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can upload up to 5 images only.");
      return;
    }
    const remainingSlots = 5 - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions
        ? ImagePicker.MediaTypeOptions.Images
        : "Images",
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: remainingSlots,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const selectedUris = result.assets
        .map((a) => a.uri)
        .filter(Boolean)
        .slice(0, remainingSlots);
      const incoming = allowsMultipleImages
        ? selectedUris
        : selectedUris.slice(0, 1);
      setImages((prev) => {
        const combined = [...prev, ...incoming];
        return allowsMultipleImages ? combined.slice(0, 5) : combined.slice(0, 1);
      });
      setFormData((prev) => {
        const combined = [...(prev.images || []), ...incoming];
        return {
          ...prev,
          images: allowsMultipleImages
            ? combined.slice(0, 5)
            : combined.slice(0, 1),
        };
      });
    }
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    const customerId = await AsyncStorage.getItem("customerId") || "default";
    if (restrictionUntil && restrictionUntil > new Date()) {
      setRestrictionModalVisible(true);
      return;
    }
    try {
      if (!formData.heading?.trim()) {
        Alert.alert("Validation", "Title is required");
        return;
      }
      if (!formData.body?.trim()) {
        Alert.alert("Validation", "Description is required");
        return;
      }

      const resolvedAdId = ad?.adId || ad?._id || adId;
      if (!resolvedAdId) {
        Alert.alert("Error", "Ad id is missing");
        return;
      }

      setSaving(true);

      let token = "";
      try {
        token = await getValidToken();
      } catch {
        // session expired
      }
      if (!token) throw new Error("Please login again to update ad");

      // Upload images and check moderation
      const uploadedImages = [];
      if (showImageSection) {
        for (const imageUri of images) {
          try {
            const uploaded = await uploadAdImageToCloud(imageUri);
            if (uploaded) uploadedImages.push(uploaded);
          } catch (uploadError) {
            const msg = uploadError?.message || "";
            if (isModerationFailureResponse(msg) || msg.toLowerCase().includes("image")) {
              await AsyncStorage.setItem(`golo_images_flagged:${customerId}`, "true").catch(() => { });
              setFlaggedModalVisible(true);
              setSaving(false);
              return;
            }
            throw uploadError;
          }
        }
      }

      const existingContactInfo = ad?.contactInfo || {};
      const allowedContactFields = [
        "name", "phone", "email", "whatsapp", "website", "preferredContactMethod",
      ];
      const cleanedContactInfo = {};
      for (const key of allowedContactFields) {
        const val =
          key === "name"
            ? formData.contactPerson || existingContactInfo.name
            : key === "phone"
              ? formData.contact || existingContactInfo.phone
              : existingContactInfo[key];
        if (val && typeof val === "string" && val.trim()) {
          cleanedContactInfo[key] = val.trim();
        }
      }

      const categoryDtoField =
        CATEGORY_DTO_FIELD_BY_LABEL[ad?.category] || null;

      // Build category payload from formData (excluding top-level fields)
      const EXCLUDED = new Set([
        "heading", "body", "price", "location", "contact", "contactPerson",
        "image", "images",
      ]);
      const NUMERIC_CATEGORY_FIELDS = new Set([
        "year", "kilometersDriven", "perDayRentAmount", "securityDeposit",
      ]);
      const categoryPayload = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (EXCLUDED.has(key)) return;
        if (value == null) return;
        if (typeof value === "string" && value.trim() === "") return;
        if (Array.isArray(value) && value.length === 0) return;
        if (NUMERIC_CATEGORY_FIELDS.has(key) && typeof value === "string" && !isNaN(Number(value))) {
          categoryPayload[key] = Number(value);
        } else {
          categoryPayload[key] = value;
        }
      });

      const payload = {
        title: formData.heading.trim(),
        description: formData.body.trim(),
        price: parseNumberInput(formData.price, parseNumberInput(ad?.price, 0)),
        location: formData.location?.trim() || ad?.location || "",
        images: uploadedImages,
        contactInfo: cleanedContactInfo,
        ...(categoryDtoField ? { [categoryDtoField]: categoryPayload } : {}),
      };

      const response = await fetch(`${BASE_URL}/ads/${resolvedAdId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text().catch(() => "");
      let data = {};
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }

      const responseMsg = getErrorMessageFromResponse(data) || rawText.trim();

      const isRestricted = response.status === 403
        || data?.code === "CONTENT_UPLOAD_RESTRICTED"
        || responseMsg.toLowerCase().includes("temporarily restricted")
        || responseMsg.toLowerCase().includes("upload restriction");
      if (isRestricted) {
        const until = data?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
        try {
          await AsyncStorage.setItem(`golo_restricted_until:${customerId}`, until);
        } catch (error) { }
        setRestrictionUntil(new Date(until));
        setRestrictionModalVisible(true);
        return;
      }

      const moderationDetected =
        isModerationFailureResponse(data) ||
        isModerationFailureResponse(responseMsg) ||
        (response.status === 400 && responseMsg.toLowerCase().includes("image"));

      if (moderationDetected) {
        await AsyncStorage.setItem(`golo_images_flagged:${customerId}`, "true").catch(() => { });
        setFlaggedModalVisible(true);
        return;
      }

      if (!response.ok || data?.success === false) {
        Alert.alert("Failed", responseMsg || "Failed to update ad.");
        return;
      }

      await AsyncStorage.removeItem(`golo_images_flagged:${customerId}`).catch(() => { });
      Alert.alert("Success", "Ad updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
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

  // Shared props passed to all category form components
  const sharedFormProps = {
    formData,
    setFormData,
    category: categoryObj,
    onPrevious: () => navigation.goBack(),
    isEditMode: true,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          height: 220,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
        }}
      />
      <Topbar />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Ad
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ height: 1, backgroundColor: "#000000", marginVertical: 6 }} />

      <ScrollView
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      >
        {/* ── Image Section ── */}
        {showImageSection && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.imageList}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageTileWrap}>
                  <Image source={{ uri }} style={styles.imageTile} />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => removeImageAt(index)} >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add image tile */}
              {images.length < (allowsMultipleImages ? 5 : 1) && (
                <TouchableOpacity
                  style={styles.addImageTile}
                  onPress={pickImages}
                >
                  <MaterialIcons name="add-photo-alternate" size={28} color="#888" />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            {!allowsMultipleImages && (
              <Text style={styles.helperText}>
                Only one image is allowed for this template.
              </Text>
            )}
          </View>
        )}

        {/* ── Basic Details ── */}
        <View style={styles.basicSection}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.basicCard}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.heading || ""}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, heading: text }))}
              placeholder="Ad title"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea]}
              value={formData.body || ""}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, body: text }))}
              placeholder="Describe your ad"
              placeholderTextColor="#aaa"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Price</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.price || ""}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
              placeholder="Enter price"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.location || ""}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, location: text }))}
              placeholder="Enter location"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Contact Phone</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.contact || ""}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, contact: text }))}
              placeholder="Enter phone number"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ── Category-Specific Form ── */}
        <View style={styles.formWrapper}>
          <AstrologyForm {...sharedFormProps} />
          <BusinessForm {...sharedFormProps} />
          <EducationForm {...sharedFormProps} />
          <ElectronicsForm {...sharedFormProps} />
          <EmploymentForm {...sharedFormProps} />
          <FurnitureForm {...sharedFormProps} />
          <GreetingsForm {...sharedFormProps} />
          <LostandFoundForm {...sharedFormProps} />
          <MatrimonialForm {...sharedFormProps} />
          <MobilesForm {...sharedFormProps} />
          <OthersForm {...sharedFormProps} />
          <PersonalForm {...sharedFormProps} />
          <PetsForm {...sharedFormProps} />
          <PropertyForm {...sharedFormProps} />
          <ServiceForm {...sharedFormProps} />
          <TravelForm {...sharedFormProps} />
          <VehiclesForm {...sharedFormProps} />
        </View>

        {/* ── Update Button ── */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Update Ad</Text>
          )}
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <MaterialIcons
            name="info-outline"
            size={18}
            color="#9a6700"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.noticeText}>
            You can edit this ad only once. Please review all details carefully
            before updating.
          </Text>
        </View>
      </ScrollView>

      {/* Moderation restriction countdown modal */}
      <Modal
        visible={restrictionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
        statusBarTranslucent
      >
        <View style={styles.flaggedOverlay}>
          <View style={styles.flaggedCard}>
            {/* Header row: warning icon + title + close */}
            <View style={styles.flaggedHeaderRow}>
              <View style={styles.flaggedHeaderTextWrap}>
                <View style={styles.flaggedHeaderIconCircle}>
                  <Feather name="clock" size={14} color="#d92d20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedHeaderTitle}>Uploading Restricted</Text>
                  <Text style={styles.flaggedHeaderSubtitle}>
                    Temporary block due to multiple policy violations.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setRestrictionModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            {/* Centered big clock icon */}
            <View style={styles.flaggedIconWrap}>
              <View style={styles.flaggedIconCircle}>
                <Feather name="lock" size={30} color="#d92d20" />
              </View>
            </View>

            <Text style={styles.flaggedTitle}>Upload Limit Exceeded</Text>
            <Text style={styles.flaggedDescription}>
              You have been temporarily restricted from uploading content due to multiple inappropriate image submissions. Please wait for the timer to expire.
            </Text>

            {/* Live Countdown Timer UI */}
            <View style={{
              backgroundColor: "#fef3f2",
              borderColor: "#fda29b",
              borderWidth: 1,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginVertical: 16,
            }}>
              <Text style={{
                letterSpacing: 2,
                color: "#d92d20",
                lineHeight: Math.round(14 * 1.5),
                ...textPresets.body
              }}>
                {countdownText || "00:00:00"}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.flaggedButton, { backgroundColor: "#d92d20" }]}
              onPress={() => setRestrictionModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Image Moderation Modal (from Payment.js) ── */}
      <Modal
        visible={flaggedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
        statusBarTranslucent
      >
        <View style={styles.flaggedOverlay}>
          <View style={styles.flaggedCard}>
            <View style={styles.flaggedHeaderRow}>
              <View style={styles.flaggedHeaderTextWrap}>
                <View style={styles.flaggedHeaderIconCircle}>
                  <Feather name="alert-triangle" size={14} color="#d92d20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedHeaderTitle}>
                    Inappropriate Content
                  </Text>
                  <Text style={styles.flaggedHeaderSubtitle}>
                    Your image has been flagged by our safety system.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setFlaggedModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            <View style={styles.flaggedIconWrap}>
              <View style={styles.flaggedIconCircle}>
                <Feather name="shield" size={30} color="#d92d20" />
              </View>
            </View>

            <Text style={styles.flaggedTitle}>Upload Rejected</Text>
            <Text style={styles.flaggedDescription}>
              One or more of your uploaded images contains content that violates
              our community guidelines. Please remove the inappropriate images
              and try updating again.
            </Text>

            <TouchableOpacity
              style={styles.flaggedButton}
              onPress={() => setFlaggedModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }}
      >
        <ChojaBottom />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  headerTitle: {
    flex: 1,
    ...textPresets.title
  },
  content: { paddingHorizontal: 14, paddingBottom: 100 },
  // Image section
  imageSection: { marginTop: 10, marginBottom: 8 },
  sectionTitle: {
    color: "#111",
    marginBottom: 10,
    ...textPresets.subtitle
  },
  imageList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageTileWrap: { position: "relative" },
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
  addImageTile: {
    width: 84,
    height: 84,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  addImageText: { ...textPresets.caption, color: "#888", marginTop: 2 },
  helperText: { ...textPresets.label, color: "#888", marginTop: 6 },

  // Basic details section
  basicSection: { marginTop: 12, marginBottom: 4 },
  basicCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  fieldLabel: {
    ...textPresets.body,
    marginTop: 16,
    lineHeight: Math.round(14 * 1.5),
    color: "#333",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    ...textPresets.body,
    color: "#111",
  },
  fieldTextArea: {
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: "top",
  },

  // Form wrapper
  formWrapper: { marginTop: 4 },

  // Submit button
  submitBtn: {
    marginTop: 24,
    backgroundColor: "#157a4f",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  submitText: {
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    color: "#fff",
  },
  // Notice box
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#f3d98a",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    color: "#7a5b00",
    ...textPresets.label
  },

  // Moderation modal (mirrored from Payment.js)
  flaggedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  flaggedCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  flaggedHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  flaggedHeaderTextWrap: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  flaggedHeaderIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fef3f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  flaggedHeaderTitle: {
    ...textPresets.body,
    color: "#111",
    lineHeight: Math.round(14 * 1.4),
  },
  flaggedHeaderSubtitle: {
    ...textPresets.caption,
    color: "#666",
    marginTop: 3,
  },
  flaggedIconWrap: { alignItems: "center", marginBottom: 12 },
  flaggedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef3f2",
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedTitle: {
    ...textPresets.subtitle,
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  flaggedDescription: {
    ...textPresets.label,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  flaggedButton: {
    backgroundColor: "#d92d20",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  flaggedButtonText: {
    color: "#fff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
});