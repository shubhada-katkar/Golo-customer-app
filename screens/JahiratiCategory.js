import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MaterialIcons, FontAwesome, MaterialCommunityIcons, AntDesign,
    SimpleLineIcons, Entypo
} from "@expo/vector-icons";

export default function JahiratiCategory({ navigation }) {

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }} style={{ flex: 1, padding: 16 }} >

                <View style={styles.row1}>
                    <TouchableOpacity>
                        <MaterialIcons onPress={()=>navigation.goBack()}
                            name="arrow-back-ios"
                            size={26} style={{ paddingHorizontal: 10 }} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontFamily:"Medium", lineHeight:Math.round(22*1.4) }}>
                        Smart Jahirati
                    </Text>
                </View>

                <Text style={{ fontSize: 16, marginLeft: 48, fontFamily:"Medium", lineHeight:Math.round(16*1.5) }}>
                    Post Your Ads Instantly Online
                </Text>

                <Text style={{ marginTop: 10, marginLeft: 10, fontSize: 16, fontFamily:"Italic" }}>
                    Select Ad Categories</Text>

                {/*Row : 1*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <SimpleLineIcons name="graduation" size={20} />
                        <Text style={styles.text}>
                            Education
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <MaterialCommunityIcons name="airplane" size={20} />
                        <Text style={styles.text}>
                            Travel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <AntDesign name="car" size={20} />
                        <Text style={styles.text}>
                            Vehicles
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 2*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <MaterialCommunityIcons name="land-plots" size={20} />
                        <Text style={styles.text}>
                            Property
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <MaterialCommunityIcons name="ring" size={20} />
                        <Text style={styles.text}>
                            Matrimonial
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <MaterialIcons name="home-repair-service" size={20} />
                        <Text style={styles.text}>
                            Employement
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 3*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <Entypo name="area-graph" size={20} />
                        <Text style={styles.text}>
                            Sales
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <MaterialCommunityIcons name="power-plug-battery-outline" size={20} />
                        <Text style={styles.text}>
                            Tech
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <FontAwesome name="building-o" size={20} />
                        <Text style={styles.text}>
                            Retail
                        </Text>
                    </TouchableOpacity>

                </View>

                {/*Row : 4*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <FontAwesome name="handshake-o" size={20} />
                        <Text style={styles.text}>
                            Service
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <Entypo name="modern-mic" size={20} />
                        <Text style={styles.text}>
                            Announcement
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <FontAwesome name="graduation-cap" size={20} />
                        <Text style={styles.text}>
                            Lost and Found
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 5*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <FontAwesome name="sun-o" size={20} />
                        <Text style={styles.text}>
                            Astrology
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <AntDesign name="shop" size={20} />
                        <Text style={styles.text}>
                            Commercial
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <MaterialCommunityIcons name="home-silo-outline" size={20} />
                        <Text style={styles.text}>
                            To Rent
                        </Text>
                    </TouchableOpacity>
                </View>

                {/*Row : 6*/}
                <View style={styles.rows}>
                    <TouchableOpacity style={styles.component}>
                        <MaterialIcons name="person" size={20} />
                        <Text style={styles.text}>
                            Personal
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <FontAwesome name="wpforms" size={20} />
                        <Text style={styles.text}>
                            Obituary
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.component}>
                        <AntDesign name="info-circle" size={20} />
                        <Text style={styles.text}>
                            Public Notice
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: "center", marginTop: 20 }}>
                    <TouchableOpacity style={styles.component}>
                        <Entypo name="dots-three-horizontal" size={20} />
                        <Text style={styles.text}>
                            Others
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CalendarScreen")}>
                    <Text style={{ color: "#ffffff", fontSize: 18, fontFamily:"Medium",lineHeight:Math.round(18*1.2) }}>Next</Text>
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
        marginTop: 18,
        alignItems: "center"
    },
    component: {
        backgroundColor: "#ffffff",
        padding: 10,
        alignItems: "center",
        height: 60,
        width: 110,
        borderRadius: 10
    },
    text: {
        fontSize: 12,
        fontFamily:"Medium"
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 38,
        backgroundColor: "#157a4f",
        alignSelf: "center",
        borderRadius: 10,
        marginTop: 14
    }
})