import React, { useContext } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";

export default function PublicNotice({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
  if (category?.id !== "publicnotice") return null;
  const navigation = useNavigation();
  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      setFormData({
        ...formData,
        pdf: {
          name: file.name,
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType,
        },
      });
    } catch (error) {
      console.log("PDF pick error:", error);
    }
  };
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
        <Text style={styles.composeTitle}>Public Notice</Text>

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

        <Text style={styles.label}>Notice Type</Text>
        <TextInput
          style={styles.input}
          value={formData.noticetype || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, noticetype: text })
          }
          placeholder="e.g. Event Announcement"
        />

        <Text style={styles.label}>Issuing Authority</Text>
        <TextInput
          style={styles.input}
          value={formData.issuingAuthority || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, issuingAuthority: text })
          }
          placeholder="e.g. City Council, Company Name"
        />

        <Text style={styles.label}>Detailed Notice Text</Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.detailedNotice || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, detailedNotice: text })
          }
          placeholder="Enter Detailed Notice Text"
          multiline
  textAlignVertical="top" // Starts text from the top (Android)
  scrollEnabled={true}
        />

        <Text style={styles.label}>Upload PDF</Text>
        <View
          style={styles.uploadBox}
        >
          <AntDesign name="upload" size={40} color="#157a4f" />
          <Text style={styles.uploadText}>Upload a PDF</Text>
          <TouchableOpacity style={styles.cameraBtn} onPress={pickPDF}>
            <Text style={styles.cameraText}>Browse Files</Text>
          </TouchableOpacity>
        </View>
        {formData.pdf && (
          <Text style={{ marginTop: 10, color: "#157a4f", fontFamily: "Medium" }}>
            Selected: {formData.pdf.name}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("CalendarScreen", { category, template, formData, price }); }}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
  label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontSize:14, fontFamily:"Medium" },
  textArea: { height: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontFamily: "Medium" },
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
  uploadText: { color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5), paddingVertical: 8 },
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
   descriptionInput: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 12,
  minHeight: 150,      // Increased height
  maxHeight: 150,      // Keeps the box fixed after this height
  fontSize: 14,
  textAlignVertical: "top",
  fontFamily:"Medium"
},
});

