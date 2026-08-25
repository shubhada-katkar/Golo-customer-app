import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Greetings({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "greetings") return null;
  const [selectedTab, setSelectedTab] = useState("Greetings");
  const navigation = useNavigation();
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

  React.useEffect(() => {
    if (!formData.Type) {
      setFormData({ ...formData, Type: "Greetings" });
    }
  }, []);

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
        <Text style={styles.composeTitle}>Greetings</Text>

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

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 50, justifyContent: "space-between" }}>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Greetings" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Greetings");
            setFormData({
              ...formData,
              Type: "Greetings",
              // Clear tribute-specific fields
              name2: "",
              age2: "",
              year2: "",
              summary: "",
              funeralDetails: ""
            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Greetings" && styles.activeTabText
            ]}
          >
            Greetings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Tribute" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Tribute");
            setFormData({
              ...formData,
              Type: "Tribute",
              // Clear greetings-specific fields
              relationType: "",
              from: ""
            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Tribute" && styles.activeTabText
            ]}
          >
            Tribute
          </Text>
        </TouchableOpacity>

      </View>


      <View style={styles.formCard}>

        {selectedTab === "Greetings" && (
          <>
            <Text style={styles.label}>Relationship <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.relationType || ""}
                onValueChange={(value) => setFormData({ ...formData, relationType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Select Relationship" value="" />
                <Picker.Item label="Friend" value="Friend" />
                <Picker.Item label="Brother" value="Brother" />
                <Picker.Item label="Sister" value="Sister" />
                <Picker.Item label="Relative" value="Relative" />
                <Picker.Item label="Parent" value="Parent" />
                <Picker.Item label="Colleague" value="Colleague" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <Text style={styles.label}>Name of the Person <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.name || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              placeholder="e.g. John"
            />

            <Text style={styles.label}>Age Turning <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.age || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, age: text })
              }
              placeholder="e.g. 25"
            />

            <Text style={styles.label}>Date of Birthday <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.year || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, year: text })
              }
              placeholder="Enter Birthdate"
            />

            <Text style={styles.label}>Your Message / Wishes <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.wishes || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, wishes: text })
              }
              placeholder="Share your heartfelt message and wishes..."
              multiline
              textAlignVertical="top" // Starts text from the top (Android)
              scrollEnabled={true}
            />

            <Text style={styles.label}>From (Your Name) <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.from || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, from: text })
              }
              placeholder="Your Name"
            />

          </>
        )}

        {selectedTab === "Tribute" && (
          <>
            <Text style={styles.label}>Full Name of Deceased <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.name2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, name2: text })
              }
              placeholder="Full name of deceased"
            />

            <Text style={styles.label}>Age <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.age2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, age2: text })
              }
              placeholder="Age at the time of passing"
            />

            <Text style={styles.label}>Date of Birthday <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.year2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, year2: text })
              }
              placeholder="Enter Birthdate"
            />

            <Text style={styles.label}>Short Biography / Life Summary <Text style={{ color: "#d92d20" }}>*</Text></Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.summary || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, summary: text })
              }
              placeholder="Share memories and life achievements..."
              multiline
              textAlignVertical="top" // Starts text from the top (Android)
              scrollEnabled={true}
            />

            <Text style={styles.label}>Funeral / Prayer Meetings Details(Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.funeralDetails || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, funeralDetails: text })
              }
              placeholder="Venue, Date, Time and Other Details"
              multiline
              textAlignVertical="top" // Starts text from the top (Android)
              scrollEnabled={true}
            />

          </>
        )}
      </View>

      {!isEditMode && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (selectedTab === "Greetings") {
              if (!formData.relationType) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Relationship.", type: "warning" });
                return;
              }
              if (!formData.name?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Name of the Person.", type: "warning" });
                return;
              }
              if (!formData.age?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Age.", type: "warning" });
                return;
              }
              if (!formData.year?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Date of Birthday.", type: "warning" });
                return;
              }
              if (!formData.wishes?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Your Message / Wishes.", type: "warning" });
                return;
              }
              if (!formData.from?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in From (Your Name).", type: "warning" });
                return;
              }
            } else if (selectedTab === "Tribute") {
              if (!formData.name2?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Full Name of Deceased.", type: "warning" });
                return;
              }
              if (!formData.age2?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Age.", type: "warning" });
                return;
              }
              if (!formData.year2?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Date of Birthday.", type: "warning" });
                return;
              }
              if (!formData.summary?.trim()) {
                setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Short Biography / Life Summary.", type: "warning" });
                return;
              }
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
  composeTitle: { ...textPresets.subtitle },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18, marginTop: 10 },
  label: { ...textPresets.body, marginTop: 16, lineHeight: Math.round(14 * 1.5) },
  value: { color: "#555", lineHeight: Math.round(14 * 1.5), ...textPresets.body },
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
    paddingHorizontal: 24,
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
    ...textPresets.body,
    color: "#444",
    lineHeight: Math.round(14 * 1.5),
  },
  segmentTextSelected: {
    color: "#fff",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 150,      // Increased height
    maxHeight: 150,      // Keeps the box fixed after this height
    textAlignVertical: "top",
    ...textPresets.body,
  },
});