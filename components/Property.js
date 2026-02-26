import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

export default function Property({ formData, setFormData, category, onPrevious }) {
  if (category?.id !== "property") return null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 5,
        }}
      >
        <Text style={styles.composeTitle}>Education</Text>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8, 
            paddingVertical:5,
            backgroundColor:"#108136",
            borderRadius:10         // bigger touch target
          }}
         onPress={onPrevious}  >
          <AntDesign name="arrow-left" size={18} color="#ffffff"/>
          <Text style={{fontFamily:"Medium", fontSize:16, marginLeft: 6, 
            color:"#ffffff", lineHeight:Math.round(16*1.5) }}>Previous</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>

        <Text style={styles.label}>Course Type</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, courseType: text })
          }
          placeholder="Type your text here..."
        />

        <Text style={styles.label}>Class / Standard</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, class: text })
          }
          placeholder="e.g. 10th Grade, JEE"
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, subject: text })
          }
          placeholder="Mathematics, Physics, Chemistry..."
        />

        <Text style={styles.label}>Institute Name / Personal Brand </Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, institute: text })
          }
          placeholder="Academy Name or Tutor Name"
        />

        <Text style={styles.label}>Duration</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, duration: text })
          }
          placeholder="e.g. 6 Months"
        />

        <Text style={styles.label}>Fees</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, fees: text })
          }
          placeholder="Amount per month/course"
        />

        <Text style={styles.label}>Teaching Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, experience: text })
          }
          placeholder="Years of Experience"
        />

        <Text style={styles.label}>Qualification</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, qualification: text })
          }
          placeholder="Highest Degree"
        />

      </View>

      <TouchableOpacity style={styles.nextBtn}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>

    </ScrollView >
  );
}

const styles = StyleSheet.create({

  composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { fontSize: 16, marginTop: 10, fontFamily: "Medium", lineHeight:Math.round(16*1.5) },
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

  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
});