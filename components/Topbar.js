import React from "react";
import { Image, View, Text, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";


export default function Topbar() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    return (
        <TouchableOpacity style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" }}
            onPress={() => navigation.navigate("GoloDeals")}>
            <Image source={require('../assets/logo.png')}
                style={{ height: 48, width: 48, resizeMode: "contain" }} />

            <View style={{ flexDirection: "column", paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 20, color: "#000000", fontFamily: "SemiBold", lineHeight: Math.round(20 * 1.5) }}>GOLO</Text>
            </View>
        </TouchableOpacity>
    );
}