import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";

import Card1 from "../components/Card1";
import Card2 from "../components/Card2";
import Card3 from "../components/Card3";
import Education from "../components/Education";
import Matrimonial from "../components/Matrimonial";
import Furniture from "../components/Furniture";
import Employment from "../components/Employment";
import Electronics from "../components/Electronics";
import Pets from "../components/Pets";
import Mobiles from "../components/Mobiles";
import Astrology from "../components/Astrology";
import Travel from "../components/Travel";
import Business from "../components/Business";
import PublicNotice from "../components/PublicNotice";
import Personal from "../components/Personal";
import LostandFound from "../components/LostandFound";
import Service from "../components/Service";
import Others from "../components/Others";
import Greetings from "../components/Greetings";
import Property from "../components/Property";
import Vehicles from "../components/Vehicles";

export default function FormPage({ route, navigation }) {
    const { category, template, selectedDays, selectedLocations, price } = route.params || {};

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});

    const scrollRef = useRef(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, [step]);

    const STEP_2_COMPONENTS = {
        education: Education,
        travel: Travel,
        vehicles: Vehicles,
        property: Property,
        matrimonial:Matrimonial,
        employment:Employment,
        furniture:Furniture,
        electronics_home:Electronics,
        pets:Pets,
        mobiles:Mobiles,
        astrology:Astrology,
        business:Business,
        publicnotice:PublicNotice,
        personal:Personal,
        lostandfound:LostandFound,
        service:Service,
        others:Others,
        greetings:Greetings,
    };

    const Step2Component = STEP_2_COMPONENTS[category?.id];
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f9a641", "#f5b849", "#ffffff"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1 }}
            >
                <View style={{ padding: 16 }}>
                    <View style={styles.row1}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back-ios" size={26} style={{ paddingHorizontal: 10 }} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 22, fontFamily: "Medium", lineHeight: Math.round(22 * 1.5) }}>
                            Smart Jahirati
                        </Text>
                    </View>

                    <Text style={{ fontSize: 16, marginLeft: 48, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                        Post Your Ads Instantly Online
                    </Text>
                </View>

                <ScrollView ref={scrollRef}>
                    <View style={{ flex: 1, padding: 20 }}>

                        {step === 1 && template === "card1" && (
                            <Card1
                                category={category}
                                formData={formData}
                                setFormData={setFormData}
                                onNext={() => setStep(2)}
                            />
                        )}

                        {step === 1 && template === "card2" && (
                            <Card2
                                category={category}
                                formData={formData}
                                setFormData={setFormData}
                                onNext={() => setStep(2)}
                            />
                        )}

                        {step === 1 && template === "card3" && (
                            <Card3
                                category={category}
                                formData={formData}
                                setFormData={setFormData}
                                onNext={() => setStep(2)}
                            />
                        )}

                        {step === 2 && Step2Component && (
                            <Step2Component
                                category={category}
                                formData={formData}
                                setFormData={setFormData}
                                onPrevious={() => setStep(1)}
                                template={template}
                                navigation={navigation} 
                                selectedDays={selectedDays}
                                selectedLocations={selectedLocations}
                                price={price}
                            />
                        )}

                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center",
    },
});