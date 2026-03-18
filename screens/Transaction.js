import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
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

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.cell}>{item.paymentId}</Text>
      <Text style={styles.cell}>{item.orderId}</Text>
      <Text style={styles.cell}>{item.method}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
      <Text
        style={[
          styles.cell,
          item.status === "Success"
            ? styles.success
            : item.status === "Pending"
            ? styles.pending
            : styles.failed,
        ]}
      >
        {item.status}
      </Text>
      <Text style={styles.cell}>{item.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Topbar />

      {/* Header */}
      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={26}
            color={colors.text}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>

        <Text style={styles.heading}>Transaction History</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.container}>
        <ScrollView horizontal>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Payment ID</Text>
              <Text style={styles.headerCell}>Order ID</Text>
              <Text style={styles.headerCell}>Method</Text>
              <Text style={styles.headerCell}>Amount</Text>
              <Text style={styles.headerCell}>Status</Text>
              <Text style={styles.headerCell}>Date</Text>
            </View>

            {/* Table Body */}
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
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
    fontSize: 22,
    fontFamily: "SemiBold",
    lineHeight: Math.round(22 * 1.2),
  },

  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginTop: 10,
  },

  container: {
    flex: 1,
    padding: 10,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eaeaea",
    paddingVertical: 10,
  },

  headerCell: {
    width: 120,
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
    textAlign: "center",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  cell: {
    width: 120,
    textAlign: "center",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },

  success: {
    color: "green",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),    
  },

  pending: {
    color: "orange",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },

  failed: {
    color: "red",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
});