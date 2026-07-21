import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { textPresets } from "../theme/typography";

export default function Card3({ category, onNext, formData, setFormData }) {

  // --- Location suggestion state (same pattern as CalendarScreen.js / Card1.js / Card2.js) ---
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
            placeholder="10 digit mobile number"
          />

          {/* No image section for Card3 — text-only ad */}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
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
  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
});