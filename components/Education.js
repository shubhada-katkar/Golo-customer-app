import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Education({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "education") return null;
  const navigation = useNavigation();
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

  const Radio = ({ label, selected, onPress }) => (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <View style={styles.radioOuter}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
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
        <Text style={styles.composeTitle}>Education</Text>

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

        <Text style={styles.label}>Institution Type <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.courseType || ""}
            onValueChange={(value) => setFormData({ ...formData, courseType: value })}
            mode="dropdown"
          >
            <Picker.Item label="Select institution type" value="" />
            <Picker.Item label="School" value="school" />
            <Picker.Item label="Coaching" value="coaching" />
            <Picker.Item label="College" value="college" />
            <Picker.Item label="Online Course" value="online course" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Mode of Education <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          <Radio
            label="Online"
            selected={formData.modeOfEducation === "online"}
            onPress={() => setFormData({ ...formData, modeOfEducation: "online" })}
          />
          <Radio
            label="Offline"
            selected={formData.modeOfEducation === "offline"}
            onPress={() => setFormData({ ...formData, modeOfEducation: "offline" })}
          />
        </View>

        <Text style={styles.label}>Demo Class Available <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          <Radio
            label="Yes"
            selected={formData.demoAvailable === "yes"}
            onPress={() => setFormData({ ...formData, demoAvailable: "yes" })}
          />
          <Radio
            label="No"
            selected={formData.demoAvailable === "no"}
            onPress={() => setFormData({ ...formData, demoAvailable: "no" })}
          />
        </View>

        <Text style={styles.label}>Class / Standard <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.class || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, class: text })
          }
          placeholder="e.g. 10th Grade, JEE"
        />

        <Text style={styles.label}>Course Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.subject || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, subject: text })
          }
          placeholder="Mathematics, Physics, Chemistry..."
        />

        <Text style={styles.label}>Institute Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.institute || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, institute: text })
          }
          placeholder="Academy Name or Tutor Name"
        />

        <Text style={styles.label}>Duration <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.duration || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, duration: text })
          }
          placeholder="e.g. 6 Months"
        />

        <Text style={styles.label}>Fees <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.fees || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, fees: text })
          }
          placeholder="e.g. 5000"
        />

        <Text style={styles.label}>Teaching Experience <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.experience || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, experience: text })
          }
          placeholder="e.g. 5 years"
        />

        <Text style={styles.label}>Qualification <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.qualification || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, qualification: text })
          }
          placeholder="Highest Degree"
        />
      </View>

      {!isEditMode && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (!formData.courseType) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Institution Type.", type: "warning" });
              return;
            }
            if (!formData.modeOfEducation) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Mode of Education.", type: "warning" });
              return;
            }
            if (!formData.demoAvailable) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Demo Class Available.", type: "warning" });
              return;
            }
            if (!formData.class?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Class / Standard.", type: "warning" });
              return;
            }
            if (!formData.subject?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Course Name.", type: "warning" });
              return;
            }
            if (!formData.institute?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Institute Name.", type: "warning" });
              return;
            }
            if (!formData.duration?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Duration.", type: "warning" });
              return;
            }
            if (!formData.fees?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Fees.", type: "warning" });
              return;
            }
            if (!formData.experience?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Teaching Experience.", type: "warning" });
              return;
            }
            if (!formData.qualification?.trim()) {
              setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Qualification.", type: "warning" });
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
  nextText: { color: "#fff", lineHeight: Math.round(14 * 1.5), ...textPresets.body },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    // overflow: "hidden",
  },
  radioRow: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#157a4f",
  },
  radioLabel: { ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
});

