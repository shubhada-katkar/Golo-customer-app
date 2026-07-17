import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, ConditionButton, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Friendly</Text>
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
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Quiet</Text>
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
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Active</Text>
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
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Protective</Text>
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

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 40 }}>
                    <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Kid-Friendly</Text>
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
                    <Text style={styles.nextText}>See Preview</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({

    composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
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
    descriptionInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        minHeight: 100,      // Increased height
        maxHeight: 100,      // Keeps the box fixed after this height
        fontSize: 14,
        textAlignVertical: "top",
        fontFamily: "Medium"
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
    nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },

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

