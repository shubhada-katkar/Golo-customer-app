import React, { useContext, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function Greetings({ formData, setFormData, category, onPrevious, template, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }) {
  if (category?.id !== "greetings") return null;
  const [selectedTab, setSelectedTab] = useState("Greetings");
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!formData.Type) {
      setFormData({ ...formData, Type: "Greetings" });
    }
  }, []);

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
        <Text style={styles.composeTitle}>Greetings</Text>

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

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 50, justifyContent: "space-between" }}>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Greetings" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Greetings");
            setFormData({ 
              ...formData, 
              Type: "Greetings",
              // Clear tribute-specific fields
              name2: "",
              age2: "",
              year2: "",
              summary: "",
              funeralDetails: ""
            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Greetings" && styles.activeTabText
            ]}
          >
            Greetings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Tribute" && styles.activeTab
          ]}
          onPress={() => {
            setSelectedTab("Tribute");
            setFormData({ 
              ...formData, 
              Type: "Tribute",
              // Clear greetings-specific fields
              relationType: "",
              from: ""
            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Tribute" && styles.activeTabText
            ]}
          >
            Tribute
          </Text>
        </TouchableOpacity>

      </View>


      <View style={styles.formCard}>

        {selectedTab === "Greetings" && (
          <>
            <Text style={styles.label}>Select Relationship</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.relationType || ""}
                onValueChange={(value) => setFormData({ ...formData, relationType: value })}
                mode="dropdown"
              >
                <Picker.Item label="Relationship Type" value="" />
                <Picker.Item label="Friend" value="Friend" />
                <Picker.Item label="Brother" value="Brother" />
                <Picker.Item label="Sister" value="Sister" />
                <Picker.Item label="Relative" value="Relative" />
                <Picker.Item label="Parent" value="Parent" />
                <Picker.Item label="Colleague" value="Colleague" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <Text style={styles.label}>Name of Person</Text>
            <TextInput
              style={styles.input}
              value={formData.name || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              placeholder="Enter name of person"
            />

            <Text style={styles.label}>Age Turning</Text>
            <TextInput
              style={styles.input}
              value={formData.age || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, age: text })
              }
              placeholder="Enter age"
            />

            <Text style={styles.label}>Date of Birthday</Text>
            <TextInput
              style={styles.input}
              value={formData.year || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, year: text })
              }
              placeholder="Enter Birthdate"
            />

            <Text style={styles.label}>Your Message / Wishes</Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.wishes || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, wishes: text })
              }
              placeholder="Enter Message"
              multiline
  textAlignVertical="top" // Starts text from the top (Android)
  scrollEnabled={true}
            />

            <Text style={styles.label}>From</Text>
            <TextInput
              style={styles.input}
              value={formData.from || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, from: text })
              }
              placeholder="Enter Your Name"
            />

          </>
        )}

        {selectedTab === "Tribute" && (
          <>
            <Text style={styles.label}>Full Name of Deceased</Text>
            <TextInput
              style={styles.input}
              value={formData.name2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, name2: text })
              }
              placeholder="Enter name"
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, age2: text })
              }
              placeholder="Enter age"
            />

            <Text style={styles.label}>Date of Birthday</Text>
            <TextInput
              style={styles.input}
              value={formData.year2 || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, year2: text })
              }
              placeholder="Enter Birthdate"
            />

            <Text style={styles.label}>Short Biography / Life Summary</Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.summary || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, summary: text })
              }
              placeholder="Enter Message"
              multiline
  textAlignVertical="top" // Starts text from the top (Android)
  scrollEnabled={true}
            />

            <Text style={styles.label}>Funeral / Prayer Meetings Details(Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.funeralDetails || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, funeralDetails: text })
              }
              placeholder="Venue, Date, Time and Other Details"
              multiline
  textAlignVertical="top" // Starts text from the top (Android)
  scrollEnabled={true}
            />

          </>
        )}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => { navigation.navigate("Preview", { template, category, formData, price, selectedDays, selectedLocations, selectedDates, startDate, endDate }); }}>
        <Text style={styles.nextText}>See Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composeTitle: { fontSize: 18, fontFamily: "Medium", lineHeight: Math.round(18 * 1.5) },
  formCard: { backgroundColor: "#fff", paddingHorizontal: 16, borderRadius: 10, paddingBottom: 18, marginTop: 10 },
  label: { fontSize: 16, marginTop: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  value: { fontSize: 16, color: "#555", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 6, fontSize:14, fontFamily:"Medium" },
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

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  tab: {
    borderRadius: 60,
    backgroundColor: "#c9e9e9",
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 6
  },
  activeTab: {
    backgroundColor: "#156e7a",
  },

  tabText: {
    fontFamily: "Medium",
    fontSize: 15,
    lineHeight: Math.round(15 * 1.5),
    color: "#0a3d3d",
  },

  activeTabText: {
    color: "#ffffff",
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
    lineHeight: Math.round(15 * 1.5),
  },
  segmentTextSelected: {
    color: "#fff",
  },
   descriptionInput: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 12,
  minHeight: 150,      // Increased height
  maxHeight: 150,      // Keeps the box fixed after this height
  fontSize: 14,
  textAlignVertical: "top",
  fontFamily:"Medium"
},
});

