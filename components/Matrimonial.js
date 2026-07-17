import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Matrimonial({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
  if (category?.id !== "matrimonial") return null;
  const navigation = useNavigation();

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 5,
          paddingBottom: 10,
        }}
      >
        <Text style={styles.composeTitle}>Matrimonial</Text>

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
          <Text style={{
            fontFamily: "Medium", fontSize: 16, marginLeft: 6,
            color: "#ffffff", lineHeight: Math.round(16 * 1.5)
          }}>Previous</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, name: text })
          }
          placeholder="Enter full name"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={formData.age || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, age: text })
          }
          placeholder="e.g. 28"
        />

        {/* new dropdowns inserted before religion */}
        <Text style={styles.label}>Profile For</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.profileFor || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, profileFor: value })
            }
            mode="dropdown"
          >
            <Picker.Item label="Profile for" value="" />
            <Picker.Item label="Self" value="self" />
            <Picker.Item label="Relative" value="relative" />
            <Picker.Item label="Friend" value="friend" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.gender || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value })
            }
            mode="dropdown"
          >
            <Picker.Item label="Select gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Marital Status</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.maritalStatus || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, maritalStatus: value })
            }
            mode="dropdown"
          >
            <Picker.Item label="Marital Status" value="" />
            <Picker.Item label="Divorced" value="divorced" />
            <Picker.Item label="Single" value="single" />
            <Picker.Item label="Widow" value="widow" />
            <Picker.Item label="Widower" value="widower" />
          </Picker>
        </View>
        {/* end new dropdowns */}

        <Text style={styles.label}>Religion</Text>
        <TextInput
          style={styles.input}
          value={formData.religion || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, religion: text })
          }
          placeholder="Enter religion"
        />

        <Text style={styles.label}>Caste</Text>
        <TextInput
          style={styles.input}
          value={formData.caste || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, caste: text })
          }
          placeholder="Enter caste"
        />

        <Text style={styles.label}>Education</Text>
        <TextInput
          style={styles.input}
          value={formData.education || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, education: text })
          }
          placeholder="Enter highest education level"
        />

        <Text style={styles.label}>Occupation</Text>
        <TextInput
          style={styles.input}
          value={formData.occupation || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, occupation: text })
          }
          placeholder="Enter occupation"
        />

        <Text style={styles.label}>Annual Income</Text>
        <TextInput
          style={styles.input}
          value={formData.annualIncome || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, annualIncome: text })
          }
          placeholder="e.g. 10 LPA"
        />

        <Text style={styles.label}>Height</Text>
        <TextInput
          style={styles.input}
          value={formData.height || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, height: text })
          }
          placeholder="e.g. 5'6"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={formData.location || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, location: text })
          }
          placeholder="City, State"
        />

        <Text style={styles.label}>About Me</Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.aboutMe || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, aboutMe: text })
          }
          placeholder="Share a brief description about yourself"
          multiline
          scrollEnabled
          textAlignVertical="top"
        />

        <Text style={styles.label}>Partner Preference</Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.partnerPreference || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, partnerPreference: text })
          }
          placeholder="Describe your ideal partner"
          multiline
          textAlignVertical="top"
          scrollEnabled
        />

      </View>

      {!isEditMode && (
        <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("CalendarScreen", { category, template, formData, price }); }}>
          <Text style={styles.nextText}>See Preview</Text>
        </TouchableOpacity>
      )}

    </View >
  );
}

const styles = StyleSheet.create({

  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingBottom: 18, borderRadius: 10, paddingHorizontal: 16 },
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

  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20, flexDirection: "row", justifyContent: "center" },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,      // Increased height
    maxHeight: 100,      // Keeps the box fixed after this height
    fontSize: 14,
    textAlignVertical: "top",
    fontFamily: "Medium"
  },
});

