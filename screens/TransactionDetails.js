import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Topbar from "../components/Topbar";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { BASE_URL } from "../config";
import { getValidToken } from "../services/authService";

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

const getStatusColors = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "captured" || s === "completed" || s === "paid" || s === "success") {
    return { bg: "#e3f2ea", text: "#157a4f", label: "Success" };
  }
  if (s === "created" || s === "authorized" || s === "pending") {
    return { bg: "#fdf0db", text: "#f5b849", label: "Pending" };
  }
  if (s === "failed" || s === "cancelled" || s === "declined") {
    return { bg: "#fde8e8", text: "#d9534f", label: "Failed" };
  }
  if (s === "refunded" || s === "partially_refunded") {
    return { bg: "#f0ebf8", text: "#6f42c1", label: "Refunded" };
  }
  return { bg: "#f0f0f0", text: "#777777", label: status || "Unknown" };
};

export default function TransactionDetails() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();

  const initialTransaction = route.params?.transaction || {};
  const paymentId = route.params?.paymentId || initialTransaction.paymentId || initialTransaction.id;

  const [txData, setTxData] = useState(initialTransaction);
  const [loading, setLoading] = useState(!initialTransaction.paymentId && !!paymentId);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLivePaymentDetails = useCallback(async (isSilent = false) => {
    if (!paymentId) return;
    if (!isSilent && !txData.paymentId) setLoading(true);

    try {
      const token = await getValidToken();
      const res = await fetch(`${BASE_URL}/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (res.ok && json?.success && json?.data) {
        setTxData(json.data);
      }
    } catch {
      // Keep existing route param data on network error
    } finally {
      if (!isSilent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [paymentId, txData.paymentId]);

  useFocusEffect(
    useCallback(() => {
      fetchLivePaymentDetails(false);
      // Poll every 5s if status is pending/created
      const statusStr = (txData.status || "").toLowerCase();
      let interval;
      if (statusStr === "created" || statusStr === "pending" || statusStr === "authorized") {
        interval = setInterval(() => {
          fetchLivePaymentDetails(true);
        }, 5000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [fetchLivePaymentDetails, txData.status])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLivePaymentDetails(true);
  };

  const statusColors = getStatusColors(txData.status);

  const displayAmount = txData.amount != null
    ? `₹${txData.amount}`
    : txData.amountInPaise
      ? `₹${txData.amountInPaise / 100}`
      : "₹0";

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          <MaterialIcons name="arrow-back-ios" size={22} />
        </TouchableOpacity>

        <Text style={styles.heading}>
          Transaction Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#157a4f"]} />
        }
      >
        {loading && !txData.paymentId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#157a4f" />
            <Text style={styles.loadingText}>Fetching transaction details...</Text>
          </View>
        ) : (
          <>
            {/* Hero Amount Card */}
            <View style={styles.heroCard}>
              <Text style={[styles.cardTitle, { alignSelf: "flex-start" }]}>Transaction Summary</Text>
              <Text style={styles.heroLabel}>Total Amount</Text>
              <Text style={styles.heroAmount}>{displayAmount}</Text>

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
                  {statusColors.label}
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
                Transaction Details
              </Text>

              <DetailRow
                icon="receipt-long"
                label="Transaction ID"
                value={txData.paymentId || txData.id || "N/A"}
                colors={colors}
              />
              <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />

              <DetailRow
                icon="event"
                label="Date & Time"
                value={formatDateTime(txData.createdAt || txData.date)}
                colors={colors}
              />
              <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />

              {txData.razorpayPaymentId ? (
                <>
                  <DetailRow
                    icon="payment"
                    label="Payment Reference"
                    value={txData.razorpayPaymentId}
                    colors={colors}
                  />
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                </>
              ) : null}

              {txData.razorpayOrderId ? (
                <>
                  <DetailRow
                    icon="numbers"
                    label="Order ID"
                    value={txData.razorpayOrderId}
                    colors={colors}
                  />
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                </>
              ) : null}

              {txData.method ? (
                <>
                  <DetailRow
                    icon="credit-card"
                    label="Payment Method"
                    value={String(txData.method).toUpperCase()}
                    colors={colors}
                  />
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                </>
              ) : null}

              {txData.adId ? (
                <>
                  <DetailRow
                    icon="campaign"
                    label="Ad Reference ID"
                    value={txData.adId}
                    colors={colors}
                  />
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                </>
              ) : null}

              {txData.description ? (
                <DetailRow
                  icon="description"
                  label="Description"
                  value={txData.description}
                  colors={colors}
                />
              ) : (
                <DetailRow
                  icon="receipt"
                  label="Receipt Code"
                  value={txData.receipt || "N/A"}
                  colors={colors}
                />
              )}

              {/* Failure information */}
              {txData.failureDescription || txData.failureCode ? (
                <>
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                  <DetailRow
                    icon="error-outline"
                    label="Failure Details"
                    value={txData.failureDescription || txData.failureCode}
                    colors={colors}
                    valueColor="#d9534f"
                  />
                </>
              ) : null}

              {/* Refund information */}
              {txData.refundedAmountInPaise > 0 ? (
                <>
                  <View style={[styles.rowDivider, { backgroundColor: "#f0f0f0" }]} />
                  <DetailRow
                    icon="history"
                    label="Refunded Amount"
                    value={`₹${txData.refundedAmountInPaise / 100}`}
                    colors={colors}
                    valueColor="#6f42c1"
                  />
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value, colors, valueColor }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <View style={styles.iconBadge}>
        <MaterialIcons name={icon} size={16} color="#157a4f" />
      </View>
      <Text style={[styles.label, { color: "#777" }]}>{label}</Text>
    </View>
    <Text style={[styles.value, { color: valueColor }]}>
      {value}
    </Text>
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
    padding: 10,
  },

  heading: {
    ...textPresets.title,
  },

  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    ...textPresets.body,
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
    ...textPresets.body,
  },

  heroAmount: {
    color: "#157a4f",
    marginBottom: 14,
    ...textPresets.title,
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
    paddingVertical: 12,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
    marginLeft: 40, // aligns under the label text, past the icon badge
    ...textPresets.label,
  },
});
