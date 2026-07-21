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
import { textPresets } from "../theme/typography";

const screenWidth = Dimensions.get("window").width;
const CHART_COLORS = [
  "#1ca168", // green
  "#f5b849", // gold
  "#3b58dd", // blue
  "#c0392b", // red
  "#949494", // gray
  "#7c4dbd", // purple
  "#16c2c2", // cyan
  "#a5ca1d", // lime
  "#f4ff58", // pale yellow
  "#f078dc", // pink
  "#1d699b", // dark blue
  "#0c4725", // dark green
  "#dba257", // tan/brown
  "#e8752c", // orange (new)
  "#a13d7c"  // plum/wine (new)
];

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
        .slice(0, 3)
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

    return categories.slice(0, 18).map((item, index) => ({
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
        <Text style={{ ...textPresets.title }}>Analytics</Text>
      </View>

      <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical: 6 }} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Track performance of your posted ads</Text>
        {loading && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <ActivityIndicator size="small" color="#1f7a53" />
            <Text style={{ marginLeft: 8, color: "#666", ...textPresets.body }}>Refreshing live data...</Text>
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
        <Text style={styles.sectionTitle}>Top Ads By Views</Text>
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
          <View style={styles.pieChartWrapper}>
            <PieChart
              data={categoryData}
              width={screenWidth - 30}
              height={200}
              chartConfig={{ color: () => "#000" }}
              accessor={"population"}
              backgroundColor={"transparent"}
              hasLegend={false}
              center={[(screenWidth - 30) / 4, 0]}
            />
          </View>
          <View style={styles.legendWrap}>
            {categoryData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.population} {item.name}
                </Text>
              </View>
            ))}
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
            <Text style={{ ...textPresets.body }}>No ads posted yet.</Text>
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
                <Text style={styles.adName} numberOfLines={1} ellipsizeMode="tail" >{ad.name}</Text>
              </View>

              <Text style={[styles.cell, { color: colors.text }]}>{formatDate(ad.date)}</Text>

              <Text
                style={[
                  styles.cell,
                  {
                    color: statusColor,


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

                {String(ad.status || "").toLowerCase() !== "expired" && String(ad.status || "").toLowerCase() !== "deleted" && (
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
                )}
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
    ...textPresets.body,
    marginBottom: 15,
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
    ...textPresets.subtitle,
    textAlign: "center",
  },
  label: {
    color: "#666",
    ...textPresets.label,
    textAlign: "center",
  },
  sectionTitle: {
    ...textPresets.body,
    marginTop: 20,
    marginBottom: 10,
    lineHeight: Math.round(14 * 1.5)
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
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "33.33%",
    marginBottom: 10,
    paddingRight: 6,
  },
  legendText: {
    ...textPresets.label,
    flexShrink: 1,
    width: "82%",
    paddingVertical: 2.5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 5,
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
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    paddingHorizontal: 16
  },
  actionCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",  // was "center"
    width: 64,                      // was minWidth: 40 — fixed width, not just a min
  },
  actionIconBtn: {
    paddingHorizontal: 4,
    marginRight: 10
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
    ...textPresets.label,
  },
  adName: {
    ...textPresets.label,
    width: "82%"
  },
  category: {
    ...textPresets.label,
    color: "#777",
  },
})