import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View, StyleSheet, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-chart-kit";
import { getMyAnalytics } from "../services/analyticsService";
import { LinearGradient } from "expo-linear-gradient";

const screenWidth = Dimensions.get("window").width;
const CHART_COLORS = ["#157a4f", "#e8b923", "#e8743b", "#c0392b", "#2c6fbb", "#7c4dbd", "#16a0a0"];

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

function normalizeAdMetric(ad) {
  return Number(ad?.views ?? ad?.uniqueVisitors ?? ad?.viewHistory?.length ?? 0);
}

function getStatusLabel(status) {
  const effectiveStatus = String(status || "").toLowerCase();
  if (effectiveStatus === "deleted") return "Expired";
  if (!effectiveStatus) return "-";
  return `${effectiveStatus.charAt(0).toUpperCase()}${effectiveStatus.slice(1)}`;
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

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics]),
  );

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const normalizedAds = useMemo(() => {
    if (Array.isArray(analytics?.ads)) {
      return analytics.ads.map((item) => ({
        ...item,
        views: normalizeAdMetric(item),
        uniqueVisitors: Number(item?.uniqueVisitors ?? item?.views ?? item?.viewHistory?.length ?? 0),
        contactClicks: Number(item?.contactClicks ?? 0),
        wishlistCount: Number(item?.wishlistCount ?? 0),
      }));
    }

    const legacyAds = Array.isArray(analytics?.adsList) ? analytics.adsList : [];
    return legacyAds.map((item) => ({
      adId: item.adId || item.id,
      title: item.name,
      category: item.category,
      status: item.status,
      createdAt: item.date,
      views: Number(item?.views ?? 0),
      uniqueVisitors: Number(item?.uniqueVisitors ?? 0),
      contactClicks: Number(item?.contactClicks ?? 0),
      wishlistCount: Number(item?.wishlistCount ?? 0),
    }));
  }, [analytics]);

  const stats = useMemo(() => {
    const summary = analytics?.summary || null;
    const statsData = analytics?.stats || {};

    const derivedFromAds = normalizedAds.reduce(
      (acc, ad) => {
        acc.totalAds += 1;
        if (String(ad.status || "").toLowerCase() === "active") acc.activeAds += 1;
        acc.adCardClicks += Number(ad.views || 0);
        acc.uniqueVisitors += Number(ad.uniqueVisitors || 0);
        acc.contactClicks += Number(ad.contactClicks || 0);
        acc.wishlistSaves += Number(ad.wishlistCount || 0);
        return acc;
      },
      {
        totalAds: 0,
        activeAds: 0,
        adCardClicks: 0,
        uniqueVisitors: 0,
        contactClicks: 0,
        wishlistSaves: 0,
      },
    );

    const resolvedStats = summary
      ? {
          totalAds: Number(summary.totalAds || 0),
          activeAds: Number(summary.activeAds || 0),
          adCardClicks: Number(summary.totalViews || 0),
          uniqueVisitors: Number(summary.uniqueVisitors || 0),
          contactClicks: Number(summary.totalContactClicks || 0),
          wishlistSaves: Number(summary.totalWishlistSaves || 0),
        }
      : (Object.keys(statsData).length ? statsData : derivedFromAds);

    return [
      { title: "Total Ads", value: resolvedStats.totalAds || 0 },
      { title: "Active Ads", value: resolvedStats.activeAds || 0 },
      { title: "Ad Card Clicks", value: resolvedStats.adCardClicks || 0 },
      { title: "Unique Visitors", value: resolvedStats.uniqueVisitors || 0 },
      { title: "Contact Clicks", value: resolvedStats.contactClicks || 0 },
      { title: "Wishlist Saves", value: resolvedStats.wishlistSaves || 0 },
    ];
  }, [analytics, normalizedAds]);

  const topAdsViews = useMemo(() => {
    const topAds = (Array.isArray(analytics?.topAdsByViews) && analytics.topAdsByViews.length > 0)
      ? analytics.topAdsByViews
      : [...normalizedAds]
          .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
          .slice(0, 5)
          .map((item) => ({
            adId: item.adId,
            label: item.title || item.category || "Ad",
            views: Number(item.views || 0),
          }));

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
    const categories = (Array.isArray(analytics?.categoryDistribution) && analytics.categoryDistribution.length > 0)
      ? analytics.categoryDistribution
      : Object.entries(
          normalizedAds.reduce((acc, ad) => {
            const category = ad?.category || "Others";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {}),
        ).map(([name, population]) => ({ name, population }));
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
  }, [analytics, normalizedAds]);

  const adsList = normalizedAds.map((item) => ({
    adId: item.adId ?? item.id ?? item._id,
    id: item.id ?? item._id,
    name: item.title || item.name || "Ad",
    date: item.createdAt || item.date,
    status: item.status,
    category: item.category,
  }));

 return (
  <SafeAreaView style={{ flex: 1 }}>
    <LinearGradient
      colors={["#f8a812", "#fad081", "#f8f6f265"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
    />
    <Topbar />

    <View style={styles.row1}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <View style={{ justifyContent: 'center' }}>
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            color={colors.text}
            style={{ padding: 10 }}
          />
        </View>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.2) }}>Analytics</Text>
    </View>

    <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical:6 }} />

    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>

      <Text style={[styles.subtitle, { color: colors.text }]}>
        Track performance of your posted ads</Text>
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Ads By Views</Text>
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

      {/* Statistics Card */}
      <View style={[styles.statsCard, { borderColor: colors.divider }]}>
        <Text style={[styles.statsCardTitle, { color: colors.text }]}>Statistics</Text>
        <View style={styles.pieRow}>
         <PieChart
  data={categoryData}
  width={(screenWidth - 30) * 0.5}
  height={160}
  chartConfig={{ color: () => "#000" }}
  accessor={"population"}
  backgroundColor={"transparent"}
  hasLegend={false}
  center={[(screenWidth - 30) * 0.125, 0]}
/>
          <View style={styles.legendContainer}>
            {categoryData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  {item.population} {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Ads Table */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Ads</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { color: colors.text }]}>Ad</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>Date</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>Status</Text>
        <Text style={[styles.headerText, { color: colors.text }]}>Action</Text>
      </View>

      {!adsList.length && (
        <View style={{ paddingVertical: 14 }}>
          <Text style={{ color: colors.text, fontFamily: "Medium" }}>No ads posted yet.</Text>
        </View>
      )}

      {adsList.map((ad) => {
        const resolvedAdId = ad.adId || ad.id;
        const statusLabel = getStatusLabel(ad.status);
        const statusColor = String(ad.status || "").toLowerCase() === "active" ? "green" : "red";
        return (
          <View
            key={String(resolvedAdId)}
            style={styles.tableRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.adName, { color: colors.text }]}>{ad.name}</Text>
            </View>

            <Text style={[styles.cell, { color: colors.text }]}>{formatDate(ad.date)}</Text>

            <Text
              style={[
                styles.cell,
                {
                  color: statusColor,
                  fontFamily: "Medium",
                  lineHeight: Math.round(13 * 1.5),
                },
              ]}
            >
              {statusLabel}
            </Text>

            <View style={styles.actionCell}>
               <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() =>
                  navigation.navigate("AdAnalytics", {
                    adId: resolvedAdId,
                  })
                }
              >
                <Entypo name="eye" size={20} color="#157a4f" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() =>
                  navigation.navigate("AdEdit", {
                    adId: resolvedAdId,
                  })
                }
              >
                <MaterialIcons name="edit" size={20} color="#d89633" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

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
  container: {
    flex: 1,
    padding: 15,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "30%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dadada",
    alignItems: "center",
  },
  value: {
    fontSize: 20,
    fontFamily: "Medium",
    lineHeight: Math.round(20 * 1.5),
    textAlign: "center",
  },
  label: {
    color: "#666",
    fontSize: 12,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
  chart: {
    borderRadius: 10,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
  },
  statsCardTitle: {
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight:Math.round(16*1.5)
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendContainer: {
    flex: 1,
    marginLeft: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontFamily: "Medium",
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
    paddingHorizontal:16
  },
  actionCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  actionIconBtn: {
    paddingHorizontal: 4,
    marginRight:10
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    flex: 1,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Medium",
    lineHeight: Math.round(13 * 1.5),
  },
  adName: {
    fontSize: 13,
    fontFamily: "Medium",
    lineHeight: Math.round(13 * 1.5),
  },
  category: {
    fontSize: 12,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
    color: "#777",
  },
})