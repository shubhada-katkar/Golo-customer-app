import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Card1({ navigation }) {
  return (
    <TouchableOpacity
      style={styles.card1}
      onPress={() => navigation.navigate("FormPage", { template: "card1" })} >
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

      <View style={styles.image1} />

      <View style={styles.row}>
        <Text style={styles.cardTitle}>Home Tiffin Service Now Available</Text>
        <Text style={styles.metaText}>₹450</Text>
      </View>

      <Text style={styles.cardDesc}>Pure Veg Meals</Text>

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

      <View style={styles.btnRow}>
        <View style={styles.chatBtn}>
          <Text style={styles.btnText}>Chat</Text>
        </View>
        <View style={styles.callBtn}>
          <Text style={styles.btnText}>Call</Text>
        </View>
      </View>
    </TouchableOpacity>
  ); }

const styles = StyleSheet.create({
  card1: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { backgroundColor: "#eef0f3", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Medium" },
  timeText: { fontSize: 12, color: "#777", marginTop: 6, fontFamily: "Medium" },
  image1: {
    borderRadius: 10,
    backgroundColor: "#d8d8d8",
    height: height * 0.23,
    width: width - 75,
    alignSelf: "center",
    marginTop: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cardTitle: { fontSize: 16, fontFamily: "Medium" },
  cardDesc: { fontSize: 13, color: "#666", marginTop: 4, fontFamily: "Medium" },
  metaText: { fontSize: 12, color: "#444", fontFamily: "Medium" },
  metaGroup: { flexDirection: "row", gap: 26, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  chatBtn: { backgroundColor: "#f5b849", flex: 1, marginRight: 8, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  callBtn: { backgroundColor: "#157a4f", flex: 1, marginLeft: 8, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 14, fontFamily: "Medium" },
  iconRow: { flexDirection: "row", gap: 10 },
});