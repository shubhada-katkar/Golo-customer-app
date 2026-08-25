import React, { useContext, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Electronics({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
    if (category?.id !== "electronics_home") return null;
    const navigation = useNavigation();
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

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
                <Text style={styles.composeTitle} numberOfLines={2} >Electronics and Home Appliances</Text>

                {!isEditMode && (
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
                                ...textPresets.body,
                                marginLeft: 6,
                                color: "#ffffff",
                                lineHeight: Math.round(14 * 1.5),
                            }}
                        >
                            Previous
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.formCard}>

                <Text style={styles.label}>Appliance Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.electronicsType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, electronicsType: text })
                    }
                    placeholder="e.g. Washing Machine"
                />

                <Text style={styles.label}>Brand <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.brand || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, brand: text })
                    }
                    placeholder="Brand"
                />

                <Text style={styles.label}>Model Name / Number <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.modelNumber || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, modelNumber: text })
                    }
                    placeholder="Model"
                />

                <Text style={styles.label}>Warranty Remaining <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.warrantyRemaining || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, warrantyRemaining: text })
                    }
                    placeholder="e.g. 1 year"
                />

                <Text style={styles.label}>Capacity <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.capacity || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, capacity: text })
                    }
                    placeholder="e.g. 7 kg, 5000 L"
                />

                <Text style={styles.label}>Condition <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <View style={styles.segmentRow}>
                    <ConditionButton label="New" value="new" />
                    <ConditionButton label="Like new" value="like new" />
                    <ConditionButton label="Fair" value="fair" />
                </View>

                <Text style={styles.label}>Price <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.price || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, price: text })
                    }
                    placeholder="₹"
                />

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

            </View>

            {!isEditMode && (
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                        if (!formData.electronicsType?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Appliance Name.", type: "warning" });
                            return;
                        }
                        if (!formData.brand?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Brand.", type: "warning" });
                            return;
                        }
                        if (!formData.modelNumber?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Model Name / Number.", type: "warning" });
                            return;
                        }
                        if (!formData.warrantyRemaining?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Warranty Remaining.", type: "warning" });
                            return;
                        }
                        if (!formData.capacity?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Capacity.", type: "warning" });
                            return;
                        }
                        if (!formData.condition) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Condition.", type: "warning" });
                            return;
                        }
                        if (!formData.price?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Price.", type: "warning" });
                            return;
                        }
                        navigation.navigate("CalendarScreen", { category, template, formData, price });
                    }}
                >
                    <Text style={styles.nextText}>Next</Text>
                </TouchableOpacity>
            )}

            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type || "warning"}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({

    composeTitle: { ...textPresets.body, width: "60%" },
    formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18 },
    label: { ...textPresets.body, marginTop: 16, lineHeight: Math.round(14 * 1.5) },
    value: { ...textPresets.body, color: "#555", lineHeight: Math.round(14 * 1.5) },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, ...textPresets.body },
    textArea: { height: 80, textAlignVertical: "top" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
    nextBtn: {
        flexDirection: "row",
        backgroundColor: "#157a4f",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 20,
        justifyContent: "center"
    },
    nextText: { color: "#fff", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },

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
        ...textPresets.body,
        color: "#444",
        lineHeight: Math.round(14 * 1.5),
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

