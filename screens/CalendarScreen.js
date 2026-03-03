import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { ScrollView } from "react-native-gesture-handler";
import { Modal } from "react-native";
import { TouchableWithoutFeedback, Keyboard } from "react-native";

export default function CalendarScreen({ navigation, route }) {
  const { category } = route.params || {};

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [locationInput, setLocationInput] = useState("");
  const datesArray = Object.keys(selectedDates).sort();
  const maxBoxHeight = 240;
  const selectedDaysCount = datesArray.length;
  const [selectedLocations, setSelectedLocations] = useState([]);

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
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name="arrow-back-ios"
                size={26}
                color="#000"
                style={{ paddingHorizontal: 10 }}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Smart Jahirati</Text>
          </View>

          <Text style={styles.subtitle}>
            Post Your Ads Instantly Online
          </Text>

          <Text style={styles.label}>Where to publish</Text>

          <View style={{ position: "relative" }}>
            <View style={styles.location}>
              <TextInput
                placeholder="Type location and press enter"
                value={locationInput}
                style={{ fontSize: 14, fontFamily: "Italic" }}
                onChangeText={(text) => setLocationInput(text)}
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
                }}
                returnKeyType="done"
              />
            </View>

            {selectedLocations.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                {selectedLocations.map((loc, idx) => (
                  <View
                    key={`${loc}-${idx}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#fff",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginRight: 8,
                      marginTop: 6,
                      borderWidth: 0.5,
                    }}
                  >
                    <Text style={{ fontSize: 15 }}>{loc}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newArr = selectedLocations.filter((_, i) => i !== idx);
                        setSelectedLocations(newArr);
                        setLocationInput(newArr.join(", "));
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <MaterialIcons name="close" size={22} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>


          {/* Date */}
          <Text style={[styles.label, { marginTop: 28 }]}>
            When to Publish
          </Text>

          <TouchableOpacity
            style={styles.dates}
            onPress={() => setShowCalendar(true)} >
            <Text style={{ fontSize: 16, fontFamily: "Italic", lineHeight: Math.round(16 * 1.5) }}>
              {datesArray.length === 0
                ? "Select Dates"
                : datesArray.length === 1
                  ? "1 Date Selected"
                  : `${datesArray.length} Dates Selected`}
            </Text>

          </TouchableOpacity>

          <Modal
            visible={showCalendar}
            transparent={true}
            animationType="slide"  >
            <View style={styles.modalOverlay}>
              <View style={styles.calendarContainer}>
                <Calendar
                  minDate={new Date().toISOString().split("T")[0]}
                  markedDates={selectedDates}
                  onDayPress={onDayPress} />

                <TouchableOpacity
                  style={[styles.button, { marginTop: 15 }]}
                  onPress={() => setShowCalendar(false)} >
                  <Text style={{ color: "#fff" }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {datesArray.length > 0 && (
            <View
              style={[
                styles.scroll,
                {
                  maxHeight: maxBoxHeight,
                },
              ]} >
              <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>

                <View>
                  {datesArray.map((date) => (
                    <View key={date} style={styles.dateRow}>
                      <Text>{new Date(date).toDateString()}</Text>

                      <TouchableOpacity
                        onPress={() => {
                          const updatedDates = { ...selectedDates };
                          delete updatedDates[date];
                          setSelectedDates(updatedDates);
                        }} >
                        <MaterialIcons name="delete" size={22} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("Template", {
                category,
                selectedDays: datesArray.length,
                selectedLocations: selectedLocations,
              })
            }
          >
            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) }}>
              Next
            </Text>
          </TouchableOpacity>

        </LinearGradient>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "Medium",
    lineHeight: Math.round(22 * 1.4)
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 48,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.1)
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.2)
  },
  location: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  dates: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  button: {
    paddingHorizontal: 38,
    paddingVertical: 10,
    backgroundColor: "#157a4f",
    alignSelf: "center",
    borderRadius: 10,
    marginTop: 24,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 0.5,
  },
  scroll: {
    borderRadius: 10,
    borderWidth: 0.6,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  calendarContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 5,
  },
  dropdown: {
    position: "absolute",
    top: 64,
    width: "100%",
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 0.5,
    zIndex: 999,
    elevation: 10,
  },
  cityItem: {
    padding: 12,
    borderBottomWidth: 0.3,
  }

});