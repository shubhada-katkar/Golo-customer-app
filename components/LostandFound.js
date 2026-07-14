import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
}) {
    if (category?.id !== "lostandfound") return null;
    const navigation = useNavigation();

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
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.composeTitle}>Lost & Found</Text>

                <TouchableOpacity style={styles.prevBtn} onPress={onPrevious}>
                    <AntDesign name="arrow-left" size={18} color="#fff" />
                    <Text style={styles.prevText}>Previous</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formCard}>

                {/* Status */}
                <Text style={styles.label}>Status *</Text>
                <View style={styles.segmentRow}>
                    <StatusButton label="Lost" value="lost" />
                    <StatusButton label="Found" value="found" />
                </View>

                {/* Item Name */}
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.itemName || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, itemName: text })
                    }
                    placeholder="e.g. Wallet, Mobile Phone"
                />

                {/* Item Type */}
                <Text style={styles.label}>Item Type *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.itemType || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, itemType: text })
                    }
                    placeholder="e.g. Electronics, Documents"
                />

                {/* Date */}
                <Text style={styles.label}>Date *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.date || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, date: text })
                    }
                    placeholder="YYYY-MM-DD"
                />

                {/* Location */}
                <Text style={styles.label}>Location *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.location || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, location: text })
                    }
                    placeholder="Where item was lost/found"
                />

                {/* Description */}
                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={styles.descriptionInput}
                    value={formData.description || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, description: text })
                    }
                    placeholder="Describe the item"
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
                    placeholder="Optional reward amount"
                />

                {/* Contact Details */}
                <Text style={styles.label}>Contact Details *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.contactDetails || ""}
                    onChangeText={(text) =>
                        setFormData({ ...formData, contactDetails: text })
                    }
                    placeholder="Phone number or email"
                />

            </View>

            <TouchableOpacity
                style={styles.nextBtn}
                onPress={() =>
                    navigation.navigate("CalendarScreen", {
                        category,
                        template,
                        formData,
                        price,
                    })
                }
            >
                <Text style={styles.nextText}>See Preview</Text>
            </TouchableOpacity>
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
        fontSize: 18,
        fontFamily: "Medium",
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
        fontFamily: "Medium",
        fontSize: 16,
        marginLeft: 6,
        color: "#fff",
    },

    formCard: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        borderRadius: 10,
        paddingBottom: 18,
    },

    label: {
        fontSize: 16,
        marginTop: 16,
        fontFamily: "Medium",
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        fontSize:14,
        fontFamily:"Medium"
    },

 descriptionInput: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 12,
  minHeight: 100,      // Increased height
  maxHeight: 100,      // Keeps the box fixed after this height
  fontSize: 14,
  textAlignVertical: "top",
  fontFamily:"Medium"
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
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
});