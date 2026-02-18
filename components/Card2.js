import React, {useState} from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Switch, Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

export default function Card2() {
  const [addPrice, setAddPrice] = useState(false);
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload image");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow camera access to take photo");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.card2} >
        <View style={styles.topRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Product / Service</Text>
          </View>
          <View style={styles.iconRow}>
            <Ionicons name="heart-outline" size={18} />
            <Ionicons name="share-social-outline" size={18} />
          </View>
        </View>

        <Text style={styles.timeText}>20m ago</Text>

        <View style={styles.row2}>
          <View style={styles.image2} />
          <View>
            <Text style={styles.cardTitle}>Home Tiffin Service</Text>
            <Text style={styles.cardDesc}>Pure Veg Meals</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>₹450</Text>

          <View style={styles.metaGroup}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} />
              <Text style={styles.metaText}>Rajampuri</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} />
              <Text style={styles.metaText}>Ghar ka Tiffin</Text>
            </View>
          </View>
        </View>

        <View style={styles.btnRow}>
          <View style={styles.chatBtn}>
            <Text style={styles.btnText}>Chat</Text>
          </View>
          <View style={styles.callBtn}>
            <Text style={styles.btnText}>Call</Text>
          </View>
        </View>
      </View>

      <Text style={styles.composeTitle}>Compose</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>Food</Text>

        <Text style={styles.label}>Heading</Text>
        <TextInput style={styles.input} placeholder="Type your text here..." />

        <Text style={styles.label}>Body text</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline placeholder="Type your text here..." />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} placeholder="Type your Location here..." />

        <Text style={styles.label}>Contact no.</Text>
        <TextInput style={styles.input} placeholder="Type your Contact no here..." keyboardType="phone-pad" />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Do you want to add price?</Text>
          <Switch value={addPrice} onValueChange={setAddPrice} />
        </View>

        {addPrice && (
          <TextInput style={styles.input} placeholder="Add your product price here" keyboardType="numeric" />
        )}

        <Text style={styles.label}>Add Image</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <Ionicons name="cloud-upload-outline" size={28} color="#555" />
          <Text style={styles.uploadText}>Upload your image here</Text>
          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
            <Text style={styles.cameraText}>Open Camera</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {image && (
          <Image
            source={{ uri: image }}
            style={{
              width: "100%",
              height: 180,
              borderRadius: 10,
              marginTop: 12,
            }}
          />
        )}
      </View>

      <TouchableOpacity style={styles.nextBtn}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card2: { backgroundColor: "#fff", padding: 18, borderRadius: 10, marginTop: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  tag: { backgroundColor: "#eef0f3", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Medium" },
  timeText: { fontSize: 12, color: "#777", marginTop: 6, fontFamily: "Medium" },
  row2: { flexDirection: "row", gap: 10, marginTop: 10 },
  image2: { width: 160, height: 100, backgroundColor: "#d8d8d8", borderRadius: 10 },
  cardTitle: { fontSize: 16, fontFamily: "Medium" },
  cardDesc: { fontSize: 13, color: "#666", fontFamily: "Medium" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  metaText: { fontSize: 12, color: "#444", fontFamily: "Medium" },
  metaGroup: { flexDirection: "row", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  btnRow: { flexDirection: "row", marginTop: 12 },
  chatBtn: { backgroundColor: "#f5b849", flex: 1, marginRight: 8, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  callBtn: { backgroundColor: "#157a4f", flex: 1, marginLeft: 8, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 14, fontFamily: "Medium" },
  iconRow: { flexDirection: "row", gap: 10 },

  /* FORM */
  composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { fontSize: 16, marginTop: 10, fontFamily: "Medium" },
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
