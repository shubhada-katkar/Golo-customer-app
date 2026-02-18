import React, {useState} from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Switch, Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Card3() {
  const [addPrice, setAddPrice] = useState(false);
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.previewCard}>
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

      <Text style={styles.cardTitle}>Garba workshop this weekend</Text>
      <Text style={styles.cardDesc}>
        Free entry for college students. Everyone welcome
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} />
          <Text style={styles.metaText}>Model Town, 0.8km</Text>
        </View>
        <Text style={styles.metaText}>City Hall Club</Text>
      </View>

      <View style={styles.btnRow}>
        <View style={styles.chatBtn}><Text style={styles.btnText}>Chat</Text></View>
        <View style={styles.callBtn}><Text style={styles.btnText}>Call</Text></View>
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
      </View>

      <TouchableOpacity style={styles.nextBtn}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  previewCard: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginTop: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  tag: { backgroundColor: "#eef0f3", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Medium" },
  timeText: { fontSize: 12, color: "#777", marginTop: 6, fontFamily: "Medium" },
  cardTitle: { fontSize: 16, marginTop: 10, fontFamily: "Medium" },
  cardDesc: { fontSize: 13, color: "#666", marginTop: 4, fontFamily: "Medium" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#444", fontFamily: "Medium" },
  btnRow: { flexDirection: "row", marginTop: 14 },
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