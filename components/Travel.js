import React, { useContext, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Travel({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "travel") return null;
  const navigation = useNavigation();
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

  return (
    <View>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 5,
          paddingBottom: 10,
        }}
      >
        <Text style={styles.composeTitle}>Travel</Text>

        {!isEditMode && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: "#108136",
              borderRadius: 10,
            }}
            onPress={onPrevious}
          >
            <AntDesign name="arrow-left" size={18} color="#ffffff" />
            <Text
              style={{
                ...textPresets.body,
                marginLeft: 6,
                color: "#ffffff",
                lineHeight: Math.round(14 * 1.5),
              }}
            >
              Previous
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formCard}>

        <Text style={styles.label}>Package Type <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.packageType || ""}
            onValueChange={(value) => setFormData({ ...formData, packageType: value })}
            mode="dropdown"
          >
            <Picker.Item label="Select package type" value="" />
            <Picker.Item label="Tour Package" value="tour package" />
            <Picker.Item label="Bus Rental" value="bus rental" />
            <Picker.Item label="Hotel Only" value="hotel only" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Destination <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.destination || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, destination: text })
          }
          placeholder="e.g. Dubai, Paris, Bali..."
        />

        <Text style={styles.label}>Duration <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.duration || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, duration: text })
          }
          placeholder="e.g. 5D/4N, 7D/6N"
        />

        <Text style={styles.label}>Travel Date <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.travelDate || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, travelDate: text })
          }
          placeholder="e.g. 15th June 2024"
        />

        <Text style={styles.label}>Price Per Person <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.price || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, price: text })
          }
          placeholder="Amount per person"
        />

        <Text style={styles.label}>Available Seats <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.availableSeats || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, availableSeats: text })
          }
          placeholder="e.g. 20"
        />

        <Text style={styles.label}>Pickup Location <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.pickupLocation || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, pickupLocation: text })
          }
          placeholder="Pickup Location"
        />

        <Text style={styles.label}>Inclusions <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.inclusions || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, inclusions: text })
          }
          placeholder="Flights, Hotels, Meals, Tours..."
          multiline
          textAlignVertical="top"
          scrollEnabled
        />

        <Text style={styles.label}>Exclusions <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.exclusions || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, exclusions: text })
          }
          placeholder="Personal expenses, Travel insurance..."
          multiline
          scrollEnabled
          textAlignVertical="top"
        />
      </View>
      {!isEditMode && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (!formData.packageType) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Package Type.", type: "warning" });
              return;
            }
            if (!formData.destination?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Destination.", type: "warning" });
              return;
            }
            if (!formData.duration?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Duration.", type: "warning" });
              return;
            }
            if (!formData.travelDate?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Travel Date.", type: "warning" });
              return;
            }
            if (!formData.price?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Price Per Person.", type: "warning" });
              return;
            }
            if (!formData.availableSeats?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Available Seats.", type: "warning" });
              return;
            }
            if (!formData.pickupLocation?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Pickup Location.", type: "warning" });
              return;
            }
            if (!formData.inclusions?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Inclusions.", type: "warning" });
              return;
            }
            if (!formData.exclusions?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Exclusions.", type: "warning" });
              return;
            }
            navigation.navigate("CalendarScreen", { category, template, formData, price });
          }}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      )}

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type || "warning"}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  composeTitle: { ...textPresets.body },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
  label: { ...textPresets.body, marginTop: 16, lineHeight: Math.round(14 * 1.5) },
  value: { ...textPresets.body, color: "#555", lineHeight: Math.round(14 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, ...textPresets.body },
  textArea: { height: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,      // Increased height
    maxHeight: 100,      // Keeps the box fixed after this height
    ...textPresets.body,
    textAlignVertical: "top",
  },

  nextBtn: {
    flexDirection: "row",
    backgroundColor: "#157a4f",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    justifyContent: "center"
  },
  nextText: { color: "#fff", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
});

