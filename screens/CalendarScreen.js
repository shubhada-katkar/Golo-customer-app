import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { ScrollView } from "react-native-gesture-handler";
import { Modal } from "react-native";
import { TouchableWithoutFeedback, Keyboard } from "react-native";

export default function CalendarScreen({ navigation }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const datesArray = Object.keys(selectedDates).sort();
  const maxBoxHeight = 240;
  const [showLocations, setShowLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  const fetchCities = async () => {
    setShowLocations(!showLocations);

    if (cities.length === 0) {
      setLoadingCities(true);

      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "India" }),
          }
        );

        const data = await response.json();
        setCities(data.data.slice(0, 50)); // limit results

      } catch (error) {
        console.log("City fetch error:", error);
      }

      setLoadingCities(false);
    }
  };

  const filteredCities = cities
    .filter((city) =>
      city.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(searchText.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(searchText.toLowerCase());

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback
        onPress={() => {
          setShowLocations(false);
          Keyboard.dismiss();
        }} >
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
                placeholder="Type Location..."
                value={searchText} style={{fontSize:14, fontFamily:"Italic"}}
                onFocus={() => setShowLocations(false)} 
                onChangeText={async (text) => {
                  setSearchText(text);

                  if (text.length >= 1) {  // fetch only when user types at least 1 letter
                    if (cities.length === 0) {
                      setLoadingCities(true);

                      try {
                        const response = await fetch(
                          "https://countriesnow.space/api/v0.1/countries/cities",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ country: "India" }),
                          }
                        );

                        const data = await response.json();
                        setCities(data.data); // remove slice limit

                      } catch (error) {
                        console.log("City fetch error:", error);
                      }

                      setLoadingCities(false);
                    }

                    setShowLocations(true); // show dropdown only after typing
                  } else {
                    setShowLocations(false); // hide if empty
                  }
                }} />

            </View>

            {showLocations && (
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={styles.dropdown}>
                  {loadingCities ? (
                    <Text style={{ padding: 15 }}>Loading cities...</Text>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {filteredCities.map((city) => (
                        <TouchableOpacity
                          key={city}
                          style={styles.cityItem}
                          onPress={() => {
                            setSelectedLocation(city);
                            setShowLocations(false);
                            setSearchText(city);
                          }}
                        >
                          <Text>{city}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>


          {/* Date */}
          <Text style={[styles.label, { marginTop: 28 }]}>
            When to Publish
          </Text>

          <TouchableOpacity
            style={styles.dates}
            onPress={() => setShowCalendar(true)} >
            <Text style={{ fontSize: 16, fontFamily:"Italic",lineHeight:Math.round(16*1.5) }}>
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
            onPress={() => navigation.navigate("Template")}
          >
            <Text style={{ color: "#ffffff", fontSize: 18 , fontFamily:"Medium",lineHeight:Math.round(18*1.5)}}>
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
    fontFamily:"Medium",
    lineHeight:Math.round(22*1.4)
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 48,
    fontFamily:"Medium",
    lineHeight:Math.round(16*1.1)
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    fontFamily:"Medium",
    lineHeight:Math.round(16*1.2)
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
    paddingVertical:10,
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