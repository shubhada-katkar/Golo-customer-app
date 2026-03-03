import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Property({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations }) {
  if (category?.id !== "property") return null;
  const [selectedTab, setSelectedTab] = useState("sell");
  const navigation = useNavigation();
  const ConditionButton = ({ label, value }) => (
    <TouchableOpacity
      style={[
        styles.segmentBtn,
        formData.condition === value && styles.segmentBtnSelected,
      ]}
      onPress={() => setFormData({ ...formData, condition: value })}
    >
      <Text
        style={[
          styles.segmentText,
          formData.condition === value && styles.segmentTextSelected,
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
            setFormData({ ...formData, noticeType: "sell" });
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
            setFormData({ ...formData, noticeType: "rent" });
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
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.propertyType || ""}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Property Type" value="" />
                <Picker.Item label="Apartment" value="apartment" />
                <Picker.Item label="House" value="house" />
                <Picker.Item label="Plot" value="plot" />
                <Picker.Item label="Commercial" value="commercial" />
              </Picker>
            </View>

            <Text style={styles.label}>BHK</Text>
            <TextInput
              style={styles.input}
              value={formData.bhk || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, bhk: text })
              }
              placeholder="Enter BHK of the property"
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
              placeholder="Enter number of bathrooms"
            />

            <Text style={styles.label}>Floor</Text>
            <TextInput
              style={styles.input}
              value={formData.floor || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, floor: text })
              }
              placeholder="Enter floor number"
            />

            <Text style={styles.label}>Property Age</Text>
            <TextInput
              style={styles.input}
              value={formData.propertyAge || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, propertyAge: text })
              }
              placeholder="Enter property age in years"
            />

            <Text style={styles.label}>Furnishing</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.furnishing || ""}
                onValueChange={(value) => setFormData({ ...formData, furnishing: value })}
                mode="dropdown"
              >
                <Picker.Item label="Furnishing" value="" />
                <Picker.Item label="Unfurnished" value="unfurnished" />
                <Picker.Item label="Semi-Furnished" value="semiFurnished" />
                <Picker.Item label="Fully Furnished" value="fullyFurnished" />
              </Picker>
            </View>

            <Text style={styles.label}>Parking Available</Text>
            <View style={styles.segmentRow}>
              <ConditionButton label="Yes" value="yes" />
              <ConditionButton label="No" value="no" />
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
              placeholder="Enter price of the vehicle"
            />
          </>
        )}

        {selectedTab === "rent" && (
          <>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.propertyType || ""}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Property Type" value="" />
                <Picker.Item label="Apartment" value="apartment" />
                <Picker.Item label="House" value="house" />
                <Picker.Item label="Plot" value="plot" />
                <Picker.Item label="Commercial" value="commercial" />
              </Picker>
            </View>

            <Text style={styles.label}>Monthly Rent Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.monthlyRentAmount || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, monthlyRentAmount: text })
              }
              placeholder="Enter monthly rent amount"
            />

            <Text style={styles.label}>Security Deposit Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.securityDeposit || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, securityDeposit: text })
              }
              placeholder="Enter security deposit amount"
            />

            <Text style={styles.label}>Maintenance Amount Per Month</Text>
            <TextInput
              style={styles.input}
              value={formData.maintenanceAmount || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, maintenanceAmount: text })
              }
              placeholder="Enter maintenance amount per month"
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
                <Picker.Item label="Tenant Type" value="" />
                <Picker.Item label="Family" value="family" />
                <Picker.Item label="Bachelor" value="bachelor" />
                <Picker.Item label="Company" value="company" />
              </Picker>
            </View>

            <Text style={styles.label}>Lease Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.leaseDuration || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, leaseDuration: text })
              }
              placeholder="e.g. 11 months, 2 years"
            />
          </>
        )}

      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations }); }}>
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