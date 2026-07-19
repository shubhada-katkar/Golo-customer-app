import React from "react";
import { Image, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { textPresets } from "../theme/typography";

export default function Topbar2() {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    const route = useRoute();
    const currentRoute = route.name;
    return (
        <View style={styles.row}>
            <TouchableOpacity style={styles.button}
                onPress={() => navigation.navigate("GoloDeals")}>
                <Feather name="shopping-bag" size={16}
                    color={currentRoute === "GoloHome" || currentRoute === "GoloDeals" ? "#157a4f" : "black"} />
                <Text style={{
                    ...textPresets.subtitle,
                    color: currentRoute === "GoloHome" || currentRoute === "GoloDeals" ? "#157a4f" : "black"
                }}>GOLO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}
                onPress={() => navigation.navigate("ChojaHome")}>
                <MaterialCommunityIcons name="ticket-outline" size={16} color={currentRoute === "ChojaHome" ? "#157a4f" : "black"} />
                <Text style={{
                    ...textPresets.subtitle,
                    color: currentRoute === "ChojaHome" ? "#157a4f" : "black"
                }}>CHOJA</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: "row",
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: "#ffffff",
        width: "45%",
        paddingVertical: 10,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        justifyContent: "space-between",
        marginVertical: 18
    }
})