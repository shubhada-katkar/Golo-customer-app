import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { ScrollView } from "react-native-gesture-handler";
import { Modal } from "react-native";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { Alert } from "react-native";

export default function CalendarScreen({ navigation, route }) {
  const { category } = route.params || {};

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [locationInput, setLocationInput] = useState("");
  const datesArray = Object.keys(selectedDates).sort();
  const maxBoxHeight = 275;
  const selectedDaysCount = datesArray.length;
  const [selectedLocations, setSelectedLocations] = useState([]);

  // --- Summary modal visibility ---
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);

  // --- Location suggestion state (same pattern as GoloHome.js) ---
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceTimer = useRef(null);

  const buildDateRange = (startDateStr, endDateStr) => {
    const result = [];
    const cursor = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (cursor <= end) {
      result.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  };

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
    setLocationInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    // 400ms debounce — responsive but avoids hammering Nominatim
    debounceTimer.current = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 400);
  }, [fetchLocationSuggestions]);

  const addLocation = useCallback((label) => {
    if (!label) return;
    setSelectedLocations((prev) =>
      prev.includes(label) ? prev : [...prev, label]
    );
    setLocationInput("");
    setLocationSuggestions([]);
    Keyboard.dismiss();
  }, []);

  const handleSelectSuggestion = useCallback((suggestion) => {
    addLocation(suggestion.label);
  }, [addLocation]);

  const removeLocation = useCallback((idx) => {
    setSelectedLocations((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const removeDate = useCallback((date) => {
    setSelectedDates((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  }, []);

  const handleNext = () => {
    const pendingInputLocations = (locationInput || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const mergedLocations = [
      ...selectedLocations,
      ...pendingInputLocations.filter((loc) => !selectedLocations.includes(loc)),
    ];

    if (datesArray.length === 0) {
      Alert.alert("Select Dates", "Please select ad dates before continuing.");
      return;
    }

    if (mergedLocations.length === 0) {
      Alert.alert("Select Location", "Please add at least one location before continuing.");
      return;
    }

    const startDate = datesArray[0];
    const endDate = datesArray[datesArray.length - 1];
    const selectedDateRange = buildDateRange(startDate, endDate);

    navigation.navigate("Template", {
      category,
      selectedDays: selectedDateRange.length,
      selectedDates: selectedDateRange,
      startDate,
      endDate,
      selectedLocations: mergedLocations,
    });
  };

  const onDayPress = (day) => {
    const updatedDates = { ...selectedDates };

    if (updatedDates[day.dateString]) {
      delete updatedDates[day.dateString]; // unselect if already selected
    } else {
      updatedDates[day.dateString] = {
        selected: true,
        selectedColor: "#157a4f",
      };
    }

    setSelectedDates(updatedDates);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <LinearGradient
          colors={["#f9a641", "#f5b849", "#ffffff"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1, padding: 16 }} >

          {/* Header */}
          <View style={styles.row1}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back-ios" size={20} color="#1c1c1c" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Smart Jahirati</Text>
              <Text style={styles.subtitle}>Post Your Ads Instantly Online</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Location Section */}
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="place" size={18} color="#157a4f" />
              <Text style={styles.label}>Where to publish</Text>
            </View>

            <View style={{ position: "relative", zIndex: 100 }}>
              <View style={styles.location}>
                <MaterialIcons name="search" size={20} color="#9a9a9a" style={{ marginRight: 6 }} />
                <TextInput
                  placeholder="Type a city or area..."
                  placeholderTextColor="#9a9a9a"
                  value={locationInput}
                  style={{ flex: 1, fontSize: 14, fontFamily: "Medium", paddingVertical: 14, top: 3 }}
                  onChangeText={handleLocationInputChange}
                  onSubmitEditing={() => {
                    const text = locationInput || "";
                    const arr = text
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    if (arr.length === 0) return;
                    const newItems = arr.filter((a) => !selectedLocations.includes(a));
                    if (newItems.length > 0) {
                      setSelectedLocations((prev) => [...prev, ...newItems]);
                    }
                    setLocationInput("");
                    setLocationSuggestions([]);
                  }}
                  returnKeyType="done"
                />
                {suggestionsLoading && (
                  <ActivityIndicator size="small" color="#157a4f" style={{ marginRight: 4 }} />
                )}
              </View>

              {/* Selected Locations summary — only shown once at least 1 is selected */}
              {selectedLocations.length > 0 && (
                <TouchableOpacity
                  style={styles.summaryBox}
                  onPress={() => setShowLocationsModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.summaryBoxLeft}>
                    <View style={styles.summaryIconCircle}>
                      <MaterialIcons name="place" size={16} color="#157a4f" />
                    </View>
                    <Text style={styles.summaryBoxText}>
                      {selectedLocations.length === 1
                        ? "1 Location Selected"
                        : `${selectedLocations.length} Locations Selected`}
                    </Text>
                  </View>
                  <View style={styles.summaryBoxRight}>
                    <Text style={styles.summaryBoxLink}>View</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={20} color="#157a4f" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Suggestions dropdown — overlays everything below the input */}
              {locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 240, marginTop:4 }}
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

            {/* Date Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 26 }]}>
              <MaterialIcons name="event" size={18} color="#157a4f" />
              <Text style={styles.label}>When to publish</Text>
            </View>

            <View style={{ position: "relative", zIndex: 1 }}>
              <TouchableOpacity
                style={styles.dates}
                onPress={() => setShowCalendar(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="calendar-today" size={18} color="#9a9a9a" style={{ marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 15, fontFamily: "Medium", top: 3 }}>
                  {datesArray.length === 0
                    ? "Select Dates"
                    : datesArray.length === 1
                      ? "1 Date Selected"
                      : `${datesArray.length} Dates Selected`}
                </Text>
                <MaterialIcons name="keyboard-arrow-right" size={20} color="#9a9a9a" />
              </TouchableOpacity>

              {/* Selected Dates summary — only shown once at least 1 is selected */}
              {datesArray.length > 0 && (
                <TouchableOpacity
                  style={styles.summaryBox}
                  onPress={() => setShowDatesModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.summaryBoxLeft}>
                    <View style={styles.summaryIconCircle}>
                      <MaterialIcons name="event-available" size={16} color="#157a4f" />
                    </View>
                    <Text style={styles.summaryBoxText}>
                      View Selected Dates
                    </Text>
                  </View>
                  <View style={styles.summaryBoxRight}>
                    <MaterialIcons name="keyboard-arrow-right" size={20} color="#157a4f" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <Modal
              visible={showCalendar}
              transparent={true}
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setShowCalendar(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarHeaderText}>Select Ad Dates</Text>
                    <TouchableOpacity onPress={() => setShowCalendar(false)} activeOpacity={0.7}>
                      <MaterialIcons name="close" size={22} color="#6b6b6b" />
                    </TouchableOpacity>
                  </View>

                  <Calendar
                    minDate={new Date().toISOString().split("T")[0]}
                    markedDates={selectedDates}
                    onDayPress={onDayPress}
                    theme={{
                      backgroundColor: "#ffffff",
                      calendarBackground: "#ffffff",
                      textSectionTitleColor: "#157a4f",
                      selectedDayBackgroundColor: "#157a4f",
                      selectedDayTextColor: "#ffffff",
                      todayTextColor: "#f9a641",
                      dayTextColor: "#2d2d2d",
                      textDisabledColor: "#d9d9d9",
                      dotColor: "#157a4f",
                      selectedDotColor: "#ffffff",
                      arrowColor: "#157a4f",
                      monthTextColor: "#1c1c1c",
                      indicatorColor: "#157a4f",
                      textDayFontFamily: "Medium",
                      textMonthFontFamily: "SemiBold",
                      textDayHeaderFontFamily: "Medium",
                      textDayFontSize: 14,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 12,
                    }}
                    style={styles.calendarInner}
                  />

                  <View style={styles.calendarFooter}>
                    <Text style={styles.calendarFooterText}>
                      {selectedDaysCount === 0
                        ? "No dates selected yet"
                        : `${selectedDaysCount} ${selectedDaysCount === 1 ? "date" : "dates"} selected`}
                    </Text>
                    <TouchableOpacity
                      style={styles.calendarDoneButton}
                      onPress={() => setShowCalendar(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: "#fff", fontFamily: "Medium", fontSize: 15, lineHeight: Math.round(15 * 1.5) }}>
                        Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Selected Locations modal */}
            <Modal
              visible={showLocationsModal}
              transparent={true}
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setShowLocationsModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.summaryModalContainer}>
                  <View style={styles.calendarHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="place" size={18} color="#157a4f" style={{ marginRight: 6 }} />
                      <Text style={styles.calendarHeaderText}>Selected Locations</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowLocationsModal(false)} activeOpacity={0.7}>
                      <MaterialIcons name="close" size={22} color="#6b6b6b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={{ maxHeight: maxBoxHeight }}
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {selectedLocations.map((loc, idx) => (
                      <View key={`${loc}-${idx}`} style={styles.modalListRow}>
                        <View style={styles.dateRowLeft}>
                          <View style={styles.dateIconCircle}>
                            <MaterialIcons name="location-on" size={16} color="#157a4f" />
                          </View>
                          <Text style={styles.dateRowText} numberOfLines={2}>{loc}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeLocation(idx)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="delete-outline" size={20} color="#fa5656ff" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {selectedLocations.length === 0 && (
                      <Text style={styles.emptyModalText}>No locations selected yet</Text>
                    )}
                  </ScrollView>

                  <View style={styles.calendarFooter}>
                    <Text style={styles.calendarFooterText}>
                      {selectedLocations.length === 0
                        ? "Add a location to continue"
                        : `${selectedLocations.length} ${selectedLocations.length === 1 ? "location" : "locations"} selected`}
                    </Text>
                    <TouchableOpacity
                      style={styles.calendarDoneButton}
                      onPress={() => setShowLocationsModal(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: "#fff", fontFamily: "Medium", fontSize: 15, lineHeight: Math.round(15 * 1.5) }}>
                        Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Selected Dates modal */}
            <Modal
              visible={showDatesModal}
              transparent={true}
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setShowDatesModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.summaryModalContainer}>
                  <View style={styles.calendarHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <MaterialIcons name="event" size={18} color="#157a4f" style={{ marginRight: 6 }} />
                      <Text style={styles.calendarHeaderText}>Selected Dates</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowDatesModal(false)} activeOpacity={0.7}>
                      <MaterialIcons name="close" size={22} color="#6b6b6b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={{ maxHeight: maxBoxHeight }}
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {datesArray.map((date) => (
                      <View key={date} style={styles.modalListRow}>
                        <View style={styles.dateRowLeft}>
                          <View style={styles.dateIconCircle}>
                            <MaterialIcons name="event-available" size={16} color="#157a4f" />
                          </View>
                          <Text style={styles.dateRowText}>
                            {new Date(date).toDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeDate(date)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="delete-outline" size={20} color="#fa5656ff" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {datesArray.length === 0 && (
                      <Text style={styles.emptyModalText}>No dates selected yet</Text>
                    )}
                  </ScrollView>

                  <View style={styles.calendarFooter}>
                    <Text style={styles.calendarFooterText}>
                      {selectedDaysCount === 0
                        ? "Add a date to continue"
                        : `${selectedDaysCount} ${selectedDaysCount === 1 ? "date" : "dates"} selected`}
                    </Text>
                    <TouchableOpacity
                      style={styles.calendarDoneButton}
                      onPress={() => setShowDatesModal(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: "#fff", fontFamily: "Medium", fontSize: 15, lineHeight: Math.round(15 * 1.5) }}>
                        Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
              Next
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          </ScrollView>

        </LinearGradient>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 21,
    fontFamily: "SemiBold",
    color: "#1c1c1c",
    lineHeight: Math.round(21 * 1.3),
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Medium",
    color: "#4a4a4a",
    lineHeight: Math.round(13 * 1.2),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 2,
  },
  label: {
    marginLeft: 6,
    fontSize: 15,
    fontFamily: "SemiBold",
    color: "#1c1c1c",
    lineHeight: Math.round(15 * 1.2),
  },

  /* Keeping these as-is per request: white input boxes */
  location: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  dates: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 10,
    backgroundColor: "#fff",
  },

  /* Summary box shown below each input once items are selected */
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: "#eef8f1",
    borderWidth: 1,
    borderColor: "#cdeadb",
  },
  summaryBoxLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  summaryBoxText: {
    fontSize: 14,
    fontFamily: "SemiBold",
    color: "#0d4d31",
    lineHeight: Math.round(14 * 1.4),
  },
  summaryBoxRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryBoxLink: {
    fontSize: 13,
    fontFamily: "SemiBold",
    color: "#157a4f",
    marginRight: 2,
    lineHeight:Math.round(13 * 1.5)
  },

  suggestionsContainer: {
    position: "absolute",
    top: 70,
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
  button: {
    flexDirection: "row",
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#157a4f",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginTop:50
  },
  dateRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef8f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateRowText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Medium",
    color: "#1c1c1c",
    lineHeight: Math.round(14 * 1.5),
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  /* Shared container for the Selected Locations / Selected Dates modals */
  summaryModalContainer: {
    width: "90%",
    maxHeight: "95%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  emptyModalText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Medium",
    color: "#9a9a9a",
    paddingVertical: 24,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8e8e8",
  },
  calendarHeaderText: {
    fontSize: 16,
    fontFamily: "SemiBold",
    color: "#1c1c1c",
    lineHeight:Math.round(16 * 1.5)
  },
  calendarInner: {
    borderRadius: 10,
  },
  calendarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#e8e8e8",
  },
  calendarFooterText: {
    fontSize: 13,
    fontFamily: "Medium",
    color: "#6b6b6b",
    lineHeight: Math.round(13 * 1.4),
  },
  calendarDoneButton: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    backgroundColor: "#157a4f",
    borderRadius: 10,
  },
});