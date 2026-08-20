import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { ensureAuthenticated } from "../services/authService";
import { textPresets } from "../theme/typography";

export default function GoloBottom() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;

    const handleProtectedNavigate = async (screenName) => {
        try {
            await ensureAuthenticated(navigation);
            navigation.navigate(screenName);
        } catch {
            // Login screen is handled by ensureAuthenticated.
        }
    };

    return (
        <View style={styles.top}>

            <TouchableOpacity style={[styles.bar]} onPress={() => navigation.navigate("GoloDeals")}>
                <MaterialCommunityIcons name="home-outline" size={26}
                    color={currentRoute === "GoloDeals" ? "#f5b849" : "black"} />
                <Text style={{ textAlign: "auto", ...textPresets.caption, color: currentRoute === "GoloDeals" ? "#f5b849" : "black" }}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("GoloFav")}>
                <FontAwesome name="heart-o" size={24}
                    color={currentRoute === "GoloFav" ? "#f5b849" : "black"} />
                <Text style={{ textAlign: "auto", ...textPresets.caption, color: currentRoute === "GoloFav" ? "#f5b849" : "black" }}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("Claimed")}>
                <MaterialCommunityIcons name="sticker-check-outline" size={24}
                    color={currentRoute === "Claimed" ? "#f5b849" : "black"} />
                <Text style={{ textAlign: "auto", ...textPresets.caption, color: currentRoute === "Claimed" ? "#f5b849" : "black" }}>Claimed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => handleProtectedNavigate("ProfilePage")}>
                <MaterialCommunityIcons name="account-circle-outline" size={24}
                    color={currentRoute === "ProfilePage" ? "#f5b849" : "black"} />
                <Text style={{ textAlign: "auto", ...textPresets.caption, color: currentRoute === "ProfilePage" ? "#f5b849" : "black" }}>Profile</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    top: {
        flexDirection: "row",
        minHeight: 60,
        borderColor: "grey",
        backgroundColor: "white",
        borderTopWidth: 1,
        paddingVertical: 8,
        alignItems: "center",
    },
    bar: {
        flex: 1,
        alignItems: "center",
        flexDirection: "column",
    },
})