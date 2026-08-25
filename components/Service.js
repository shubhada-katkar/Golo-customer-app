import React, { useContext, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Service({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
    if (category?.id !== "service") return null;
    const navigation = useNavigation();
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

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

                <Text style={styles.label}>Service Category <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <View style={styles.pickerWrap}>
                    <Picker
                        selectedValue={formData.serviceCategory || ""}
                        onValueChange={(value) =>
                            setFormData({ ...formData, serviceCategory: value })
                        }
                        mode="dropdown"
                    >
                        <Picker.Item label="Select Service Category" value="" />
                        <Picker.Item label="Plumbing" value="plumbing" />
                        <Picker.Item label="Electrical" value="electrical" />
                        <Picker.Item label="Carpentry" value="carpentry" />
                        <Picker.Item label="Cleaning" value="cleaning" />
                        <Picker.Item label="Beauty" value="beauty" />
                        <Picker.Item label="IT Support" value="it support" />
                        <Picker.Item label="Tutoring" value="tutoring" />
                    </Picker>
                </View>

                <Text style={styles.label}>Years of Experience <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.experience || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, experience: text })
                    }
                    placeholder="e.g. * years"
                />

                <Text style={styles.label}>Service Area <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.serviceArea || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceArea: text })
                    }
                    placeholder="Mumbai Central, Bandra, Andheri"
                />

                <Text style={styles.label}>Available Time <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.availableTime || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, availableTime: text })
                    }
                    placeholder="9 AM - 6 PM, Monday to Saturday"
                />

                <Text style={styles.label}>Service Charges <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.charges || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, charges: text })
                    }
                    placeholder="e.g. ₹500 per hour"
                />

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, justifyContent: "space-between" }}>
                    <Text style={[styles.label, { marginTop: 0 }]}>
                        Available 24/7
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

                <Text style={styles.label}>Service Bio & Skills <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={formData.serviceBio || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceBio: text })
                    }
                    placeholder="Describe your expertise, certifications, special skills..."
                    scrollEnabled
                    multiline
                    textAlignVertical="top"
                />

            </View>

            {!isEditMode && (
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                        if (!formData.serviceCategory) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Service Category.", type: "warning" });
                            return;
                        }
                        if (!formData.experience?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Years of Experience.", type: "warning" });
                            return;
                        }
                        if (!formData.serviceArea?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Service Area.", type: "warning" });
                            return;
                        }
                        if (!formData.availableTime?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Available Time.", type: "warning" });
                            return;
                        }
                        if (!formData.charges?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Service Charges.", type: "warning" });
                            return;
                        }
                        if (!formData.serviceBio?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Service Bio & Skills.", type: "warning" });
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

    composeTitle: { ...textPresets.subtitle },
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

    descriptionInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        minHeight: 100,      // Increased height
        maxHeight: 100,      // Keeps the box fixed after this height
        ...textPresets.body,
        textAlignVertical: "top",
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
    pickerWrap: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 6,
    },
});

