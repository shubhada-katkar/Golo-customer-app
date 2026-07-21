import React, { useContext, useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";

export default function Property({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "property") return null;
  const [selectedTab, setSelectedTab] = useState(
    formData?.Type === "Rent" ? "Rent" : "Sell"
  );
  const navigation = useNavigation();

  useEffect(() => {
    if (formData?.Type !== selectedTab) {
      setFormData({ ...formData, Type: selectedTab });
    }
  }, [selectedTab, formData, setFormData]);

  const ConditionButton = ({ label, value }) => (
    <TouchableOpacity
      style={[
        styles.segmentBtn,
        formData.parkingAvailable === value && styles.segmentBtnSelected,
      ]}
      onPress={() => setFormData({ ...formData, parkingAvailable: value })}
    >
      <Text
        style={[
          styles.segmentText,
          formData.parkingAvailable === value && styles.segmentTextSelected,
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
        <Text style={styles.composeTitle}>Property</Text>

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
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 60, justifyContent: "space-between" }}>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Sell" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Sell");
            setFormData({ ...formData, Type: "Sell" });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Sell" && styles.activeTabText
            ]}
          >
            Sell
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Rent" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Rent");
            setFormData({ ...formData, Type: "Rent" });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Rent" && styles.activeTabText
            ]}
          >
            Rent
          </Text>
        </TouchableOpacity>

      </View>


      <View style={styles.formCard}>

        {selectedTab === "Sell" && (
          <>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.propertyType || ""}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Select Property Type" value="" />
                <Picker.Item label="Apartment" value="Apartment" />
                <Picker.Item label="House" value="House" />
                <Picker.Item label="Plot" value="Plot" />
                <Picker.Item label="Commercial" value="Commercial" />
              </Picker>
            </View>

            <Text style={styles.label}>BHK</Text>
            <TextInput
              style={styles.input}
              value={formData.bhk || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, bhk: text })
              }
              placeholder="e.g. 2BHK"
            />

            <Text style={styles.label}>Built-up Area</Text>
            <TextInput
              style={styles.input}
              value={formData.builtUpArea || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, builtUpArea: text })
              }
              placeholder="e.g. 1200 sqft"
            />

            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={styles.input}
              value={formData.bathrooms || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, bathrooms: text })
              }
              placeholder="e.g. 2"
            />

            <Text style={styles.label}>Floor</Text>
            <TextInput
              style={styles.input}
              value={formData.floor || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, floor: text })
              }
              placeholder="e.g. 3rd Floor"
            />

            <Text style={styles.label}>Property Age</Text>
            <TextInput
              style={styles.input}
              value={formData.propertyAge || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, propertyAge: text })
              }
              placeholder="e.g. 5 years"
            />

            <Text style={styles.label}>Furnishing</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.furnishing || ""}
                onValueChange={(value) => setFormData({ ...formData, furnishing: value })}
                mode="dropdown"
              >
                <Picker.Item label="Select Furnishing" value="" />
                <Picker.Item label="Unfurnished" value="Unfurnished" />
                <Picker.Item label="Semi-Furnished" value="Semi-Furnished" />
                <Picker.Item label="Fully Furnished" value="Fully Furnished" />
              </Picker>
            </View>

            <Text style={styles.label}>Parking Available</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Yes" value="Yes" />
              <ConditionButton label="No" value="No" />
            </View>


            <Text style={styles.label}>Facing Side</Text>
            <TextInput
              style={styles.input}
              value={formData.facingSide || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, facingSide: text })
              }
              placeholder="North, South, East, West"
            />

            <Text style={styles.label}>Asking Price</Text>
            <TextInput
              style={styles.input}
              value={formData.price || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, price: text })
              }
              placeholder="e.g. ₹40,00,000"
            />
          </>
        )}

        {selectedTab === "Rent" && (
          <>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.propertyType || ""}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Select Property Type" value="" />
                <Picker.Item label="Residential" value="Residential" />
                <Picker.Item label="Commercial" value="Commercial" />
                <Picker.Item label="Office" value="Office" />
                <Picker.Item label="Plot" value="Plot" />
              </Picker>
            </View>

            <Text style={styles.label}>Monthly Rent</Text>
            <TextInput
              style={styles.input}
              value={formData.monthlyRentAmount || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, monthlyRentAmount: text })
              }
              placeholder="e.g. ₹10,000"
            />

            <Text style={styles.label}>Security Deposit</Text>
            <TextInput
              style={styles.input}
              value={formData.securityDeposit || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, securityDeposit: text })
              }
              placeholder="e.g. ₹20,000"
            />

            <Text style={styles.label}>Maintenance Cost Per Month</Text>
            <TextInput
              style={styles.input}
              value={formData.maintenanceAmount || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, maintenanceAmount: text })
              }
              placeholder="e.g. ₹1000"
            />

            <Text style={styles.label}>Available From</Text>
            <TextInput
              style={styles.input}
              value={formData.availableFrom || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, availableFrom: text })
              }
              placeholder="Enter available from date"
            />

            <Text style={styles.label}>Select Tenant Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.tenantType || ""}
                onValueChange={(value) => setFormData({ ...formData, tenantType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Select Tenant Type" value="" />
                <Picker.Item label="Family" value="Family" />
                <Picker.Item label="Bachelor" value="Bachelor" />
                <Picker.Item label="Company" value="Company" />
              </Picker>
            </View>

            <Text style={styles.label}>Lease Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.leaseDuration || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, leaseDuration: text })
              }
              placeholder="e.g. 6 months, 1 year"
            />
          </>
        )}

      </View>

      {!isEditMode && (
        <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("CalendarScreen", { category, template, formData, price }); }}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({

  composeTitle: { ...textPresets.subtitle },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18, marginTop: 10 },
  label: { ...textPresets.body, marginTop: 16, lineHeight: Math.round(14 * 1.5) },
  value: { ...textPresets.body, color: "#555", lineHeight: Math.round(14 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, ...textPresets.body },
  textArea: { height: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },

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
  tab: {
    borderRadius: 60,
    backgroundColor: "#f8f8f8ff",
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 6
  },
  activeTab: {
    backgroundColor: "#157a4f",
  },
  tabText: {
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    color: "#868686ff",
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
    color: "#444",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },
  segmentTextSelected: {
    color: "#fff",
  },
});

