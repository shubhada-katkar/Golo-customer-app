import React from "react";
import { Image, View, Text, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";


export default function Topbar() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    return (
        <TouchableOpacity style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", backgroundColor: colors.background }}
            onPress={() => navigation.navigate("GoloHome")}>
            <Image source={require('../assets/logo.png')}
                style={{ height: 48, width: 48, resizeMode: "contain" }} />

            <View style={{ flexDirection: "column", paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 18, color: "#f9a641", fontFamily: "SemiBold", lineHeight: Math.round(18 * 1.2) }}>GOLO</Text>
                <Text style={{ fontSize: 14, color: colors.activeTab, fontFamily: "Italic", lineHeight: Math.round(18 * 1.2) }}>Rajarampuri,Kolhapur</Text>
            </View>
        </TouchableOpacity>
    );
}