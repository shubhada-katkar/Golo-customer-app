import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function ChojaBottom() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const { colors } = useContext(ThemeContext);

    return (
        <View style={[styles.top, { backgroundColor: colors.bottombar }]}>

            <TouchableOpacity style={[styles.bar]} onPress={() => navigation.navigate("ChojaHome")}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={24}
                    color={currentRoute === "ChojaHome" ? "#157a4f" : "black"} />
                <Text style={{ textAlign: "auto", fontSize: 10, color: currentRoute === "ChojaHome" ? "#157a4f" : "black", fontFamily:"Medium" }}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("Fav")}>
                <FontAwesome name="heart-o" size={24}
                    color={currentRoute === "Fav" ? "#157a4f" : "black"} />
                <Text style={{ textAlign: "auto", fontSize: 10, color: currentRoute === "Fav" ? "#157a4f" : "black", fontFamily:"Medium"  }}>Saved</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("JahiratiCategory")}>
                <MaterialCommunityIcons name="plus" size={24}
                    color={currentRoute === "JahiratiCategory" ? "#157a4f" : "black"} />
                <Text style={{ textAlign: "auto", fontSize: 10, color: currentRoute === "JahiratiCategory" ? "#157a4f" : "black", fontFamily:"Medium"  }}>Post Ad</Text>
            </TouchableOpacity>            

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("ChatPage")}>
                <Ionicons name="chatbubble-ellipses-outline" size={24}
                    color={currentRoute === "ChatPage" ? "#157a4f" : "black"} />
                <Text style={{ textAlign: "auto", fontSize: 10, color: currentRoute === "ChatPage" ? "#157a4f" : "black", fontFamily:"Medium"  }}>Chats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("ProfilePage")}>
                <MaterialCommunityIcons name="account-circle-outline" size={24}
                    color={currentRoute === "ProfilePage" ? "#157a4f" : "black"} />
                <Text style={{ textAlign: "auto", fontSize: 10, color: currentRoute === "ProfilePage" ? "#157a4f" : "black", fontFamily:"Medium"  }}>Profile</Text>
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