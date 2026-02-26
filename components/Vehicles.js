import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

export default function Vehicles({ formData, setFormData, category, onPrevious }) {
  if (category?.id !== "vehicles") return null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 5,
        }}
      >
        <Text style={styles.composeTitle}>Vehicles</Text>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8, 
            paddingVertical:5,
            backgroundColor:"#108136",
            borderRadius:10         // bigger touch target
          }}
         onPress={onPrevious}  >
          <AntDesign name="arrow-left" size={18} color="#ffffff"/>
          <Text style={{fontFamily:"Medium", fontSize:16, marginLeft: 6, 
            color:"#ffffff", lineHeight:Math.round(16*1.5) }}>Previous</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>

        <Text style={styles.label}>Posting Type</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, postingType: text })
          }
          placeholder="Type your text here..."
        />

        <Text style={styles.label}>Vehicle Type</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, vehicleType: text })
          }
          placeholder="Type"
        />

        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, brand: text })
          }
          placeholder="e.g. Toyato, Tata..."
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, model: text })
          }
          placeholder="e.g. Camry, Civic..."
        />

        <Text style={styles.label}>Variant</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, variant: text })
          }
          placeholder="e.g.VXI, ZXI"
        />

        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, year: text })
          }
          placeholder="Enter Year of purchase"
        />

        <Text style={styles.label}>Fuel Type</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, fuelType: text })
          }
          placeholder="Fuel"
        />

        <Text style={styles.label}>KM Driven</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, km: text })
          }
          placeholder="e.g. 23000"
        />

        <Text style={styles.label}>Ownership</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, ownership: text })
          }
          placeholder="Select"
        />

        <Text style={styles.label}>Insurance Valid Till</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, insurance: text })
          }
          placeholder=""
        />

            <Text style={styles.label}>Condition</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, condition: text })
          }
          placeholder="Condition"
        />

            <Text style={styles.label}>Expected Price</Text>
        <TextInput
          style={styles.input}
          value={formData.heading}
          onChangeText={(text) =>
            setFormData({ ...formData, price: text })
          }
          placeholder="Enter Amount"
        />

      </View>

      <TouchableOpacity style={styles.nextBtn}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>

    </ScrollView >
  );
}

const styles = StyleSheet.create({

  composeTitle: { fontSize: 18, fontFamily: "Medium", marginBottom: 10 },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10 },
  label: { fontSize: 16, marginTop: 10, fontFamily: "Medium", lineHeight:Math.round(16*1.5) },
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

  nextBtn: { backgroundColor: "#157a4f", padding: 12, borderRadius: 10, alignItems: "center", marginVertical: 20 },
  nextText: { color: "#fff", fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
});