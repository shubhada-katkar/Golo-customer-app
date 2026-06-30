import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Dimensions, Image, Alert, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

export default function Card1({ category, formData, setFormData, onNext }) {
  // images is an array
  const images = formData.images || [];

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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // Support both deprecated MediaTypeOptions and newer MediaType API
      mediaTypes: ImagePicker.MediaTypeOptions
        ? ImagePicker.MediaTypeOptions.Images
        : "Images",
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setFormData({ ...formData, images: [...images, ...uris] });
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to take photo");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled) {
      setFormData({ ...formData, images: [...images, result.assets[0].uri] });
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

          <Text style={styles.label}>Heading</Text>
          <TextInput
            style={styles.input}
            value={formData.heading}
            onChangeText={(text) => setFormData({ ...formData, heading: text })}
            placeholder="Type your heading here..."
          />

          <Text style={styles.label}>Body text</Text>
          <TextInput
            style={styles.descriptionInput}
            value={formData.body}
            onChangeText={(text) => setFormData({ ...formData, body: text })}
            multiline
            placeholder="Type your description here..."
            scrollEnabled
          />

          <Text style={styles.label}>Location</Text>
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

          <Text style={styles.label}>Contact no.</Text>
          <TextInput
            style={styles.input}
            value={formData.contact}
            onChangeText={(text) => setFormData({ ...formData, contact: text })}
            keyboardType="phone-pad"
            placeholder="e.g. 9876543210"
          />



          <Text style={styles.label}>Add Images</Text>
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

        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { fontSize: 16, marginTop: 10, fontFamily: "Medium" },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontSize: 14, fontFamily: "Medium" },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,      // Increased height
    maxHeight: 100,      // Keeps the box fixed after this height
    fontSize: 14,
    textAlignVertical: "top",
    fontFamily: "Medium"
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
    fontSize: 14,
    fontFamily: "Medium",
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
    fontSize: 13,
    fontFamily: "Medium",
    color: "#333",
    lineHeight: 18,
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
  uploadText: { marginTop: 6, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  orText: { marginVertical: 6, color: "#999", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  cameraText: { color: "#fff", fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) },
  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 11,
  },
});