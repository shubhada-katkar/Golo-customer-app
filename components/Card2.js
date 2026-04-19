import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Switch, Image, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function Card2({ category, formData, setFormData, onNext }) {
  const [addPrice, setAddPrice] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload image");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions
        ? ImagePicker.MediaTypeOptions.Images
        : "Images",
      allowsMultipleSelection: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to take photo");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled && result.assets?.length > 0) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.composeTitle}>Basic Details</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{category?.label || category}</Text>

        <Text style={styles.label}>Heading</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) => setFormData({ ...formData, heading: text })}
          placeholder="Type your heading here..."
        />

        <Text style={styles.label}>Body text</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.body}
          onChangeText={(text) => setFormData({ ...formData, body: text })}
          multiline
          placeholder="Type your description here..."
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          placeholder="Type your Location here..."
        />

        <Text style={styles.label}>Contact no.</Text>
        <TextInput
          style={styles.input}
          value={formData.contact}
          onChangeText={(text) => setFormData({ ...formData, contact: text })}
          keyboardType="phone-pad"
          placeholder="e.g. 9876543210"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Do you want to add price?</Text>
          <Switch value={addPrice} onValueChange={setAddPrice} />
        </View>
        {addPrice && (
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="Add your product price here"
            keyboardType="numeric"
          />
        )}

        <Text style={styles.label}>Add Image (1 image)</Text>
        <View style={styles.uploadBox}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: "center" }}>
            <Ionicons name="cloud-upload-outline" size={28} color="#555" />
            <Text style={styles.uploadText}>Upload image from gallery</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
            <Text style={styles.cameraText}>Open Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Show selected image with change button */}
        {formData.image ? (
          <View style={{ marginTop: 12, position: "relative" }}>
            <Image
              source={{ uri: formData.image }}
              style={{ width: "100%", height: 180, borderRadius: 10 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setFormData({ ...formData, image: null })}
            >
              <Ionicons name="close-circle" size={26} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { fontSize: 16, marginTop: 10, fontFamily: "Medium" },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 },
  textArea: { height: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  uploadBox: {
    borderWidth: 1, borderStyle: "dashed", borderColor: "#aaa",
    borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8,
  },
  uploadText: { marginTop: 6, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  orText: { marginVertical: 6, color: "#999", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  cameraText: { color: "#fff", fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) },
  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  removeBtn: { position: "absolute", top: -10, right: -10, backgroundColor: "#fff", borderRadius: 13 },
});
