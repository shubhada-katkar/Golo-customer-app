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

const transactions = [
  {
    id: "1",
    paymentId: "PAY12345",
    orderId: "ORD1001",
    method: "UPI",
    amount: "₹199",
    status: "Success",
    date: "11 Mar 2026",
  },
  {
    id: "2",
    paymentId: "PAY12346",
    orderId: "ORD1002",
    method: "Credit Card",
    amount: "₹299",
    status: "Success",
    date: "10 Mar 2026",
  },
  {
    id: "3",
    paymentId: "PAY12347",
    orderId: "ORD1003",
    method: "UPI",
    amount: "₹99",
    status: "Pending",
    date: "10 Mar 2026",
  },
  {
    id: "4",
    paymentId: "PAY12348",
    orderId: "ORD1004",
    method: "Debit Card",
    amount: "₹149",
    status: "Failed",
    date: "09 Mar 2026",
  },
  {
    id: "5",
    paymentId: "PAY12349",
    orderId: "ORD1005",
    method: "Debit Card",
    amount: "₹100",
    status: "Success",
    date: "09 Mar 2026",
  },
];

export default function Transaction() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // Responsive column width
  const columnWidth = width < 400 ? 100 : width < 768 ? 120 : 150;

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.tableRow,
        { borderBottomColor: colors.border || "#eee" },
      ]}
    >
      <Text
        style={[styles.cell, { color: colors.text, width: columnWidth }]}
        numberOfLines={1}
      >
        {item.paymentId}
      </Text>

      <Text
        style={[styles.cell, { color: colors.text, width: columnWidth }]}
        numberOfLines={1}
      >
        {item.orderId}
      </Text>

      <Text
        style={[styles.cell, { color: colors.text, width: columnWidth }]}
        numberOfLines={1}
      >
        {item.method}
      </Text>

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
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Topbar />

      {/* Header */}
      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={colors.text}
            style={{ padding: 8 }}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.heading,
            {
              color: colors.text,
              fontSize: width < 400 ? 18 : 22,
            },
          ]}
        >
          Transaction History
        </Text>
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border || "#ccc" },
        ]}
      />

      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {[
                "Payment ID",
                "Order ID",
                "Method",
                "Amount",
                "Status",
                "Date",
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
    paddingVertical: 6,
  },

  heading: {
    fontFamily: "SemiBold",
    lineHeight: 28,
    flexShrink: 1,
  },

  divider: {
    height: 1,
    marginTop: 6,
  },

  container: {
    flex: 1,
    padding: 10,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eaeaea",
    paddingVertical: 12,
    borderRadius: 8,
  },

  headerCell: {
    fontFamily: "SemiBold",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 5,
    lineHeight: Math.round(14 * 1.5),
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  cell: {
    textAlign: "center",
    fontFamily: "Medium",
    fontSize: 13,
    paddingHorizontal: 5,
    lineHeight: Math.round(13 * 1.5),
  },

  success: {
    color: "green",
    fontFamily: "SemiBold",
    fontSize: 13,
    lineHeight: Math.round(13 * 1.5),
  },

  pending: {
    color: "orange",
    fontFamily: "SemiBold",
    fontSize: 13,
    lineHeight: Math.round(13 * 1.5),
  },

  failed: {
    color: "red",
    fontFamily: "SemiBold",
    fontSize: 13,
    lineHeight:Math.round(13 * 1.5),
  },
});