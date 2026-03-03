import React, { useContext } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Service({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations }) {
    if (category?.id !== "service") return null;
    const navigation = useNavigation();

    return (
        <View>
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 5,
                    paddingBottom: 10,
                }}
            >
                <Text style={styles.composeTitle}>Service</Text>

                <TouchableOpacity
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: "#108136",
                        borderRadius: 10,
                    }}
                    onPress={onPrevious}
                >
                    <AntDesign name="arrow-left" size={18} color="#ffffff" />
                    <Text
                        style={{
                            fontFamily: "Medium",
                            fontSize: 16,
                            marginLeft: 6,
                            color: "#ffffff",
                            lineHeight: Math.round(16 * 1.5),
                        }}
                    >
                        Previous
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formCard}>

                <Text style={styles.label}>Service Category</Text>
                <TextInput
                    style={styles.input}
                    value={formData.serviceCategory || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceCategory: text })
                    }
                    placeholder="Enter type of service"
                />

                <Text style={styles.label}>Experience</Text>
                <TextInput
                    style={styles.input}
                    value={formData.experience || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, experience: text })
                    }
                    placeholder="e.g. 5 years"
                />

                <Text style={styles.label}>Service Area</Text>
                <TextInput
                    style={styles.input}
                    value={formData.serviceArea || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceArea: text })
                    }
                    placeholder="e.g. Mumbai, Pune"
                />

                <Text style={styles.label}>Available Time</Text>
                <TextInput
                    style={styles.input}
                    value={formData.availableTime || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, availableTime: text })
                    }
                    placeholder="e.g. 9:00 AM - 5:00 PM"
                />

                <Text style={styles.label}>Charges</Text>
                <TextInput
                    style={styles.input}
                    value={formData.charges || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, charges: text })
                    }
                    placeholder="Enter your service charges"
                />

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, justifyContent: "space-between" }}>
                    <Text style={[styles.label, { marginTop: 0 }]}>
                        Emergency Service
                    </Text>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() =>
                            setFormData({ ...formData, emergencyService: !formData.emergencyService })
                        }
                    >
                        {formData.emergencyService && <View style={styles.checkboxTick} />}
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Service Bio / Skills</Text>
                <TextInput
                    style={styles.input}
                    value={formData.serviceBio || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceBio: text })
                    }
                    placeholder="Enter your service bio / skills"
                />

            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations }); }}>
                <Text style={styles.nextText}>See Preview</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({

    composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
    formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
    label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6 },
    textArea: { height: 80, textAlignVertical: "top" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },

    uploadBox: {
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#aaa",
        borderRadius: 10,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    uploadText: { marginTop: 6, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    orText: { marginVertical: 6, color: "#999", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    cameraBtn: { backgroundColor: "#157a4f", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
    cameraText: { color: "#fff", fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) },

    nextBtn: {
        flexDirection: "row",
        backgroundColor: "#157a4f",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 20,
        justifyContent: "center"
    },
    nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },

    checkbox: {
        width: 26,
        height: 26,
        borderWidth: 1,
        borderColor: "#444",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxTick: {
        width: 16,
        height: 16,
        borderRadius: 4,
        backgroundColor: "#f5b849",
    },
});