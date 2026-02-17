import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PreviewCard({ navigation }) {
  return (
    <TouchableOpacity
      style={styles.previewCard}
      onPress={() => navigation.navigate("FormPage", { template: "card3" })}
    >
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
    </TouchableOpacity>
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
});
