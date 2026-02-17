import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Card2({ navigation }) {
  return (
    <TouchableOpacity
      style={styles.card2}
      onPress={() => navigation.navigate("FormPage", { template: "card2" })}
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
    </TouchableOpacity>
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
});
