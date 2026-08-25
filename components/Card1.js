import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Dimensions, Image, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback, Modal
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

function formatRestrictionUntil(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

export default function Card1({ category, formData, setFormData, onNext }) {
  // images is an array
  const images = formData.images || [];

  const [restrictionModalVisible, setRestrictionModalVisible] = useState(false);
  const [restrictionUntil, setRestrictionUntil] = useState(null);
  const [countdownText, setCountdownText] = useState("");
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

  useEffect(() => {
    let interval;
    if (restrictionUntil) {
      interval = setInterval(async () => {
        const diffMs = restrictionUntil.getTime() - Date.now();
        if (diffMs <= 0) {
          clearInterval(interval);
          setRestrictionUntil(null);
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
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restrictionUntil]);

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
          } else {
            await AsyncStorage.removeItem(restrictionKey);
            await AsyncStorage.removeItem(flaggedKey);
            setRestrictionUntil(null);
          }
        } else {
          setRestrictionUntil(null);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkRestrictionStatus();
  }, []);

  // --- Location suggestion state (same pattern as CalendarScreen.js) ---
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceTimer = useRef(null);

  // Fetch rich address suggestions via OpenStreetMap Nominatim
  // — returns neighbourhood/area-level results (e.g. "Laxmipuri, Kolhapur, Maharashtra")
  const fetchLocationSuggestions = useCallback(async (query) => {
    const trimmed = (query || "").trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const params = new URLSearchParams({
        q: trimmed,
        format: "json",
        addressdetails: "1",
        limit: "8",
        "accept-language": "en",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "GoloCustomerApp/1.0",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

      const data = await response.json();

      const suggestions = (data || []).map((item, idx) => {
        const addr = item.address || {};
        const parts = [
          addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.building || addr.place,
          addr.house_number,
          addr.road || addr.pedestrian || addr.footway || addr.street,
          addr.neighbourhood,
          addr.suburb,
          addr.quarter,
          addr.city_district,
          addr.village,
          addr.town,
          addr.city,
          addr.district,
          addr.county,
          addr.state_district,
          addr.state,
          addr.postcode,
          addr.country,
        ].filter(Boolean);

        const cleanParts = parts.map(p => String(p).trim()).filter(Boolean);
        const uniqueParts = [];
        for (const part of cleanParts) {
          if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
            uniqueParts.push(part);
          }
        }
        const resolvedLabel = uniqueParts.join(", ");

        return {
          id: `${item.place_id || idx}`,
          label: resolvedLabel || item.display_name || trimmed,
        };
      });

      // Deduplicate by label
      const seen = new Set();
      const unique = suggestions.filter((s) => {
        if (seen.has(s.label)) return false;
        seen.add(s.label);
        return true;
      });

      setLocationSuggestions(unique);
    } catch (err) {
      console.error("Location suggestion error:", err);
      setLocationSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleLocationInputChange = useCallback((text) => {
    setFormData({ ...formData, location: text });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    // 400ms debounce — responsive but avoids hammering Nominatim
    debounceTimer.current = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 400);
  }, [fetchLocationSuggestions, formData, setFormData]);

  const handleSelectSuggestion = useCallback((suggestion) => {
    setFormData({ ...formData, location: suggestion.label });
    setLocationSuggestions([]);
    Keyboard.dismiss();
  }, [formData, setFormData]);

  const pickImages = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId") || "default";
      const untilStr = await AsyncStorage.getItem(`golo_restricted_until:${customerId}`);
      if (untilStr && new Date(untilStr) > new Date()) {
        setRestrictionUntil(new Date(untilStr));
        setRestrictionModalVisible(true);
        return;
      }
    } catch (e) { }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload images");
      return;
    }

    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can upload up to 5 images only.");
      return;
    }

    const remainingSlots = 5 - images.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      // Support both deprecated MediaTypeOptions and newer MediaType API
      mediaTypes: ImagePicker.MediaTypeOptions
        ? ImagePicker.MediaTypeOptions.Images
        : "Images",
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uris = result.assets.map((a) => a.uri).slice(0, remainingSlots);
      setFormData({ ...formData, images: [...images, ...uris] });
      // user replaced images -> clear flagged marker
      try {
        const customerId = await AsyncStorage.getItem("customerId") || "default";
        await AsyncStorage.removeItem(`golo_images_flagged:${customerId}`);
      } catch (e) { }
    }
  };

  const openCamera = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId") || "default";
      const untilStr = await AsyncStorage.getItem(`golo_restricted_until:${customerId}`);
      if (untilStr && new Date(untilStr) > new Date()) {
        setRestrictionUntil(new Date(untilStr));
        setRestrictionModalVisible(true);
        return;
      }
    } catch (e) { }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to take photo");
      return;
    }

    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can upload up to 5 images only.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled) {
      setFormData({ ...formData, images: [...images, result.assets[0].uri] });
      try {
        const customerId = await AsyncStorage.getItem("customerId") || "default";
        await AsyncStorage.removeItem(`golo_images_flagged:${customerId}`);
      } catch (e) { }
    }
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated });
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.composeTitle}>Basic Details</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{category?.label || category}</Text>

          <Text style={styles.label}>Heading <Text style={{ color: "#d92d20" }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.heading}
            onChangeText={(text) => setFormData({ ...formData, heading: text })}
            placeholder="Type your heading here..."
          />

          <Text style={styles.label}>Body text <Text style={{ color: "#d92d20" }}>*</Text></Text>
          <TextInput
            style={styles.descriptionInput}
            value={formData.body}
            onChangeText={(text) => setFormData({ ...formData, body: text })}
            multiline
            placeholder="Type your description here..."
            scrollEnabled
          />

          <Text style={styles.label}>Location <Text style={{ color: "#d92d20" }}>*</Text></Text>
          <View style={{ position: "relative", zIndex: 100 }}>
            <View style={styles.locationInputWrapper}>
              <TextInput
                style={styles.locationInput}
                value={formData.location}
                onChangeText={handleLocationInputChange}
                placeholder="Type your Location here..."
              />
              {suggestionsLoading && (
                <ActivityIndicator size="small" color="#157a4f" style={{ marginRight: 10 }} />
              )}
            </View>

            {/* Suggestions dropdown — overlays everything below the input */}
            {locationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 240 }}
                >
                  {locationSuggestions.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="location-on" size={16} color="#157a4f" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={styles.label}>Contact no. <Text style={{ color: "#d92d20" }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.contact}
            onChangeText={(text) => setFormData({ ...formData, contact: text })}
            keyboardType="phone-pad"
            placeholder="10 digit mobile number"
          />

          <Text style={styles.label}>Add Images <Text style={{ color: "#d92d20" }}>*</Text></Text>
          <View style={styles.uploadBox}>
            <TouchableOpacity onPress={pickImages} style={{ alignItems: "center" }}>
              <Ionicons name="cloud-upload-outline" size={28} color="#555" />
              <Text style={styles.uploadText}>Upload images from gallery</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
              <Text style={styles.cameraText}>Open Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Show selected images with remove button */}
          {images.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 }}>
              {images.map((uri, idx) => (
                <View key={idx} style={{ position: "relative" }}>
                  <Image
                    source={{ uri }}
                    style={{ width: 90, height: 90, borderRadius: 8 }}
                  />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(idx)}
                  >
                    <Ionicons name="close-circle" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            const heading = (formData.heading || "").trim();
            const body = (formData.body || "").trim();
            const location = (formData.location || "").trim();
            const contact = (formData.contact || "").trim();
            const hasImages = images.length > 0;
            if (!heading) {
              setAlertConfig({
                visible: true,
                title: "Missing Information",
                message: "Please fill in the ad heading before proceeding.",
                type: "warning"
              });
              return;
            }
            if (!body) {
              setAlertConfig({
                visible: true,
                title: "Missing Information",
                message: "Please fill in the body text before proceeding.",
                type: "warning"
              });
              return;
            }
            if (!location) {
              setAlertConfig({
                visible: true,
                title: "Missing Information",
                message: "Please fill in the location before proceeding.",
                type: "warning"
              });
              return;
            }
            if (!contact) {
              setAlertConfig({
                visible: true,
                title: "Missing Information",
                message: "Please fill in the contact number before proceeding.",
                type: "warning"
              });
              return;
            }
            if (!hasImages) {
              setAlertConfig({
                visible: true,
                title: "Missing Image",
                message: "Please select at least one image for the ad before proceeding.",
                type: "warning"
              });
              return;
            }
            onNext && onNext();
          }}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>

        <Modal
          visible={restrictionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRestrictionModalVisible(false)}
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

              {/* Centered big lock icon */}
              <View style={styles.flaggedIconWrap}>
                <View style={styles.flaggedIconCircle}>
                  <Feather name="lock" size={30} color="#d92d20" />
                </View>
              </View>

              <Text style={styles.flaggedTitle}>Upload Limit Exceeded</Text>
              <Text style={styles.flaggedDescription}>
                You have been temporarily restricted from uploading content due to multiple inappropriate image submissions. Your restriction will be removed at the date and time shown below.
              </Text>

              {/* Restriction End Date & Time UI */}
              <View style={{
                backgroundColor: "#fef3f2",
                borderColor: "#fda29b",
                borderWidth: 1,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginVertical: 16,
              }}>
                <Text style={{
                  ...textPresets.caption,
                  color: "#b42318",
                  letterSpacing: 1,
                  marginBottom: 4,
                  textTransform: "uppercase"
                }}>
                  Restriction End Date & Time
                </Text>
                <Text style={{
                  ...textPresets.label,
                  color: "#d92d20",
                  textAlign: "center"
                }}>
                  {formatRestrictionUntil(restrictionUntil) || "N/A"}
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

        <CustomAlertModal
          visible={alertConfig.visible}
          type={alertConfig.type || "warning"}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  composeTitle: { ...textPresets.subtitle, marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { ...textPresets.body, marginTop: 10, lineHeight: Math.round(14 * 1.5) },
  value: { ...textPresets.body, color: "#555", lineHeight: Math.round(14 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, ...textPresets.body },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,      // Increased height
    maxHeight: 100,      // Keeps the box fixed after this height
    textAlignVertical: "top",
    ...textPresets.body
  },
  locationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 6,
  },
  locationInput: {
    flex: 1,
    padding: 10,
    ...textPresets.body
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5c47a",
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5e9cf",
  },
  suggestionText: {
    flex: 1,
    color: "#333",
    ...textPresets.label
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#aaa",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  uploadText: { marginTop: 6, color: "#555", ...textPresets.label },
  orText: { marginVertical: 6, color: "#999", ...textPresets.label },
  cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  cameraText: { color: "#fff", ...textPresets.label },
  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", ...textPresets.body, },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 11,
  },
  flaggedOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  flaggedCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  flaggedHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  flaggedHeaderTextWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: 12,
  },
  flaggedHeaderIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  flaggedHeaderTitle: {
    color: "#1a1a1a",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
  flaggedHeaderSubtitle: {
    ...textPresets.caption,
    color: "#8a8a8a",
    marginTop: 3,
  },
  flaggedIconWrap: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  flaggedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedTitle: {
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
    ...textPresets.subtitle,
  },
  flaggedDescription: {
    ...textPresets.label,
    color: "#6b6b6b",
    textAlign: "center",
    marginBottom: 8,
  },
  flaggedButton: {
    backgroundColor: "#e0483e",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  flaggedButtonText: {
    color: "#fff",
    lineHeight: Math.round(14 * 1.4),
    ...textPresets.body,
  },
});