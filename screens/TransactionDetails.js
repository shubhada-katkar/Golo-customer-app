import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import Topbar from "../components/Topbar";

export default function TransactionDetails() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();

  const { transaction } = route.params;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Topbar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: colors.text }]}>
          Transaction Details
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border || "#000000" }]} />

      {/* Details Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card || "#fff",
            borderColor: colors.border || "#ddd",
          },
        ]}
      >
        <DetailRow label="Transaction ID" value={transaction.id} />
        <DetailRow label="Amount" value={transaction.amount} />
        <DetailRow label="Status" value={transaction.status} />
        <DetailRow label="Date" value={transaction.date} />
      </View>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  heading: {
    fontSize: 20,
    fontFamily: "SemiBold",
    lineHeight: Math.round(20 * 1.5),
  },

  divider: {
    height: 1,
    marginTop:6
  },

  card: {
    margin: 15,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },

  row: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontFamily: "SemiBold",
    color: "#777",
    marginBottom: 4,
    lineHeight: Math.round(14 * 1.5),
  },

  value: {
    fontSize: 16,
    fontFamily: "Medium",
    color: "#000",
    lineHeight: Math.round(16 * 1.5),
  },
});