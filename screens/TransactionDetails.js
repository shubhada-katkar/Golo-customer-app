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
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

export default function TransactionDetails() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();

  const { transaction } = route.params;

  const getStatusColors = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "success" || s === "completed" || s === "paid") {
      return { bg: "#e3f2ea", text: "#157a4f" };
    }
    if (s === "pending" || s === "processing") {
      return { bg: "#fdf0db", text: "#f5b849" };
    }
    if (s === "failed" || s === "cancelled" || s === "declined") {
      return { bg: "#f0f0f0", text: "#777777" };
    }
    return { bg: "#f0f0f0", text: "#777777" };
  };

  const statusColors = getStatusColors(transaction.status);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 270, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
      />
      <Topbar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
          />
        </TouchableOpacity>

        <Text style={styles.heading}>
          Transaction Details
        </Text>
      </View>

      {/* Hero Amount Card */}
      <View style={styles.heroCard}>
        <Text style={[styles.cardTitle, { alignSelf: "flex-start" }]}>Transaction Amount</Text>
        <Text style={styles.heroLabel}>Total Amount</Text>
        <Text style={styles.heroAmount}>{transaction.amount}</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors.bg },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors.text },
            ]}
          />
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {transaction.status}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: "#fff",
            borderColor: "#eee",
          },
        ]}
      >
        <Text style={styles.cardTitle}>
          Transaction Info
        </Text>

        <DetailRow
          icon="receipt-long"
          label="Transaction ID"
          value={transaction.id}
          colors={colors}
        />
        <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />

        <DetailRow
          icon="event"
          label="Date"
          value={transaction.date}
          colors={colors}
        />
      </View>
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value, colors }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={icon} size={16} color="#157a4f" />
      </View>
      <Text style={[styles.label, { color: colors.subtext || "#777" }]}>{label}</Text>
    </View>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  backButton: {
    padding: 10
  },

  heading: {
    ...textPresets.title
  },

  heroCard: {
    marginHorizontal: 15,
    marginTop: 14,
    marginBottom: 15,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  heroLabel: {
    color: "#999999",
    marginBottom: 6,
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },

  heroAmount: {
    color: "#157a4f",
    marginBottom: 14,
    ...textPresets.title
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    textTransform: "capitalize",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },

  card: {
    marginHorizontal: 15,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
  },

  cardTitle: {
    marginBottom: 14,
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  rowDivider: {
    height: 1,
  },

  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#e3f2ea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  label: {
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },

  value: {
    lineHeight: Math.round(14 * 1.5),
    marginLeft: 10,
    ...textPresets.body,
  },
});