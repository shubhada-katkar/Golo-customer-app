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

export default function LostandFound({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations }) {
    if (category?.id !== "lostandfound") return null;
    const navigation = useNavigation();

    const ConditionButton = ({ label, value }) => (
        <TouchableOpacity
            style={[
                styles.segmentBtn,
                formData.condition === value && styles.segmentBtnSelected,
            ]}
            onPress={() => setFormData({ ...formData, condition: value })}
        >
            <Text
                style={[
                    styles.segmentText,
                    formData.condition === value && styles.segmentTextSelected,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

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
                <Text style={styles.composeTitle}>Lost and Found</Text>

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

                <Text style={styles.label}>Status</Text>
                <View style={styles.segmentRow}>
                    <ConditionButton label="Lost" value="lost" />
                    <ConditionButton label="Found" value="found" />
                </View>


                <Text style={styles.label}>Item Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.lostandfound || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, lostandfound: text })
                    }
                    placeholder="Enter name of item"
                />

                <Text style={styles.label}>Item Type</Text>
                <TextInput
                    style={styles.input}
                    value={formData.itemtype || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, itemtype: text })
                    }
                    placeholder="Enter type of item"
                />

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={formData.date || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, date: text })
                    }
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={formData.location || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, location: text })
                    }
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    value={formData.description || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, description: text })
                    }
                    placeholder="Enter description of item"
                />

                <Text style={styles.label}>Reward (Optional)</Text>
                <TextInput
                    style={styles.input}
                    value={formData.reward || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, reward: text })
                    }
                    placeholder="Enter reward amount (optional)"
                />

                <Text style={styles.label}>Contact Details</Text>
                <TextInput
                    style={styles.input}
                    value={formData.contactdetails || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, contactdetails: text })
                    }
                    placeholder="Enter contact details"
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

    pickerWrap: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        overflow: "hidden",
    },

    segmentRow: {
        flexDirection: "row",
        marginTop: 6,
    },
    segmentBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingVertical: 8,
        alignItems: "center",
    },
    segmentBtnSelected: {
        backgroundColor: "#f5b849",
        borderColor: "#bd8e38",
    },
    segmentText: {
        fontSize: 15,
        fontFamily: "Medium",
        color: "#444",
        lineHeight: Math.round(15 * 1.5),
    },
    segmentTextSelected: {
        color: "#fff",
    },

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