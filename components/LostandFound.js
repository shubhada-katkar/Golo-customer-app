import React, { useState } from "react";
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

export default function LostandFound({
    formData,
    setFormData,
    category,
    onPrevious,
    template,
    price,
    selectedDays,
    selectedLocations,
    selectedDates,
    startDate,
    endDate,
    isEditMode,
}) {
    if (category?.id !== "lostandfound") return null;
    const navigation = useNavigation();
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });

    const StatusButton = ({ label, value }) => (
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
                ]} >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.composeTitle}>Lost & Found</Text>

                {!isEditMode && (
                    <TouchableOpacity style={styles.prevBtn} onPress={onPrevious}>
                        <AntDesign name="arrow-left" size={18} color="#fff" />
                        <Text style={styles.prevText}>Previous</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.formCard}>

                {/* Status */}
                <Text style={styles.label}>Status <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <View style={styles.segmentRow}>
                    <StatusButton label="Lost" value="lost" />
                    <StatusButton label="Found" value="found" />
                </View>

                {/* Item Name */}
                <Text style={styles.label}>Item Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.itemName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, itemName: text })
                    }
                    placeholder="e.g. iPhone 15 Pro Max, Brown Leather Wallet"
                />

                {/* Item Type */}
                <Text style={styles.label}>Item Type <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.itemType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, itemType: text })
                    }
                    placeholder="e.g. Phone, Wallet, Keys, Jewellery"
                />

                {/* Date */}
                <Text style={styles.label}>Date <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.date || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, date: text })
                    }
                    placeholder="YYYY-MM-DD"
                />

                {/* Location */}
                <Text style={styles.label}>Location <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.location || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, location: text })
                    }
                    placeholder="e.g. Bandra, Mumbai"
                />

                {/* Description */}
                <Text style={styles.label}>Description <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={formData.description || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, description: text })
                    }
                    placeholder="Describe the item, markings, condition"
                    multiline
                    scrollEnabled
                    textAlignVertical="top"
                />

                {/* Reward */}
                <Text style={styles.label}>Reward (Optional)</Text>
                <TextInput
                    style={styles.input}
                    value={formData.reward || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, reward: text })
                    }
                    placeholder="₹5,000 or No Reward"
                />



            </View>

            {!isEditMode && (
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                        if (!formData.condition) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please select Status (Lost or Found).", type: "warning" });
                            return;
                        }
                        if (!formData.itemName?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Item Name.", type: "warning" });
                            return;
                        }
                        if (!formData.itemType?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Item Type.", type: "warning" });
                            return;
                        }
                        if (!formData.date?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Date.", type: "warning" });
                            return;
                        }
                        if (!formData.location?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Location.", type: "warning" });
                            return;
                        }
                        if (!formData.description?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Description.", type: "warning" });
                            return;
                        }
                        navigation.navigate("CalendarScreen", {
                            category,
                            template,
                            formData,
                            price,
                        });
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 5,
        paddingBottom: 10,
    },
    composeTitle: {
        ...textPresets.subtitle
    },
    prevBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: "#108136",
        borderRadius: 10,
    },
    prevText: {
        ...textPresets.body,
        marginLeft: 6,
        color: "#fff",
        lineHeight: Math.round(14 * 1.5)
    },
    formCard: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        borderRadius: 10,
        paddingBottom: 18,
    },
    label: {
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        marginTop: 16
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        ...textPresets.body
    },
    descriptionInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        minHeight: 100,      // Increased height
        maxHeight: 100,      // Keeps the box fixed after this height
        textAlignVertical: "top",
        ...textPresets.body,
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
        lineHeight: Math.round(14 * 1.5),
        color: "#444",
    },
    segmentTextSelected: {
        color: "#fff",
    },
    nextBtn: {
        flexDirection: "row",
        backgroundColor: "#157a4f",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 20,
        justifyContent: "center",
    },
    nextText: {
        color: "#fff",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body
    },
});