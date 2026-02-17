import React, { useContext, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import ChojaBottom from "../components/ChojaBottom";
import { EvilIcons } from "@expo/vector-icons";

export default function ChojaHome() {
    const { colors } = useContext(ThemeContext);
    const inputRef = useRef(null);
    const [tab, setTab] = useState("Chotya Jahirati");

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity
                    style={styles.search}
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()} >
                    <TextInput
                        ref={inputRef} placeholder="Search community..."
                        style={{ flex: 1, fontFamily: "Medium", fontSize: 14 }}
                        textAlignVertical="center" />

                    <EvilIcons name="search" size={26} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 8, marginTop: 18 }}>
                <View style={styles.row2}>

                    <TouchableOpacity
                        onPress={() => setTab("Chotya Jahirati")}
                        style={[
                            styles.tabButton,
                            tab === "Chotya Jahirati" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "Chotya Jahirati" && styles.activeText]} >
                            Chotya Jahirati </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("I Want")}
                        style={[
                            styles.tabButton,
                            tab === "I Want" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "I Want" && styles.activeText]} >
                            I Want </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("My Ads")}
                        style={[
                            styles.tabButton,
                            tab === "My Ads" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "My Ads" && styles.activeText]} >
                            My Ads </Text>
                    </TouchableOpacity>

                </View>
            </View>


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
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 10
    },
    search: {
        flex: 1,             
        paddingHorizontal: 12,
        backgroundColor: "#d1d1d1",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    row2: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#157a4f",
        borderRadius: 8,
        padding: 6
    },

    tabButton: {
        flex: 1,
        alignItems: "center",
        borderRadius: 6
    },

    activeTab: {
        backgroundColor: "#FFD700",
    },

    text: {
        color: "#ffffff",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 2.4)
    },

    activeText: {
        color: "#000000",
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 2.4),
    }
})