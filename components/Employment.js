import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";

export default function Employment({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "employment") return null;
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
        <Text style={styles.composeTitle}>Employment</Text>

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

        <Text style={styles.label}>Employment Type</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.employmentType || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, employmentType: value })
            }
            mode="dropdown"
          >
            <Picker.Item label="Select Employment Type" value="" />
            <Picker.Item label="Full Time" value="full time" />
            <Picker.Item label="Part Time" value="part time" />
            <Picker.Item label="Contract" value="contract" />
            <Picker.Item label="Freelance" value="freelance" />
            <Picker.Item label="Internship" value="internship" />
          </Picker>
        </View>

        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          value={formData.jobTitle || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, jobTitle: text })
          }
          placeholder="e.g. Software Engineer"
        />

        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          value={formData.companyName || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, companyName: text })
          }
          placeholder="e.g. Acme Corp"
        />

        <Text style={styles.label}>Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.experience || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, experience: text })
          }
          placeholder="e.g. 2+ years"
        />

        <Text style={styles.label}>Industry</Text>
        <TextInput
          style={styles.input}
          value={formData.industry || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, industry: text })
          }
          placeholder="Industry (e.g. IT)"
        />

        <Text style={styles.label}>Salary Range (Monthly)</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.salaryRange || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, salaryRange: text })
            }
            placeholder="Min."
          />

          <Text style={{ marginVertical: 10 }}>–</Text>

          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.salaryRangeMax || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, salaryRangeMax: text })
            }
            placeholder="Max."
          />
        </View>

        <Text style={styles.label}>Total Vacancies</Text>
        <TextInput
          style={styles.input}
          value={formData.vacancies || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, vacancies: text })
          }
          placeholder="Number of openings"
        />

        <Text style={styles.label}>Job Description</Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.jobDescription || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, jobDescription: text })
          }
          placeholder="Describe the job role and responsibilities..."
          multiline
          scrollEnabled
          textAlignVertical="top"
        />

        <Text style={styles.label}>Requirements</Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.requirements || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, requirements: text })
          }
          placeholder="e.g. Bachelor's degree, 2 years experience..."
          multiline
          scrollEnabled
          textAlignVertical="top"
        />

        <Text style={styles.label}>Benefits & Perks</Text>
        <TextInput
          style={styles.input}
          value={formData.benefits || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, benefits: text })
          }
          placeholder="e.g. Health Insurance, Paid Time Off, WFH"
        />

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
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
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

  segmentRow: {
    flexDirection: "row",
    marginTop: 10,
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

  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 1,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  checkboxTick: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#f5b849",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    maxHeight: 100,
    textAlignVertical: "top",
    ...textPresets.body,
    marginTop: 6,
  },
});