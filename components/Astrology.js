import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Astrology({ formData, setFormData, category, onPrevious, template, selectedDays, selectedLocations, selectedDates, startDate, endDate, price, isEditMode }) {
    if (category?.id !== "astrology") return null;
    const navigation = useNavigation();

    const ConditionButton = ({ label, value, icon, selected, onPress }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.segmentBtn,
                    selected && styles.segmentBtnSelected
                ]}
                onPress={() => onPress(value)}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
                    <Text style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected
                    ]}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const Radio = ({ label, selected, onPress }) => (
        <TouchableOpacity style={styles.radioRow} onPress={onPress}>
            <View style={styles.radioOuter}>
                {selected ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
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
                <Text style={styles.composeTitle}>Astrology</Text>

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

                <Text style={styles.label}>Service Type</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 53 }}>
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Horoscope</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, horoscope: !formData.horoscope })
                            }
                        >
                            {formData.horoscope && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 40 }}>
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Kundli</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, kundli: !formData.kundli })
                            }
                        >
                            {formData.kundli && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 80 }}>
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Vaastu</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, vaastu: !formData.vaastu })
                            }
                        >
                            {formData.vaastu && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 40 }}>
                        <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Palm Reading</Text>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() =>
                                setFormData({ ...formData, palm: !formData.palm })
                            }
                        >
                            {formData.palm && <View style={styles.checkboxTick} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 85 }}>
                    <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Other</Text>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() =>
                            setFormData({ ...formData, other: !formData.other })
                        }
                    >
                        {formData.other && <View style={styles.checkboxTick} />}
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Experience</Text>
                <TextInput
                    style={styles.input}
                    value={formData.experience || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, experience: text })
                    }
                    placeholder="e.g. 15 years"
                />

                <Text style={styles.label}>Langauge Spoken</Text>
                <TextInput
                    style={styles.input}
                    value={formData.language || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, language: text })
                    }
                    placeholder="e.g. English, Hindi"
                />



                <Text style={styles.label}>Consultation Mode</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                    <Radio
                        label="Online"
                        selected={formData.demoAvailable === "online"}
                        onPress={() => setFormData({ ...formData, demoAvailable: "online" })}
                    />
                    <Radio
                        label="Offline"
                        selected={formData.demoAvailable === "offline"}
                        onPress={() => setFormData({ ...formData, demoAvailable: "offline" })}
                    />
                    <Radio
                        label="Both"
                        selected={formData.demoAvailable === "both"}
                        onPress={() => setFormData({ ...formData, demoAvailable: "both" })}
                    />
                </View>

                <Text style={styles.label}>Consultation Fee</Text>
                <TextInput
                    style={styles.input}
                    value={formData.fee || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, fee: text })
                    }
                    placeholder="e.g. ₹100"
                />

                <Text style={styles.label}>Availability Time</Text>
                <TextInput
                    style={styles.input}
                    value={formData.availabilityTime || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, availabilityTime: text })
                    }
                    placeholder="e.g. 10 AM - 6 PM"
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

    radioRow: { flexDirection: "row", alignItems: "center", marginRight: 16 },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: "#444",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#157a4f",
    },
    radioLabel: { fontSize: 15, fontFamily: "Medium", lineHeight: Math.round(15 * 1.5) },
});

