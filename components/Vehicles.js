import React, { useContext, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Vehicles({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
  if (category?.id !== "vehicles") return null;
  const [selectedTab, setSelectedTab] = useState("sell");
  const navigation = useNavigation();

  const ConditionButton = ({ label, value, field }) => (
    <TouchableOpacity
      style={[
        styles.segmentBtn,
        formData[field] === value && styles.segmentBtnSelected,
      ]}
      onPress={() => setFormData({ ...formData, [field]: value })}
    >
      <Text
        style={[
          styles.segmentText,
          formData[field] === value && styles.segmentTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.composeTitle}>Vehicles</Text>

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
              fontFamily: "Medium",
              fontSize: 16,
              marginLeft: 6,
              color: "#ffffff",
              lineHeight: Math.round(16 * 1.5),
            }}
          >
            Previous
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 60, justifyContent: "space-between" }}>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "sell" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("sell");
            setFormData({ ...formData, type: "Sell" });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "sell" && styles.activeTabText
            ]}
          >
            Sell
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "rent" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("rent");
            setFormData({ ...formData, type: "Rent" });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "rent" && styles.activeTabText
            ]}
          >
            Rent
          </Text>
        </TouchableOpacity>

      </View>


      <View style={styles.formCard}>

        {selectedTab === "sell" && (
          <>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.vehicleType || ""}
                onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Vehicle Type" value="" />
                <Picker.Item label="Four Wheeler" value="fourWheeler" />
                <Picker.Item label="Two Wheeler" value="twoWheeler" />
                <Picker.Item label="Three Wheeler" value="threeWheeler" />
                <Picker.Item label="Truck" value="truck" />
                <Picker.Item label="Other Vehicle" value="otherVehicle" />
              </Picker>
            </View>

            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={formData.brand || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, brand: text })
              }
              placeholder="Enter brand of the vehicle"
            />

            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={formData.model || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, model: text })
              }
              placeholder="Enter model of the vehicle"
            />

            <Text style={styles.label}>Variant</Text>
            <TextInput
              style={styles.input}
              value={formData.variant || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, variant: text })
              }
              placeholder="Enter variant of the vehicle"
            />

            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={formData.year || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, year: text })
              }
              placeholder="Enter year of the vehicle"
            />

            <Text style={styles.label}>KM Driven</Text>
            <TextInput
              style={styles.input}
              value={formData.kilometersDriven || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, kilometersDriven: text })
              }
              placeholder="Enter KM driven of the vehicle"
            />

            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.fuelType || ""}
                onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Fuel Type" value="" />
                <Picker.Item label="Petrol" value="petrol" />
                <Picker.Item label="Diesel" value="diesel" />
                <Picker.Item label="CNG" value="cng" />
                <Picker.Item label="Electric" value="electric" />
              </Picker>
            </View>

            <Text style={styles.label}>Transmission</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Manual" value="Manual" field="transmission" />
              <ConditionButton label="Automatic" value="Automatic" field="transmission" />
            </View>

            <Text style={styles.label}>Ownership</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.ownership || ""}
                onValueChange={(value) => setFormData({ ...formData, ownership: value })}
                mode="dropdown"
              >
                <Picker.Item label="Ownership" value="" />
                <Picker.Item label="Single Owner" value="singleOwner" />
                <Picker.Item label="Second Owner" value="secondOwner" />
                <Picker.Item label="Third Owner" value="thirdOwner" />
              </Picker>
            </View>

            <Text style={styles.label}>RC Available</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Yes" value="yes" field="rcAvailable" />
              <ConditionButton label="No" value="no" field="rcAvailable" />
            </View>

            <Text style={styles.label}>Insurance Valid Till</Text>
            <TextInput
              style={styles.input}
              value={formData.insurance || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, insurance: text })
              }
              placeholder="Enter insurance valid till date"
            />

            <Text style={styles.label}>Condition</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Excellent" value="excellent" field="condition" />
              <ConditionButton label="Very Good" value="veryGood" field="condition" />
              <ConditionButton label="Good" value="good" field="condition" />
            </View>

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={formData.price || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, price: text })
              }
              placeholder="Enter price of the vehicle"
            />
          </>
        )}

        {selectedTab === "rent" && (
          <>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.vehicleType2 || ""}
                onValueChange={(value) => setFormData({ ...formData, vehicleType2: value })}
                mode="dropdown"
              >
                <Picker.Item label="Vehicle Type" value="" />
                <Picker.Item label="Four Wheeler" value="fourWheeler" />
                <Picker.Item label="Two Wheeler" value="twoWheeler" />
                <Picker.Item label="Three Wheeler" value="threeWheeler" />
                <Picker.Item label="Truck" value="truck" />
                <Picker.Item label="Other Vehicle" value="otherVehicle" />
              </Picker>
            </View>

            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={formData.brand2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, brand2: text })
              }
              placeholder="Enter brand of the vehicle"
            />

            <Text style={styles.label}>Per Day Rent Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.perDayRentAmount || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, perDayRentAmount: text })
              }
              placeholder="Enter per day rent amount"
            />

            <Text style={styles.label}>Security Deposit</Text>
            <TextInput
              style={styles.input}
              value={formData.securityDeposit || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, securityDeposit: text })
              }
              placeholder="Enter security deposit amount"
            />

            <Text style={styles.label}>Includes Driver</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Yes" value="yes" field="includesDriver" />
              <ConditionButton label="No" value="no" field="includesDriver" />
              <ConditionButton label="Both" value="both" field="includesDriver" />
            </View>

            <Text style={styles.label}>Min Rental Duration (Days)</Text>
            <TextInput
              style={styles.input}
              value={formData.minRentalDuration || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, minRentalDuration: text })
              }
              placeholder="Enter minimum rental duration in days"
            />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }); }}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18, marginTop: 10 },
  label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 },
  textArea: { height: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },

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

  nextBtn: {
    flexDirection: "row",
    backgroundColor: "#157a4f",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    justifyContent: "center"
  },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    borderRadius: 60,
    backgroundColor: "#c9e9e9",
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 6
  },
  activeTab: {
    backgroundColor: "#156e7a",
  },

  tabText: {
    fontFamily: "Medium",
    fontSize: 15,
    lineHeight: Math.round(15 * 1.5),
    color: "#0a3d3d",
  },

  activeTabText: {
    color: "#ffffff",
  },

  segmentRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentBtnSelected: {
    backgroundColor: "#f5b849",
    borderColor: "#bd8e38",
  },
  segmentText: {
    fontSize: 15,
    fontFamily: "Medium",
    color: "#444",
    lineHeight: Math.round(15 * 1.5),
  },
  segmentTextSelected: {
    color: "#fff",
  },
});

