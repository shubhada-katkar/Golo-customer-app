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

export default function Electronics({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
    if (category?.id !== "electronics_home") return null;
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
                <Text style={styles.composeTitle}>Electronics and Home Appliances</Text>

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
                            fontSize: 14,
                            marginLeft: 6,
                            color: "#ffffff",
                            lineHeight: Math.round(14 * 1.5),
                        }}
                    >
                        Previous
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formCard}>

                <Text style={styles.label}>Electronics Type</Text>
                <TextInput
                    style={styles.input}
                    value={formData.electronicsType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, electronicsType: text })
                    }
                    placeholder="e.g.TV, Washing Machine.."
                />

                <Text style={styles.label}>Brand</Text>
                <TextInput
                    style={styles.input}
                    value={formData.brand || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, brand: text })
                    }
                    placeholder="e.g. Samsung, LG.."
                />

                <Text style={styles.label}>Model Name / Number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.modelNumber || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, modelNumber: text })
                    }
                    placeholder="Enter model name or number"
                />

                <Text style={styles.label}>Warranty Remaining</Text>
                <TextInput
                    style={styles.input}
                    value={formData.warrantyRemaining || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, warrantyRemaining: text })
                    }
                    placeholder="Enter warranty remaining in months"
                />

                <Text style={styles.label}>Capacity / Size</Text>
                <TextInput
                    style={styles.input}
                    value={formData.capacity || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, capacity: text })
                    }
                    placeholder="e.g. 8.0 kg, 55 inch.."
                />

                <Text style={styles.label}>Condition</Text>
                <View style={styles.segmentRow}>
                    <ConditionButton label="New" value="new" />
                    <ConditionButton label="Like new" value="like new" />
                    <ConditionButton label="Fair" value="fair" />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, justifyContent: "space-between" }}>
                    <Text style={[styles.label, { marginTop: 0 }]}>
                        Price negotiable
                    </Text>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() =>
                            setFormData({ ...formData, negotiable: !formData.negotiable })
                        }
                    >
                        {formData.negotiable && <View style={styles.checkboxTick} />}
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Price</Text>
                <TextInput
                    style={styles.input}
                    value={formData.price || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, price: text })
                    }
                    placeholder="Enter price in INR"
                />

            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }); }}>
                <Text style={styles.nextText}>See Preview</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({

    composeTitle: { fontSize: 15.2, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
    formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
    label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontSize: 14, fontFamily: "Medium" },
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

