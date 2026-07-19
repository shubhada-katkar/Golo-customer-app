import React from "react";
import { Image, View, Text, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";


export default function Topbar() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    return (
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" }}>
            <Image source={require('../assets/logo.png')}
                style={{ height: 48, width: 48, resizeMode: "contain" }} />

            <View style={{ flexDirection: "column", paddingHorizontal: 12 }}>
                <Text style={{ ...textPresets.subtitle, color: "#000000" }}>GOLO</Text>
            </View>
        </View>
    );
}