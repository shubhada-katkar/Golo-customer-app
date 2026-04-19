import React, { useState } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, Switch, Image, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function Iwant({ }) {
    const [addPrice, setAddPrice] = useState(false);
    const [heading, setHeading] = useState("");
    const [body, setBody] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState(null);
    const [keywordInput, setKeywordInput] = useState("");
    const [keywords, setKeywords] = useState([]);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required", "Allow access to gallery");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const openCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required", "Allow camera access");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleUpload = () => {
        if (!heading || !body || !location || !contact) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        if (!image) {
            Alert.alert("Error", "Please add an image");
            return;
        }

        Alert.alert("Success", "Uploaded successfully!");
        setHeading("");
        setBody("");
        setLocation("");
        setContact("");
        setPrice("");
        setImage(null);
        setAddPrice(false);
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 70 }}>

            <View style={styles.formCard}>

                <Text style={styles.label}>Heading</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Type your heading here"
                    value={heading}
                    onChangeText={setHeading}
                />

                <Text style={styles.label}>Body text</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholder="Type your description here"
                    value={body}
                    onChangeText={setBody}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Type your Location here"
                    value={location}
                    onChangeText={setLocation}
                />

                <Text style={styles.label}>Contact no.</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="Type your number here"
                    value={contact}
                    onChangeText={setContact}
                />

                <Text style={styles.label}>Keywords</Text>

                <View style={{ position: "relative" }}>
                    <View style={styles.input}>
                        <TextInput
                            placeholder="Type keywords and press enter"
                            value={keywordInput}
                            onChangeText={setKeywordInput}
                            onSubmitEditing={() => {
                                const text = keywordInput || "";

                                const arr = text
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);

                                if (arr.length === 0) return;

                                const newItems = arr.filter((k) => !keywords.includes(k));

                                if (newItems.length > 0) {
                                    setKeywords((prev) => [...prev, ...newItems]);
                                }

                                setKeywordInput("");
                            }}
                            returnKeyType="done"
                            style={{ fontSize: 14 }}
                        />
                    </View>

                    {/* Chips UI */}
                    {keywords.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                            {keywords.map((item, idx) => (
                                <View
                                    key={`${item}-${idx}`}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: "#fff",
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        marginTop: 6,
                                        borderWidth: 0.5,
                                    }}
                                >
                                    <Text style={{ fontSize: 15 }}>{item}</Text>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const newArr = keywords.filter((_, i) => i !== idx);
                                            setKeywords(newArr);
                                            setKeywordInput(newArr.join(", "));
                                        }}
                                        style={{ marginLeft: 8 }}
                                    >
                                        <Ionicons name="close" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Do you want to add budget price?</Text>
                    <Switch
                        value={addPrice}
                        onValueChange={setAddPrice}
                    />
                </View>
                {addPrice && (
                    <TextInput
                        style={styles.input}
                        placeholder="Add your product price here"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />
                )}

                <Text style={styles.label}>Add Image (1 image)</Text>
                <View style={styles.uploadBox}>
                    <TouchableOpacity style={{ alignItems: "center" }} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={28} color="#555" />
                        <Text style={styles.uploadText}>Upload image from gallery</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>OR</Text>

                    <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
                        <Text style={styles.cameraText}>Open Camera</Text>
                    </TouchableOpacity>
                </View>

                {image && (
                    <Image
                        source={{ uri: image }}
                        style={{
                            width: "100%",
                            height: 200,
                            marginTop: 10,
                            borderRadius: 10
                        }}
                    />
                )}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleUpload}>
                <Text style={styles.nextText}>Upload</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
    formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
    label: { fontSize: 16, marginTop: 10, fontFamily: "Medium" },
    value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    input: {
        borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6,
        fontFamily: "Medium", fontSize: 14
    },
    textArea: { height: 80, textAlignVertical: "top" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
    uploadBox: {
        borderWidth: 1, borderStyle: "dashed", borderColor: "#aaa",
        borderRadius: 10, padding: 16, alignItems: "center", marginTop: 8,
    },
    uploadText: { marginTop: 6, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    orText: { marginVertical: 6, color: "#999", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
    cameraText: { color: "#fff", fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) },
    nextBtn: {
        backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center",
        marginVertical: 20
    },
    nextText: {
        color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5)
    },
});