import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Personal({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "personal") return null;
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
        <Text style={styles.composeTitle}>Personal Details</Text>

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

        <Text style={styles.label}>Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.name || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, name: text })
          }
          placeholder="Full name"
        />

        <Text style={styles.label}>Gender <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.gender || ""}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
            mode="dropdown"
          >
            <Picker.Item label="Select gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Age <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.age || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, age: text })
          }
          placeholder="Age"
        />

        <Text style={styles.label}>Achievement Title <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.achievementTitle || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, achievementTitle: text })
          }
          placeholder="e.g. Best Employee of the Year"
        />

        <Text style={styles.label}>Description <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.description || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          placeholder="Brief description about yourself"
          multiline
          textAlignVertical="top" // Starts text from the top (Android)
          scrollEnabled={true}
        />

        <Text style={styles.label}>Contact <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.contact || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, contact: text })
          }
          placeholder="Phone or email"
        />
      </View>

      {!isEditMode && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (!formData.name?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Name.", type: "warning" });
              return;
            }
            if (!formData.gender) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Gender.", type: "warning" });
              return;
            }
            if (!formData.age?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Age.", type: "warning" });
              return;
            }
            if (!formData.achievementTitle?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Achievement Title.", type: "warning" });
              return;
            }
            if (!formData.description?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Description.", type: "warning" });
              return;
            }
            if (!formData.contact?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Contact.", type: "warning" });
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

  composeTitle: { ...textPresets.subtitle },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
  label: { ...textPresets.body, marginTop: 16, lineHeight: Math.round(16 * 1.5) },
  value: { ...textPresets.body, color: "#555", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, ...textPresets.body, },
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
  nextText: { color: "#fff", ...textPresets.body, lineHeight: Math.round(16 * 1.5) },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 150,      // Increased height
    maxHeight: 150,      // Keeps the box fixed after this height
    ...textPresets.body,
    textAlignVertical: "top",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
});

