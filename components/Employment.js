import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Employment({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations }) {
  if (category?.id !== "employment") return null;
  const navigation = useNavigation();

  const ConditionButton = ({ label, value, field }) => (
    <TouchableOpacity
      style={[
        styles.segmentBtn,
        formData[field] === value && styles.segmentBtnSelected,
      ]}
      onPress={() => setFormData({ ...formData, [field]: value })}
    >
      <Text
        style={[
          styles.segmentText,
          formData[field] === value && styles.segmentTextSelected,
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
        <Text style={styles.composeTitle}>Employment</Text>

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

        <Text style={styles.label}>Employment Type</Text>
        <View style={styles.segmentRow}>
          <ConditionButton label="Full Time" value="full time" field="employmentType" />
          <ConditionButton label="Part Time" value="part time" field="employmentType" />
          <ConditionButton label="Contract" value="contract" field="employmentType" />
        </View>

        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.segmentRow}>
          <ConditionButton label="Entry Level" value="entry level" field="experienceLevel" />
          <ConditionButton label="Mid Level" value="mid level" field="experienceLevel" />
          <ConditionButton label="Senior Level" value="senior level" field="experienceLevel" />
        </View>

        <Text style={styles.label}>Industry</Text>
        <TextInput
          style={styles.input}
          value={formData.industry || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, industry: text })
          }
          placeholder="e.g. IT, Healthcare, Finance..."
        />

        <Text style={styles.label}>Salary Range (Monthly)</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.salaryRange || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, salaryRange: text })
            }
            placeholder="Min."
          />

          <Text style={{ fontSize: 18, marginVertical: 10 }}>–</Text>

          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.salaryRangeMax || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, salaryRangeMax: text })
            }
            placeholder="Max."
          />
        </View>

        <Text style={styles.label}>Total Vacancies</Text>
        <TextInput
          style={styles.input}
          value={formData.vacancies || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, vacancies: text })
          }
          placeholder="Number of vacancies available"
        />

        <Text style={styles.label}>
          Benifits & Perks
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, insurance: !formData.insurance })
              }
            >
              {formData.insurance && <View style={styles.checkboxTick} />}
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Health Insurance</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, paidoff: !formData.paidoff })
              }
            >
              {formData.paidoff && <View style={styles.checkboxTick} />}
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Paid Time Off</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, workFromHome: !formData.workFromHome })
              }
            >
              {formData.workFromHome && <View style={styles.checkboxTick} />}
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Work From Home</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({ ...formData, annualBonus: !formData.annualBonus })
              }
            >
              {formData.annualBonus && <View style={styles.checkboxTick} />}
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 0, fontSize: 14 }]}>Annual Bonus</Text>
          </View>
        </View>

      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations }); }}>
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

  segmentRow: {
    flexDirection: "row",
    marginTop: 10,
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
    width: 23,
    height: 23,
    borderWidth: 1,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  checkboxTick: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#f5b849",
  },
});