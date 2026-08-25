import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "./CustomeAlertModal";

export default function Business({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate, isEditMode }) {
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "warning" });
    const [socialMediaLinks, setSocialMediaLinks] = useState(
        formData.socialMediaLinks && Array.isArray(formData.socialMediaLinks)
            ? formData.socialMediaLinks
            : [""]
    );

    if (category?.id !== "business") return null;

    const handleAddLink = () => {
        const updatedLinks = [...socialMediaLinks, ""];
        setSocialMediaLinks(updatedLinks);
    };

    const handleRemoveLink = (index) => {
        const updatedLinks = socialMediaLinks.filter((_, i) => i !== index);
        setSocialMediaLinks(updatedLinks);
        setFormData({ ...formData, socialMediaLinks: updatedLinks });
    };

    const handleLinkChange = (index, text) => {
        const updatedLinks = [...socialMediaLinks];
        updatedLinks[index] = text;
        setSocialMediaLinks(updatedLinks);
        setFormData({ ...formData, socialMediaLinks: updatedLinks });
    };

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
                <Text style={styles.composeTitle}>Business Details</Text>

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

                <Text style={styles.label}>Business Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.businessName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, businessName: text })
                    }
                    placeholder="Your Business Name"
                />

                <Text style={styles.label}>Business Type <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.businessType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, businessType: text })
                    }
                    placeholder="e.g. Retail, Service, Manufacturing"
                />

                <Text style={styles.label}>Services Offered <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={[styles.descriptionInput, { minHeight: 100, maxHeight: 100 }]}
                    value={formData.serviceOffered || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceOffered: text })
                    }
                    placeholder="e.g. Web Development, Consulting"
                    multiline
                    textAlignVertical="top" // Starts text from the top (Android)
                    scrollEnabled={true}
                />

                <Text style={styles.label}>GST Number <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.gstNumber || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, gstNumber: text })
                    }
                    placeholder="Enter GST Number"
                />

                <Text style={styles.label}>Website URL <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.websiteUrl || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, websiteUrl: text })
                    }
                    placeholder="Enter Website URL"
                />

                {/* Social Media Links Header with Plus Button */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 16,
                    }}
                >
                    <Text style={styles.label}>Social Media Links</Text>
                    <TouchableOpacity
                        onPress={handleAddLink}
                        style={{
                            backgroundColor: "#157a4f",
                            width: 28,
                            height: 28,
                            borderRadius: 16,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <AntDesign name="plus" size={18} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* Social Media Links Input Fields */}
                {socialMediaLinks.map((link, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: index === 0 ? 8 : 8,
                            gap: 8,
                        }}
                    >
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={link}
                            onChangeText={(text) => handleLinkChange(index, text)}
                            placeholder={`Enter Social Media Link ${index + 1}`}
                        />
                        {index > 0 && (
                            <TouchableOpacity
                                onPress={() => handleRemoveLink(index)}
                                style={{
                                    backgroundColor: "#dc2626",
                                    width: 28,
                                    height: 28,
                                    borderRadius: 16,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <AntDesign name="delete" size={16} color="#ffffff" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <View style={{ height: 1, backgroundColor: "#a0a0a0", marginTop: 20 }} />

                <Text style={[styles.label, { alignSelf: "center", color: "#f5b85c" }]}>Offer Details</Text>
                <Text style={styles.label}>Campaign Name <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.campaignName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, campaignName: text })
                    }
                    placeholder="e.g. Summer Sale"
                />

                <Text style={styles.label}>Valid Till <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    value={formData.validTill || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, validTill: text })
                    }
                    placeholder="Valid Till Date"
                />

                <Text style={styles.label}>Description <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={formData.description || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, description: text })
                    }
                    placeholder="Descibe your campaign details"
                    multiline
                    textAlignVertical="top" // Starts text from the top (Android)
                    scrollEnabled={true}
                />

                <Text style={styles.label}>Shop Address <Text style={{ color: "#d92d20" }}>*</Text></Text>
                <TextInput
                    style={[styles.descriptionInput, { minHeight: 100, maxHeight: 100 }]}
                    value={formData.shopAddress || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, shopAddress: text })
                    }
                    placeholder="Enter Shop Address"
                    multiline
                    textAlignVertical="top" // Starts text from the top (Android)
                    scrollEnabled={true}
                />
            </View>

            {!isEditMode && (
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                        if (!formData.businessName?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Business Name.", type: "warning" });
                            return;
                        }
                        if (!formData.businessType?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Business Type.", type: "warning" });
                            return;
                        }
                        if (!formData.serviceOffered?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Services Offered.", type: "warning" });
                            return;
                        }
                        if (!formData.gstNumber?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in GST Number.", type: "warning" });
                            return;
                        }
                        if (!formData.websiteUrl?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Website URL.", type: "warning" });
                            return;
                        }
                        if (!formData.campaignName?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Campaign Name.", type: "warning" });
                            return;
                        }
                        if (!formData.validTill?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Valid Till date.", type: "warning" });
                            return;
                        }
                        if (!formData.description?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Description.", type: "warning" });
                            return;
                        }
                        if (!formData.shopAddress?.trim()) {
                            setAlertConfig({ visible: true, title: "Missing Information", message: "Please fill in Shop Address.", type: "warning" });
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
        minHeight: 150,      // Increased height
        maxHeight: 150,      // Keeps the box fixed after this height
        ...textPresets.body,
        textAlignVertical: "top",
    },
});

