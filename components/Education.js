import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Education({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations }) {
  if (category?.id !== "education") return null;
  const navigation = useNavigation();

  return (
    <View>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 5, paddingBottom: 10 }}>
        <Text style={styles.composeTitle}>Education Details</Text>

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#108136", borderRadius: 10 }}
          onPress={onPrevious}
        >
          <AntDesign name="arrow-left" size={18} color="#ffffff" />
          <Text style={{ fontFamily: "Medium", fontSize: 16, marginLeft: 6, color: "#ffffff", lineHeight: Math.round(16 * 1.5) }}>
            Previous
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>

        {/* institutionType — required, must match enum */}
        <Text style={styles.label}>Institution Type *</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.institutionType || ""}
            onValueChange={(value) => setFormData({ ...formData, institutionType: value })}
            mode="dropdown"
          >
            <Picker.Item label="Select Institution Type" value="" />
            <Picker.Item label="School" value="School" />
            <Picker.Item label="College" value="College" />
            <Picker.Item label="Coaching" value="Coaching" />
            <Picker.Item label="Tutorial" value="Tutorial" />
            <Picker.Item label="Online Course" value="Online Course" />
          </Picker>
        </View>

        {/* institutionName — required */}
        <Text style={styles.label}>Institution Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.institutionName || ""}
          onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
          placeholder="e.g. ABC Academy / Tutor Name"
        />

        {/* courseName */}
        <Text style={styles.label}>Course Name</Text>
        <TextInput
          style={styles.input}
          value={formData.courseName || ""}
          onChangeText={(text) => setFormData({ ...formData, courseName: text })}
          placeholder="e.g. Class 10 Maths, JEE Prep"
        />

        {/* duration */}
        <Text style={styles.label}>Duration</Text>
        <TextInput
          style={styles.input}
          value={formData.duration || ""}
          onChangeText={(text) => setFormData({ ...formData, duration: text })}
          placeholder="e.g. 6 Months, 1 Year"
        />

        {/* fees */}
        <Text style={styles.label}>Fees (₹)</Text>
        <TextInput
          style={styles.input}
          value={formData.fees || ""}
          onChangeText={(text) => setFormData({ ...formData, fees: text })}
          keyboardType="numeric"
          placeholder="Amount per month/course"
        />

        {/* eligibility */}
        <Text style={styles.label}>Eligibility</Text>
        <TextInput
          style={styles.input}
          value={formData.eligibility || ""}
          onChangeText={(text) => setFormData({ ...formData, eligibility: text })}
          placeholder="e.g. 10th pass, anyone"
        />

        {/* contactPerson */}
        <Text style={styles.label}>Contact Person</Text>
        <TextInput
          style={styles.input}
          value={formData.contactPerson || ""}
          onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
          placeholder="e.g. Mr. Sharma"
        />

        {/* contactNumber */}
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={formData.contactNumber || ""}
          onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
          keyboardType="phone-pad"
          placeholder="e.g. 9876543210"
        />

        {/* email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.eduEmail || ""}
          onChangeText={(text) => setFormData({ ...formData, eduEmail: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="contact@academy.com"
        />

        {/* affiliatedTo */}
        <Text style={styles.label}>Affiliated To</Text>
        <TextInput
          style={styles.input}
          value={formData.affiliatedTo || ""}
          onChangeText={(text) => setFormData({ ...formData, affiliatedTo: text })}
          placeholder="e.g. CBSE, State Board"
        />

        {/* website */}
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={formData.website || ""}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          keyboardType="url"
          autoCapitalize="none"
          placeholder="e.g. www.myacademy.com"
        />

        {/* establishedYear */}
        <Text style={styles.label}>Established Year</Text>
        <TextInput
          style={styles.input}
          value={formData.establishedYear || ""}
          onChangeText={(text) => setFormData({ ...formData, establishedYear: text })}
          keyboardType="numeric"
          placeholder="e.g. 2005"
        />

        {/* studentCapacity */}
        <Text style={styles.label}>Student Capacity</Text>
        <TextInput
          style={styles.input}
          value={formData.studentCapacity || ""}
          onChangeText={(text) => setFormData({ ...formData, studentCapacity: text })}
          keyboardType="numeric"
          placeholder="e.g. 50"
        />

      </View>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => {
          navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations });
        }}
      >
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
  label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 },
  pickerWrap: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden", marginTop: 6 },
  nextBtn: {
    flexDirection: "row",
    backgroundColor: "#157a4f",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    justifyContent: "center",
  },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
});