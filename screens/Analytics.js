import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View, StyleSheet, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-chart-kit";
import { getMyAnalytics } from "../services/analyticsService";

const screenWidth = Dimensions.get("window").width;
const CHART_COLORS = ["#1f7a53", "#f2a93b", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Analytics({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getMyAnalytics();
      setAnalytics(data || null);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const stats = useMemo(() => {
    const statsData = analytics?.stats || {};
    return [
      { title: "Total Ads", value: statsData.totalAds || 0 },
      { title: "Active Ads", value: statsData.activeAds || 0 },
      { title: "Ad Card Clicks", value: statsData.adCardClicks || 0 },
      { title: "Unique Visitors", value: statsData.uniqueVisitors || 0 },
      { title: "Contact Clicks", value: statsData.contactClicks || 0 },
      { title: "Wishlist Saves", value: statsData.wishlistSaves || 0 },
    ];
  }, [analytics]);

  const topAdsViews = useMemo(() => {
    const topAds = analytics?.topAdsByViews || [];

    return {
      labels: topAds.length ? topAds.map((item) => item.label?.slice(0, 14) || "Ad") : ["No Data"],
      datasets: [
        {
          data: topAds.length ? topAds.map((item) => Number(item.views || 0)) : [0],
        },
      ],
    };
  }, [analytics]);

  const categoryData = useMemo(() => {
    const categories = analytics?.categoryDistribution || [];
    const fallback = [
      {
        name: "No Data",
        population: 1,
        color: "#d1d5db",
        legendFontColor: "#333",
        legendFontSize: 12,
        legendFontFamily: "Medium",
      },
    ];

    if (!categories.length) return fallback;

    return categories.slice(0, 7).map((item, index) => ({
      name: item.name,
      population: Number(item.population || 0),
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: "#333",
      legendFontSize: 12,
      legendFontFamily: "Medium",
    }));
  }, [analytics]);

  const adsList = analytics?.adsList || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Topbar />

      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={{ justifyContent: 'center' }}>
            <MaterialIcons
              name="arrow-back-ios"
              size={26}
              color={colors.text}
              style={{ padding: 10}}
            />
          </View>

        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.2) }}>Analytics</Text>
      </View>

      <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />


      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>

        <Text style={styles.subtitle}>Track performance of your posted ads</Text>
        {loading && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <ActivityIndicator size="small" color="#1f7a53" />
            <Text style={{ marginLeft: 8, color: "#666", fontFamily: "Medium" }}>Refreshing live data...</Text>
          </View>
        )}
        {!!error && <Text style={{ color: "#d14343", marginBottom: 10 }}>{error}</Text>}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.value}>{item.value}</Text>
              <Text style={styles.label}>{item.title}</Text>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        <Text style={styles.sectionTitle}>Top Ads by Views</Text>

        <BarChart
          data={topAdsViews}
          width={screenWidth - 30}
          height={220}
          fromZero
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            color: () => "#1f7a53",
            labelColor: () => "#555",
          }}
          style={styles.chart}
        />

        {/* Pie Chart */}
        <Text style={styles.sectionTitle}>Ads by Category</Text>

        <PieChart
          data={categoryData}
          width={screenWidth - 30}
          height={220}
          chartConfig={{
            color: () => "#000",
          }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"10"}
          absolute
        />


        {/* Ads Table */}
        <Text style={styles.sectionTitle}>Your Ads</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Ad</Text>
          <Text style={styles.headerText}>Date</Text>
          <Text style={styles.headerText}>Status</Text>
        </View>

        {!adsList.length && (
          <View style={{ paddingVertical: 14 }}>
            <Text style={{ color: "#666", fontFamily: "Medium" }}>No ads posted yet.</Text>
          </View>
        )}

        {adsList.map((ad) => (
          <TouchableOpacity
            key={String(ad.adId || ad.id)}
            style={styles.tableRow}
            onPress={() =>
              navigation.navigate("AdAnalytics", {
                adId: ad.adId,
                adName: ad.name,
                postedDate: ad.date,
              })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.adName}>{ad.name}</Text>
              <Text style={styles.category}>{ad.category}</Text>
            </View>

            <Text style={styles.cell}>{formatDate(ad.date)}</Text>

            <Text
              style={[
                styles.cell,
                {
                  color: String(ad.status || "").toLowerCase() === "active" ? "green" : "red",
                  fontFamily: "Medium",
                  lineHeight: Math.round(13 * 1.5),
                },
              ]}
            >
              {ad.status ? `${String(ad.status).charAt(0).toUpperCase()}${String(ad.status).slice(1)}` : "-"}
            </Text>
          </TouchableOpacity>
        ))}

      </ScrollView>


      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }} >
        <ChojaBottom />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 10,
    marginTop: 14,
    borderRadius: 12,
    borderRadius: 10,
    borderWidth: 0.5
  },

  imagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: "#D9D9D9",
  },


  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },

  title: {
    fontSize: 26,
    fontFamily:"Medium",
    lineHeight: Math.round(26 * 1.5),
  },

  subtitle: {
    color: "#666",
    fontSize: 14,
    marginBottom: 15,
    fontFamily:"Medium",
    lineHeight: Math.round(14 * 1.5),
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  value: {
    fontSize: 22,
    fontFamily: "Medium",
    lineHeight: Math.round(22 * 1.5),
  },

  label: {
    color: "#666",
    marginTop: 5,
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },

  sectionTitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Medium",
    lineHeight: Math.round(18 * 1.5),
  },

  chart: {
    borderRadius: 10,
  },


  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  headerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  cell: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Medium",
    lineHeight: Math.round(13 * 1.5),
  },

  adName: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },

  category: {
    fontSize: 12,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
    color: "#777",
  },


})