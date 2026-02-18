import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MaterialIcons, Ionicons
} from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import Card1 from "../components/Card1";
import Card2 from "../components/Card2";
import Card3 from "../components/Card3";

export default function FormPage({ route, navigation }) {
    const { template } = route.params || {};

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1 }} >

                <View style={{ padding: 16 }}>
                    <View style={styles.row1}>
                        <TouchableOpacity>
                            <MaterialIcons onPress={() => navigation.goBack()}
                                name="arrow-back-ios"
                                size={26} style={{ paddingHorizontal: 10 }} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, fontFamily: "Medium", lineHeight: Math.round(22 * 1.4) }}>
                            Smart Jahirati
                        </Text>
                    </View>

                    <Text style={{ fontSize: 16, marginLeft: 48, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                        Post Your Ads Instantly Online
                    </Text>
                </View>

                <ScrollView>
                    <View style={{ flex: 1, padding: 20 }}>
                        {template === "card1" && <Card1 navigation={navigation} />}
                        {template === "card2" && <Card2 navigation={navigation} />}
                        {template === "card3" && <Card3 navigation={navigation} />}
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center"
    },
})