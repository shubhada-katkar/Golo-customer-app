import React, { useContext, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Fav({navigation}) {
    const { colors } = useContext(ThemeContext);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("ChojaHome")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.2) }}>Saved Ads</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {[1, 2, 3, 4, 5, 6].map((item, index) => (
                    <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
                        {/* Grey placeholder square */}
                        <View style={styles.imagePlaceholder} />

                        {/* Text Content */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text }}>
                                Moon cafe
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.text }}>
                                Rajarampuri, 5 km away from your place.
                            </Text>
                        </View>

                        {/* Outline Heart */}
                        <TouchableOpacity style={{borderRadius:10,borderWidth:1.5,padding:10}}>
                        <Text style={{fontFamily:"Medium", lineHeight:Math.round(14*1.5)}}>
                            Use It
                        </Text>
                        </TouchableOpacity>
                    </View>
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
        borderRadius:10,
        borderWidth:0.5
    },

    imagePlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: "#D9D9D9",
    },

})