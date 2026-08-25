import React, { useContext, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function PublicNotice({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
  if (category?.id !== "publicnotice") return null;
  const navigation = useNavigation();
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });
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
              ...textPresets.body,
              marginLeft: 6,
              color: "#ffffff",
              lineHeight: Math.round(14 * 1.5),
            }}
          >
            Previous
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>

        <Text style={styles.label}>Notice Type <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={formData.noticetype || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, noticetype: value })
            }
            mode="dropdown"
          >
            <Picker.Item label="Select Notice Type" value="" />
            <Picker.Item label="Tender" value="tender" />
            <Picker.Item label="Government" value="government" />
            <Picker.Item label="Legal" value="legal" />
            <Picker.Item label="Announcement" value="announcement" />
          </Picker>
        </View>

        <Text style={styles.label}>Issuing Authority <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.issuingAuthority || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, issuingAuthority: text })
          }
          placeholder="Department Name/Organization Name"
        />

        <Text style={styles.label}>Detailed Notice Text <Text style={{ color: "#d92d20" }}>*</Text></Text>
        <TextInput
          style={styles.descriptionInput}
          value={formData.detailedNotice || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, detailedNotice: text })
          }
          placeholder="Enter complete notice details..."
          multiline
          textAlignVertical="top" // Starts text from the top (Android)
          scrollEnabled={true}
        />

        <Text style={styles.label}>Supporting Documents</Text>
        <View
          style={styles.uploadBox}
        >
          <AntDesign name="upload" size={30} color="#157a4f" />
          <Text style={styles.uploadText}>Upload a PDF</Text>
          <TouchableOpacity style={styles.cameraBtn} onPress={pickPDF}>
            <Text style={styles.cameraText}>Browse Files</Text>
          </TouchableOpacity>
        </View>
        {formData.pdf && (
          <Text style={{ marginTop: 10, color: "#157a4f", }}>
            Selected: {formData.pdf.name}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => {
          if (!formData.noticetype) {
            setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Notice Type.", type: "warning" });
            return;
          }
          if (!formData.issuingAuthority?.trim()) {
            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Issuing Authority.", type: "warning" });
            return;
          }
          if (!formData.detailedNotice?.trim()) {
            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Detailed Notice Text.", type: "warning" });
            return;
          }
          navigation.navigate("CalendarScreen", { category, template, formData, price });
        }}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

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
  textArea: { height: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, },
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
  uploadText: { color: "#555", ...textPresets.body, paddingVertical: 8, lineHeight: Math.round(14 * 1.5) },
  cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  cameraText: { color: "#fff", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },

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
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 150,      // Increased height
    maxHeight: 150,      // Keeps the box fixed after this height
    textAlignVertical: "top",
    ...textPresets.body
  },
});

