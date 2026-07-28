import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, ConditionButton, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";

export default function Pets({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
    if (category?.id !== "pets") return null;
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
                <Text style={styles.composeTitle}>Pets Details</Text>

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

                <Text style={styles.label}>Animal Species</Text>
                <TextInput
                    style={styles.input}
                    value={formData.species || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, species: text })
                    }
                    placeholder="e.g. Dog, Cat"
                />

                <Text style={styles.label}>Pet Breed</Text>
                <TextInput
                    style={styles.input}
                    value={formData.breed || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, breed: text })
                    }
                    placeholder="Breed (if known)"
                />

                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    value={formData.age || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, age: text })
                    }
                    placeholder="Pet Age"
                />

                <Text style={styles.label}>Gender</Text>
                <View style={styles.segmentRow}>
                    <ConditionButton label="Male" value="male" />
                    <ConditionButton label="Female" value="female" />
                </View>

                <Text style={styles.label}>Weight</Text>
                <TextInput
                    style={styles.input}
                    value={formData.weight || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, weight: text })
                    }
                    placeholder="Weight (Kg)"
                />

                <Text style={styles.label}>Temperament (multiple)</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 67 }}>
                        <Text style={[styles.label, { marginTop: 0 }]}>Friendly</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, friendly: !formData.friendly })
                            }
                        >
                            {formData.friendly && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 40 }}>
                        <Text style={[styles.label, { marginTop: 0 }]}>Quiet</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, quiet: !formData.quiet })
                            }
                        >
                            {formData.quiet && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 78 }}>
                        <Text style={[styles.label, { marginTop: 0 }]}>Active</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, active: !formData.active })
                            }
                        >
                            {formData.active && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 40 }}>
                        <Text style={[styles.label, { marginTop: 0 }]}>Protective</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, protective: !formData.protective })
                            }
                        >
                            {formData.protective && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 35 }}>
                    <Text style={[styles.label, { marginTop: 0 }]}>Kid-Friendly</Text>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() =>
                            setFormData({ ...formData, kidfriendly: !formData.kidfriendly })
                        }
                    >
                        {formData.kidfriendly && <View style={styles.checkboxTick} />}
                    </TouchableOpacity>
                </View>




                <Text style={styles.label}>Special Diet / Needs</Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={formData.specialDiet || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, specialDiet: text })
                    }
                    placeholder="e.g. Allergies, Special Care Needs"
                    multiline
                    scrollEnabled
                    textAlignVertical="top"
                />
            </View>

            {!isEditMode && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("CalendarScreen", { category, template, formData, price }); }}>
                    <Text style={styles.nextText}>Next</Text>
                </TouchableOpacity>
            )}
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

    descriptionInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        minHeight: 100,      // Increased height
        maxHeight: 100,      // Keeps the box fixed after this height
        textAlignVertical: "top",
        ...textPresets.body
    },
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
        width: 24,
        height: 24,
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

