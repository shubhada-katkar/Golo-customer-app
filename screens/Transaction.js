import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const transactions = [
  {
    id: "1",
    amount: "₹199",
    status: "Success",
    date: "11 Mar 2026",
    details: "Details"
  },
  {
    id: "2",
    amount: "₹299",
    status: "Success",
    date: "10 Mar 2026",
    details: "Details"
  },
  {
    id: "3",
    amount: "₹99",
    status: "Pending",
    date: "10 Mar 2026",
    details: "Details"
  },
  {
    id: "4",
    amount: "₹149",
    status: "Failed",
    date: "09 Mar 2026",
    details: "Details"
  },
  {
    id: "5",
    amount: "₹100",
    status: "Success",
    date: "09 Mar 2026",
    details: "Details"
  },
];

export default function Transaction() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // Responsive column width
  const columnWidth = width < 400 ? 96 : width < 768 ? 100 : 96;

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.tableRow,
        { borderBottomColor: colors.border || "#eee" },
      ]}
    >

      <Text
        style={[styles.cell, { color: colors.text, width: columnWidth }]}
      >
        {item.amount}
      </Text>

      <Text
        style={[
          styles.cell,
          { width: columnWidth },
          item.status === "Success"
            ? styles.success
            : item.status === "Pending"
              ? styles.pending
              : styles.failed,
        ]}
      >
        {item.status}
      </Text>

      <Text
        style={[styles.cell, { color: colors.text, width: columnWidth }]}
      >
        {item.date}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}
      >
        <MaterialIcons name="arrow-forward-ios" size={18} color={colors.text}
          style={[styles.cell, { width: columnWidth }]}
        />
      </TouchableOpacity>
    </View>
  );

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
      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            color={colors.text}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>

        <Text style={styles.heading} >
          Transaction History
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {[
                "Amount",
                "Status",
                "Date",
                "View Details",
              ].map((title, index) => (
                <Text
                  key={index}
                  style={[
                    styles.headerCell,
                    { width: columnWidth },
                  ]}
                >
                  {title}
                </Text>
              ))}
            </View>

            {/* Table Body */}
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
  },

  heading: {
    ...textPresets.title
  },

  divider: {
    height: 1,
    backgroundColor: "#000",
    marginVertical: 6
  },

  container: {
    flex: 1,
  },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 8,
  },

  headerCell: {
    textAlign: "center",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  cell: {
    textAlign: "center",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body,
  },

  success: {
    color: "green",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body
  },

  pending: {
    color: "orange",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },

  failed: {
    color: "red",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
});