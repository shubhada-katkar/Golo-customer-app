import React, { useRef, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, ScrollView, FlatList, Alert, Share, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAdId, isFavoriteAdId, toggleFavoriteAd } from "../services/favoritesService";
import { trackAdCardClick, trackContactClick } from "../services/analyticsService";
import { BASE_URL } from "../config";

const { width, height } = Dimensions.get("window");

const GENERIC_SELLER_NAMES = new Set(["seller", "user", "anonymous", "unknown"]);

const getAdSellerName = (ad) =>
  ad?.sellerName ||
  ad?.user?.name ||
  ad?.contactInfo?.name ||
  ad?.contactInfo?.sellerName ||
  ad?.name ||
  null;

const isGenericSellerName = (name) => {
  if (!name) return true;
  const text = String(name).trim().toLowerCase();
  return GENERIC_SELLER_NAMES.has(text);
};

export default function Template1Card({ ad, navigation }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [sellerName, setSellerName] = useState(() => getAdSellerName(ad) || "Seller");

  useEffect(() => {
    const initialName = getAdSellerName(ad);
    if (initialName && !isGenericSellerName(initialName)) {
      setSellerName(initialName);
      return;
    }

    const sellerId = ad?.userId || ad?.user?.id;
    if (!sellerId) {
      setSellerName(initialName || "Seller");
      return;
    }

    const fetchSellerName = async () => {
      try {
        const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(sellerId)}`);
        const json = await response.json();
        if (json?.success && json?.data?.name) {
          setSellerName(json.data.name);
        } else {
          setSellerName(initialName || "Seller");
        }
      } catch (error) {
        console.warn("Template1Card: failed to fetch seller name", error);
        setSellerName(initialName || "Seller");
      }
    };

    fetchSellerName();
  }, [ad]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      const adId = getAdId(ad);
      if (!adId) return;
      const value = await isFavoriteAdId(adId);
      setIsFavorite(value);
    };

    loadFavoriteState();
  }, [ad]);

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const result = await toggleFavoriteAd(ad);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.log("favorite toggle failed", error.message);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleOpenChat = () => {
    const adIdentifier = ad?.adId || ad?._id;
    if (adIdentifier) {
      trackContactClick(adIdentifier).catch((error) => {
        console.warn('[Template1Card] Failed to track contact click:', error.message);
      });
    }

    navigation.navigate("ChatScreen", {
      adId: adIdentifier,
      sellerId: ad?.userId || ad?.user?.id,
      sellerName,
      adRef: {
        adId: adIdentifier,
        title: ad?.title || "Ad",
        image: ad?.images?.[0] || null,
      },
    });
  };

  const handleShareToChat = () => {
    navigation.navigate("ChatPage", {
      shareAd: {
        adId: ad?.adId || ad?._id,
        _id: ad?._id,
        title: ad?.title,
        description: ad?.description,
        price: ad?.price,
        image: ad?.images?.[0] || null,
      },
    });
  };

  const handleShareExternally = async () => {
    try {
      const adIdentifier = ad?.adId || ad?._id;
      if (!adIdentifier) return;

      const shareUrl = `${BASE_URL}/ads/share/${encodeURIComponent(adIdentifier)}`;
      const deepLink = `golo://ad/${encodeURIComponent(adIdentifier)}`;

      await Share.share({
        title: ad?.title || "Shared Ad",
        message: `Check this ad on GOLO: ${ad?.title || "Ad"}\n${shareUrl}\nApp link: ${deepLink}`,
        url: shareUrl,
      });
    } catch (error) {
      Alert.alert("Share Error", error?.message || "Unable to share this ad right now");
    }
  };

  const handleShare = () => {
    handleShareExternally();
  };

  const handleCall = (phone) => {
    if (!phone) return;

    const adIdentifier = ad?.adId || ad?._id;
    if (adIdentifier) {
      trackContactClick(adIdentifier).catch((error) => {
        console.warn('[Template1Card] Failed to track contact click:', error.message);
      });
    }

    const cleanedNumber = phone.replace("+91", "");

    Linking.openURL(`tel:${cleanedNumber}`);
  };

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollLeft = () => {
    if (currentIndex <= 0) return;

    flatListRef.current.scrollToIndex({
      index: currentIndex - 1,
      animated: true,
    });

    setCurrentIndex(currentIndex - 1);
  };

  const scrollRight = () => {
    if (currentIndex >= ad.images.length - 1) return;

    flatListRef.current.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });

    setCurrentIndex(currentIndex + 1);
  };

  useEffect(() => {
    if (!ad.images || ad.images.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      if (nextIndex >= ad.images.length) {
        nextIndex = 0;
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        const currentAdId = ad?.adId || ad?._id;
        navigation.navigate("AdDetails", { adId: currentAdId });
      }}
      style={styles.card}
    >

      <Text style={styles.timeText}>
        {new Date(ad.createdAt || Date.now()).toLocaleString()}
      </Text>

      {ad.images?.length > 0 ? (
        ad.images.length === 1 ? (
          <Image source={{ uri: ad.images[0] }} style={styles.image} />
        ) : (
          <>
            {/* LEFT ARROW */}
            <TouchableOpacity style={styles.leftArrow} onPress={scrollLeft}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.imageContainer}>

              <FlatList
                ref={flatListRef}
                data={ad.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / (width - 64)
                  );
                  setCurrentIndex(index);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.image} />
                )}
              />
            </View>

            {/* RIGHT ARROW */}
            <TouchableOpacity style={styles.rightArrow} onPress={scrollRight}>
              <Ionicons name="chevron-forward" size={28} color="#fff" />
            </TouchableOpacity>
          </>
        )
      ) : (
        <View style={styles.image} />
      )}


     <View style={styles.topRow}>
        <TouchableOpacity onPress={handleFavoriteToggle} disabled={favoriteLoading}>
          {favoriteLoading ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#e74c3c" : "#222"} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}
        ellipsizeMode="tail">{ad.title}</Text>
        <Text style={styles.price}>{ad.price ? `₹${ad.price}` : ""}</Text>
      </View>

      <Text numberOfLines={2} style={styles.desc}>
        {ad.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} />
          <Text style={styles.metaText}>{ad.location || ad.city}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person" size={14} />
          <Text style={styles.metaText}>{sellerName}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat}>
          <Text style={styles.btnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleCall(ad.contactInfo?.phone)}
        >
          <Text style={styles.btnText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop:7
  },
  timeText: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
  },
  imageContainer: {
    marginTop: 10,
    width: width - 64,
    alignSelf: "center",
    position: "relative",
  },

  leftArrow: {
    position: "absolute",
    left: 4,
    top: "40%",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    padding: 5,
  },

  rightArrow: {
    position: "absolute",
    right: 4,
    top: "40%",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    padding: 5,
  },

  image: {
    height: height * 0.23,
    width: width - 64,
    backgroundColor: "#ddd",
    borderRadius: 10,
  },
  row: {
    flex:1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },
  title: {
    width:"65%",
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
  price: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    flexShrink: 0,
  },
  desc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontFamily: "Medium",
    lineHeight: Math.round(13 * 1.5)
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#444",
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: "#f5b849",
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },
  callBtn: {
    flex: 1,
    backgroundColor: "#157a4f",
    padding: 8,
    borderRadius: 8,
    marginLeft: 6,
    alignItems: "center",
  },
  btnText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5)
  },
});