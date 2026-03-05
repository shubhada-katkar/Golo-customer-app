import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Template1Card({ ad, navigation }) {
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
      onPress={() => navigation.navigate("AdDetails", { adId: ad._id })}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Ionicons name="heart-outline" size={18} />
        <Ionicons name="share-social-outline" size={18} />
      </View>

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

      <View style={styles.row}>
        <Text style={styles.title}>{ad.title}</Text>
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
          <Text style={styles.metaText}>{ad.contactInfo?.name}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <View style={styles.chatBtn}>
          <Text style={styles.btnText}>Chat</Text>
        </View>
        <View style={styles.callBtn}>
          <Text style={styles.btnText}>Call</Text>
        </View>
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
  },
  timeText: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5)
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5)
  },
  price: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5)
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