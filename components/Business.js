import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Business({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
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

                <Text style={styles.label}>Business Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.businessName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, businessName: text })
                    }
                    placeholder="Enter Business Name"
                />

                <Text style={styles.label}>Business Type</Text>
                <TextInput
                    style={styles.input}
                    value={formData.businessType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, businessType: text })
                    }
                    placeholder="e.g. Retail, Service, Manufacturing"
                />

                <Text style={styles.label}>Service Offered</Text>
                <TextInput
                    style={styles.input}
                    value={formData.serviceOffered || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, serviceOffered: text })
                    }
                    placeholder="List the main service or product"
                />

                <Text style={styles.label}>GST Number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.gstNumber || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, gstNumber: text })
                    }
                    placeholder="Enter GST Number (if applicable)"
                />

                <Text style={styles.label}>Website URL</Text>
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
                <Text style={styles.label}>Campaign Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.campaignName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, campaignName: text })
                    }
                    placeholder="Enter Campaign Name"
                />

                <Text style={styles.label}>Valid Till</Text>
                <TextInput
                    style={styles.input}
                    value={formData.validTill || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, validTill: text })
                    }
                    placeholder="Valid Till Date"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    value={formData.description || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, description: text })
                    }
                    placeholder="Enter Description"
                />

                <Text style={styles.label}>Shop Address</Text>
                <TextInput
                    style={styles.input}
                    value={formData.shopAddress || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, shopAddress: text })
                    }
                    placeholder="Enter Shop Address"
                />
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }); }}>
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
});

