import React, { useEffect, useRef, useContext } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { ThemeContext } from "../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const SkeletonBox = ({ width = "100%", height = 20, borderRadius = 8, style }) => {
  const { isDarkMode } = useContext(ThemeContext) || {};
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const baseColor = isDarkMode ? "#4A5568" : "#E2E8F0";

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const OfferDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Banner / Media Carousel Skeleton */}
      <SkeletonBox width={SCREEN_WIDTH - 20} height={230} borderRadius={16} style={styles.mb16} />

      {/* Title & Badge */}
      <View style={styles.rowBetween}>
        <SkeletonBox width="60%" height={24} borderRadius={6} />
        <SkeletonBox width="28%" height={24} borderRadius={12} />
      </View>

      {/* Merchant Box */}
      <View style={[styles.card, styles.mt16]}>
        <View style={styles.rowCenter}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={styles.ml12Flex}>
            <SkeletonBox width="70%" height={18} borderRadius={4} style={styles.mb8} />
            <SkeletonBox width="45%" height={14} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Price & Details Box */}
      <View style={[styles.card, styles.mt12]}>
        <SkeletonBox width="40%" height={20} borderRadius={4} style={styles.mb12} />
        <SkeletonBox width="100%" height={14} borderRadius={4} style={styles.mb8} />
        <SkeletonBox width="90%" height={14} borderRadius={4} style={styles.mb8} />
        <SkeletonBox width="75%" height={14} borderRadius={4} />
      </View>

      {/* Claim Button */}
      <View style={styles.mt24}>
        <SkeletonBox width="100%" height={50} borderRadius={25} />
      </View>
    </View>
  );
};

export const ProductDetailSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Media Gallery Skeleton */}
      <SkeletonBox width={SCREEN_WIDTH - 32} height={250} borderRadius={16} style={styles.mb16} />

      {/* Product Title & Price */}
      <SkeletonBox width="80%" height={26} borderRadius={6} style={styles.mb8} />
      <SkeletonBox width="35%" height={22} borderRadius={6} style={styles.mb16} />

      {/* Merchant Info Card */}
      <View style={[styles.card, styles.mb16]}>
        <View style={styles.rowCenter}>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={styles.ml12Flex}>
            <SkeletonBox width="60%" height={16} borderRadius={4} style={styles.mb6} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.card}>
        <SkeletonBox width="50%" height={18} borderRadius={4} style={styles.mb12} />
        <SkeletonBox width="100%" height={14} borderRadius={4} style={styles.mb8} />
        <SkeletonBox width="95%" height={14} borderRadius={4} style={styles.mb8} />
        <SkeletonBox width="80%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

export const StorePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Store Cover Banner */}
      <SkeletonBox width="100%" height={160} borderRadius={12} style={styles.mb16} />

      {/* Store Header Info */}
      <View style={styles.rowCenter}>
        <SkeletonBox width={64} height={64} borderRadius={32} />
        <View style={styles.ml12Flex}>
          <SkeletonBox width="70%" height={22} borderRadius={6} style={styles.mb8} />
          <SkeletonBox width="50%" height={14} borderRadius={4} />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.rowBetween, styles.mt20, styles.mb16]}>
        <SkeletonBox width="30%" height={36} borderRadius={18} />
        <SkeletonBox width="30%" height={36} borderRadius={18} />
        <SkeletonBox width="30%" height={36} borderRadius={18} />
      </View>

      {/* Cards Grid */}
      <View style={styles.gridRow}>
        <SkeletonBox width={(SCREEN_WIDTH - 44) / 2} height={180} borderRadius={12} />
        <SkeletonBox width={(SCREEN_WIDTH - 44) / 2} height={180} borderRadius={12} />
      </View>
    </View>
  );
};

export const AdDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonBox width={SCREEN_WIDTH - 20} height={240} borderRadius={16} style={styles.mb16} />
      <SkeletonBox width="75%" height={24} borderRadius={6} style={styles.mb8} />
      <SkeletonBox width="30%" height={20} borderRadius={6} style={styles.mb16} />

      <View style={[styles.card, styles.mb16]}>
        <View style={styles.rowCenter}>
          <SkeletonBox width={44} height={44} borderRadius={22} />
          <View style={styles.ml12Flex}>
            <SkeletonBox width="50%" height={16} borderRadius={4} style={styles.mb6} />
            <SkeletonBox width="35%" height={12} borderRadius={4} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <SkeletonBox width="40%" height={18} borderRadius={4} style={styles.mb12} />
        <SkeletonBox width="100%" height={14} borderRadius={4} style={styles.mb8} />
        <SkeletonBox width="88%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

export const SellerProfileSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.rowCenter, styles.mb20]}>
        <SkeletonBox width={70} height={70} borderRadius={35} />
        <View style={styles.ml12Flex}>
          <SkeletonBox width="60%" height={22} borderRadius={6} style={styles.mb8} />
          <SkeletonBox width="40%" height={14} borderRadius={4} />
        </View>
      </View>
      <View style={styles.gridRow}>
        <SkeletonBox width={(SCREEN_WIDTH - 44) / 2} height={160} borderRadius={12} />
        <SkeletonBox width={(SCREEN_WIDTH - 44) / 2} height={160} borderRadius={12} />
      </View>
    </View>
  );
};

export const ProfileSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.rowCenter, styles.mb24]}>
        <SkeletonBox width={64} height={64} borderRadius={32} />
        <View style={styles.ml12Flex}>
          <SkeletonBox width="55%" height={20} borderRadius={6} style={styles.mb8} />
          <SkeletonBox width="75%" height={14} borderRadius={4} />
        </View>
      </View>
      <View style={styles.card}>
        <SkeletonBox width="100%" height={44} borderRadius={8} style={styles.mb12} />
        <SkeletonBox width="100%" height={44} borderRadius={8} style={styles.mb12} />
        <SkeletonBox width="100%" height={44} borderRadius={8} />
      </View>
    </View>
  );
};

export const ChatSkeleton = ({ count = 5 }) => {
  const items = Array.from({ length: count });
  return (
    <View style={{ width: "100%" }}>
      {items.map((_, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
          }}
        >
          <SkeletonBox width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <SkeletonBox width="50%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBox width="80%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={40} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
      ))}
    </View>
  );
};

export const FavSkeleton = ({ count = 4 }) => {
  const items = Array.from({ length: count });
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
      {items.map((_, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            marginBottom: 14,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}
        >
          <SkeletonBox width={68} height={68} borderRadius={8} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonBox width="70%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBox width="45%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBox width="60%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={26} height={26} borderRadius={13} style={{ marginLeft: 8 }} />
        </View>
      ))}
    </View>
  );
};

export const ClaimedSkeleton = ({ count = 3 }) => {
  const items = Array.from({ length: count });
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
        <SkeletonBox width="30%" height={54} borderRadius={12} />
        <SkeletonBox width="30%" height={54} borderRadius={12} />
        <SkeletonBox width="30%" height={54} borderRadius={12} />
      </View>
      {items.map((_, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            marginBottom: 14,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}
        >
          <SkeletonBox width={60} height={60} borderRadius={8} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <SkeletonBox width="55%" height={16} borderRadius={4} />
              <SkeletonBox width="25%" height={18} borderRadius={4} />
            </View>
            <SkeletonBox width="45%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const CardSkeleton = ({ count = 4, layout = "grid" }) => {
  const cards = Array.from({ length: count });

  if (layout === "grid") {
    return (
      <View style={styles.gridRowWrap}>
        {cards.map((_, idx) => (
          <View key={idx} style={styles.gridCard}>
            <SkeletonBox width="100%" height={120} borderRadius={10} style={styles.mb8} />
            <SkeletonBox width="80%" height={14} borderRadius={4} style={styles.mb6} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cards.map((_, idx) => (
        <View key={idx} style={[styles.card, styles.mb12]}>
          <View style={styles.rowCenter}>
            <SkeletonBox width={60} height={60} borderRadius={8} />
            <View style={styles.ml12Flex}>
              <SkeletonBox width="70%" height={16} borderRadius={4} style={styles.mb8} />
              <SkeletonBox width="45%" height={12} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: "100%",
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    marginBottom: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  ml12Flex: {
    marginLeft: 12,
    flex: 1,
  },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt24: { marginTop: 24 },
});
