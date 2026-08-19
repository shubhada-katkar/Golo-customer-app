import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { BASE_URL } from "../config";
import { getValidToken } from "../services/authService";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const getStatusLabel = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "captured" || s === "completed" || s === "paid" || s === "success") return "Success";
  if (s === "created" || s === "authorized" || s === "pending") return "Pending";
  if (s === "failed" || s === "cancelled") return "Failed";
  if (s === "refunded" || s === "partially_refunded") return "Refunded";
  return status || "Unknown";
};

export default function Transaction() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Responsive column width
  const columnWidth = width < 400 ? 96 : width < 768 ? 100 : 96;

  const fetchTransactions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      const res = await fetch(`${BASE_URL}/payments/my?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (res.ok && json?.success && json?.data?.items) {
        setTransactions(json.data.items);
      } else {
        if (!isSilent) setError(json?.message || "Failed to load transactions");
      }
    } catch (err) {
      if (!isSilent) {
        if (err?.message !== "NOT_AUTHENTICATED" && err?.message !== "SESSION_EXPIRED") {
          setError("Unable to fetch transactions. Check network connection.");
        }
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(false);
      const interval = setInterval(() => {
        fetchTransactions(true);
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(true);
  };

  const getStatusStyle = (status) => {
    const label = getStatusLabel(status);
    if (label === "Success") return styles.success;
    if (label === "Pending") return styles.pending;
    if (label === "Failed") return styles.failed;
    if (label === "Refunded") return styles.refunded;
    return styles.cell;
  };

  const renderItem = ({ item }) => {
    const displayAmount = item.amount != null
      ? `₹${item.amount}`
      : item.amountInPaise
        ? `₹${item.amountInPaise / 100}`
        : "₹0";
    const statusLabel = getStatusLabel(item.status);
    const dateLabel = formatDate(item.createdAt || item.date);

    return (
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
          {displayAmount}
        </Text>

        <Text
          style={[
            styles.cell,
            { width: columnWidth },
            getStatusStyle(item.status),
          ]}
          numberOfLines={1}
        >
          {statusLabel}
        </Text>

        <Text
          style={[styles.cell, { color: colors.text, width: columnWidth }]}
          numberOfLines={1}
        >
          {dateLabel}
        </Text>

        <TouchableOpacity
          style={{ width: columnWidth, alignItems: "center" }}
          onPress={() => navigation.navigate("TransactionDetails", { transaction: item, paymentId: item.paymentId || item.id })}
        >
          <MaterialIcons name="arrow-forward-ios" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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

        <Text style={styles.heading}>
          Transaction History
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.container}>
        {loading && transactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#157a4f" />
            <Text style={[styles.infoText, { color: colors.text }]}>Loading transactions...</Text>
          </View>
        ) : error && transactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color="#d9534f" />
            <Text style={[styles.infoText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTransactions(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="receipt-long" size={48} color="#aaa" />
            <Text style={[styles.infoText, { color: colors.text }]}>No transactions found</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: columnWidth * 4 }}>
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
                keyExtractor={(item) => item.paymentId || item.id || String(Math.random())}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#157a4f"]} />
                }
              />
            </View>
          </ScrollView>
        )}
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
    ...textPresets.title,
  },

  divider: {
    height: 1,
    backgroundColor: "#000",
    marginVertical: 6,
  },

  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  infoText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
    ...textPresets.body,
  },

  retryButton: {
    marginTop: 14,
    backgroundColor: "#157a4f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: "#fff",
    fontWeight: "bold",
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
    alignItems: "center",
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
    ...textPresets.body,
  },

  pending: {
    color: "orange",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body,
  },

  failed: {
    color: "red",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body,
  },

  refunded: {
    color: "#6f42c1",
    lineHeight: Math.round(14 * 1.5),
    ...textPresets.body,
  },
});
