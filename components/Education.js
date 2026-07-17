import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Education({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "education") return null;
  const navigation = useNavigation();

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

      <View style={styles.formCard}>

        <Text style={styles.label}>Institution Type</Text>
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

        <Text style={styles.label}>Mode of Education</Text>
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

        <Text style={styles.label}>Demo Class Available</Text>
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

        <Text style={styles.label}>Class / Standard</Text>
        <TextInput
          style={styles.input}
          value={formData.class || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, class: text })
          }
          placeholder="e.g. 10th Grade, JEE"
        />

        <Text style={styles.label}>Course Name</Text>
        <TextInput
          style={styles.input}
          value={formData.subject || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, subject: text })
          }
          placeholder="Mathematics, Physics, Chemistry..."
        />

        <Text style={styles.label}>Institute Name</Text>
        <TextInput
          style={styles.input}
          value={formData.institute || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, institute: text })
          }
          placeholder="Academy Name or Tutor Name"
        />

        <Text style={styles.label}>Duration</Text>
        <TextInput
          style={styles.input}
          value={formData.duration || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, duration: text })
          }
          placeholder="e.g. 6 Months"
        />

        <Text style={styles.label}>Fees</Text>
        <TextInput
          style={styles.input}
          value={formData.fees || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, fees: text })
          }
          placeholder="e.g. 5000"
        />

        <Text style={styles.label}>Teaching Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.experience || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, experience: text })
          }
          placeholder="e.g. 5 years"
        />

        <Text style={styles.label}>Qualification</Text>
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
      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("CalendarScreen", { category, template, formData, price }); }}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({

  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
  label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontSize: 14, fontFamily: "Medium" },
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
  radioLabel: { fontSize: 15, fontFamily: "Medium", lineHeight: Math.round(15 * 1.5) },
});

