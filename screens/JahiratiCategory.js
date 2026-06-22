import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MaterialIcons, FontAwesome, MaterialCommunityIcons, AntDesign,
    SimpleLineIcons, Entypo, FontAwesome6,
    Ionicons, Feather
} from "@expo/vector-icons";
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");
import ChojaBottom from "../components/ChojaBottom";

export default function JahiratiCategory({ navigation }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const getCategoryStyle = (label) => [
        styles.component,
        selectedCategory?.label === label && styles.selectedComponent
    ];
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1, paddingTop: 18 }} >

                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26} style={{ paddingHorizontal: 10 }} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontFamily: "Medium", lineHeight: Math.round(22 * 1.5) }}>
                        Smart Jahirati
                    </Text>
                </View>

                <Text style={{ fontSize: width * 0.04, marginLeft: 48, fontFamily: "Medium", lineHeight: Math.round(width * 0.04 * 1.5) }}>
                    Post Your Ads Instantly Online
                </Text>

                <Text style={{ marginTop: 10, marginLeft: 10, fontSize: width * 0.04, fontFamily: "Italic", lineHeight: Math.round(width * 0.04 * 1.5) }}>
                    Select Ad Categories</Text>

                {/*Row : 1*/}
                <View style={styles.rows}>
                    <TouchableOpacity
                        style={getCategoryStyle("Education")}
                        onPress={() => setSelectedCategory({ id: "education", label: "Education" })}
                    >
                        <SimpleLineIcons name="graduation" size={20} />
                        <Text style={styles.text}>Education</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Travel")}
                        onPress={() => setSelectedCategory({ id: "travel", label: "Travel" })}>
                        <MaterialCommunityIcons name="airplane" size={20} />
                        <Text style={styles.text}>
                            Travel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Vehicle")}
                        onPress={() => setSelectedCategory({ id: "vehicles", label: "Vehicle" })}>
                        <AntDesign name="car" size={20} />
                        <Text style={styles.text}>
                            Vehicles
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 2*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={getCategoryStyle("Property")}
                        onPress={() => setSelectedCategory({ id: "property", label: "Property" })}>
                        <MaterialCommunityIcons name="land-plots" size={20} />
                        <Text style={styles.text}>
                            Property
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Matrimonial")}
                        onPress={() => setSelectedCategory({ id: "matrimonial", label: "Matrimonial" })}>
                        <MaterialCommunityIcons name="ring" size={20} />
                        <Text style={styles.text}>
                            Matrimonial
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Employment")}
                        onPress={() => setSelectedCategory({ id: "employment", label: "Employment" })}>
                        <MaterialIcons name="home-repair-service" size={20} />
                        <Text style={styles.text}>
                            Employment
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 3*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={getCategoryStyle("Pets")}
                        onPress={() => setSelectedCategory({ id: "pets", label: "Pets" })}>
                        <FontAwesome6 name="cat" size={20} />
                        <Text style={styles.text}>
                            Pets
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Electronics & Home appliances")}
                        onPress={() => setSelectedCategory({ id: "electronics_home", label: "Electronics & Home appliances" })}>
                        <MaterialCommunityIcons name="microwave" size={21} />
                        <Text style={styles.text}>
                            Electronics & Home
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Service")}
                        onPress={() => setSelectedCategory({ id: "service", label: "Service" })}>
                        <FontAwesome name="handshake-o" size={20} />
                        <Text style={styles.text}>
                            Service
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 4*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={getCategoryStyle("Furniture")}
                        onPress={() => setSelectedCategory({ id: "furniture", label: "Furniture" })}>
                        <MaterialCommunityIcons name="sofa-outline" size={20} />
                        <Text style={styles.text}>
                            Furniture
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Lost & Found")}
                        onPress={() => setSelectedCategory({ id: "lostandfound", label: "Lost & Found" })}>
                        <FontAwesome6 name="people-carry-box" size={20} />
                        <Text style={styles.text}>
                            Lost & Found
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Astrology")}
                        onPress={() => setSelectedCategory({ id: "astrology", label: "Astrology" })}>
                        <FontAwesome name="sun-o" size={20} />
                        <Text style={styles.text}>
                            Astrology
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 5*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={getCategoryStyle("Business")}
                        onPress={() => setSelectedCategory({ id: "business", label: "Business" })}>
                        <Ionicons name="business-outline" size={20} />
                        <Text style={styles.text}>
                            Business
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Mobiles")}
                        onPress={() => setSelectedCategory({ id: "mobiles", label: "Mobiles" })}>
                        <Entypo name="mobile" size={20} />
                        <Text style={styles.text}>
                            Mobiles
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Personal")}
                        onPress={() => setSelectedCategory({ id: "personal", label: "Personal" })}>
                        <MaterialIcons name="person" size={20} />
                        <Text style={styles.text}>
                            Personal
                        </Text>
                        <Text style={styles.text}>
                            Achievements
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 6*/}
                <View style={styles.rows}>

                    <TouchableOpacity style={getCategoryStyle("Public Notice")}
                        onPress={() => setSelectedCategory({ id: "publicnotice", label: "Public Notice" })}>
                        <AntDesign name="info-circle" size={20} />
                        <Text style={styles.text}>
                            Public Notice
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Greetings")}
                        onPress={() => setSelectedCategory({ id: "greetings", label: "Greetings" })}>
                        <Feather name="gift" size={20} />
                        <Text style={styles.text}>
                            Greetings
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={getCategoryStyle("Others")}
                        onPress={() => setSelectedCategory({ id: "others", label: "Others" })}>
                        <Entypo name="dots-three-horizontal" size={20} />
                        <Text style={styles.text}>
                            Others
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        if (!selectedCategory) {
                            alert("Please select a category first");
                            return;
                        }
                        navigation.navigate("CalendarScreen", { category: selectedCategory });
                    }}
                >
                    <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.2) }}>
                        Next
                    </Text>
                </TouchableOpacity>

            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center"
    },
    rows: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: height * 0.02,
        alignItems: "center",
        paddingHorizontal: width * 0.02
    },
    component: {
        backgroundColor: "#ffffff",
        alignItems: "center",
        height: height * 0.085,
        width: width * 0.30,
        borderRadius: 10,
        justifyContent: "center"
    },
    text: {
        fontSize: 11,
        fontFamily: "Medium",
        lineHeight: Math.round(11 * 1.5),
    },
    selectedComponent: {
        borderWidth: 1.5,
        borderColor: "#157a4f",
        backgroundColor: "#dadada"
    },
    button: {
        paddingVertical: height * 0.018,
        paddingHorizontal: width * 0.12,
        backgroundColor: "#157a4f",
        alignSelf: "center",
        borderRadius: 10,
        marginTop: height * 0.04
    }
})