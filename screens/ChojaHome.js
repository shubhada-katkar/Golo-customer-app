import React, { useCallback, useContext, useRef, useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import ChojaBottom from "../components/ChojaBottom";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import Iwant from "../components/Iwant";
import MyAds from "../components/MyAds";
import ChotyaJahirati from "../components/ChotyaJahirati";
import Topbar2 from "../components/Topbar2";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { matchesCategorySubFilter } from "../utils/categorySubFilters";

const categories = [
    { icon: "school-outline", label: "Education" },
    { icon: "heart-outline", label: "Matrimonial" },
    { icon: "car-outline", label: "Vehicle" },
    { icon: "megaphone-outline", label: "Business" },
    { icon: "airplane-outline", label: "Travel" },
    { icon: "sparkles-outline", label: "Astrology" },
    { icon: "home-outline", label: "Property" },
    { icon: "alert-circle-outline", label: "Public Notice" },
    { icon: "compass-outline", label: "Lost & Found" },
    { icon: "construct-outline", label: "Service" },
    { icon: "person-outline", label: "Personal" },
    { icon: "briefcase-outline", label: "Employment" },
    { icon: "paw-outline", label: "Pets" },
    { icon: "phone-portrait-outline", label: "Mobiles" },
    { icon: "tv-outline", label: "Electronics & Home" },
    { icon: "cube-outline", label: "Furniture" },
    { icon: "gift", label: "Greetings" },
    { icon: "ellipsis-horizontal-outline", label: "Other" },
];

const CATEGORY_COLORS = {
    "Education": { bg: "#ece2fb", dark: "#6b3fc4" },
    "Matrimonial": { bg: "#fbdfe2", dark: "#c23b4d" },
    "Vehicle": { bg: "#d6e7fa", dark: "#1d5fa3" },
    "Business": { bg: "#fdf2cf", dark: "#a8821a" },
    "Travel": { bg: "#d2f3ea", dark: "#0f8a5f" },
    "Astrology": { bg: "#ede1fb", dark: "#7b3fc4" },
    "Property": { bg: "#d6f5ec", dark: "#117a5a" },
    "Public Notice": { bg: "#fbdfe2", dark: "#c23b4d" },
    "Lost & Found": { bg: "#fdeccb", dark: "#b3781a" },
    "Service": { bg: "#fde3cf", dark: "#c2641a" },
    "Personal": { bg: "#e1eaf0", dark: "#3c6685" },
    "Employment": { bg: "#d6efe2", dark: "#1c7a4d" },
    "Pets": { bg: "#fde3cf", dark: "#c2641a" },
    "Mobiles": { bg: "#d6e7fa", dark: "#1d5fa3" },
    "Electronics & Home": { bg: "#e1eaf0", dark: "#3c6685" },
    "Furniture": { bg: "#fde3cf", dark: "#c2641a" },
    "Greetings": { bg: "#fbdfe2", dark: "#c23b4d" },
    "Other": { bg: "#f0f0f0", dark: "#555555" },
};

const SUB_FILTER_OPTIONS = {
    Vehicle: [
        { label: "Buy", value: "sell" },
        { label: "Rent", value: "rent" },
    ],
    Property: [
        { label: "Buy", value: "sell" },
        { label: "Rent", value: "rent" },
    ],
    Greetings: [
        { label: "Greetings", value: "greetings" },
        { label: "Tribute", value: "tribute" },
    ],
};

export default function ChojaHome() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubFilter, setSelectedSubFilter] = useState(null);
    const [showSubFilterMenu, setShowSubFilterMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { colors } = useContext(ThemeContext);
    const inputRef = useRef(null);
    const [tab, setTab] = useState("Chotya Jahirati");
    const sortedCategories = categories;
    const scrollRef = useRef(null);

    const [locationStatus, setLocationStatus] = useState("loading");
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [locationPlaceName, setLocationPlaceName] = useState("");
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [gpsPlaceName, setGpsPlaceName] = useState("");

    // Location editing state
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const locationInputRef = useRef(null);
    const debounceTimer = useRef(null);

    const [categoryLayouts, setCategoryLayouts] = useState({});
    const scrollX = useRef(0);
    const [dropdownLeft, setDropdownLeft] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const getUserLocation = async () => {
            try {
                setLocationStatus("loading");
                setLocationPlaceName("");

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (!isMounted) return;

                if (status !== "granted") {
                    setLocationStatus("denied");
                    return;
                }

                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (!isMounted) return;

                const coords = {
                    lat: current?.coords?.latitude,
                    lng: current?.coords?.longitude,
                };

                setUserCoordinates(coords);
                setGpsCoordinates(coords);

                // Use Nominatim reverse geocoding (same as the website) for consistent address display
                try {
                    const reverseRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
                        {
                            headers: {
                                "User-Agent": "GoloCustomerApp/1.0",
                                "Accept": "application/json",
                            },
                        }
                    );
                    if (!isMounted) return;

                    if (reverseRes.ok) {
                        const reverseData = await reverseRes.json();
                        const addr = reverseData?.address || {};

                        const parts = [
                            addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.building,
                            addr.house_number,
                            addr.road || addr.pedestrian || addr.footway,
                            addr.neighbourhood,
                            addr.suburb,
                            addr.quarter,
                            addr.city_district,
                            addr.village,
                            addr.town,
                            addr.city,
                            addr.district,
                            addr.county,
                            addr.state_district,
                            addr.state,
                            addr.postcode,
                            addr.country,
                        ].filter(Boolean);

                        const cleanParts = parts.map(p => String(p).trim()).filter(Boolean);
                        const uniqueParts = [];
                        for (const part of cleanParts) {
                            if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
                                uniqueParts.push(part);
                            }
                        }

                        const resolvedName = uniqueParts.join(", ") || "your current area";
                        if (!isMounted) return;
                        setLocationPlaceName(resolvedName);
                        setGpsPlaceName(resolvedName);
                    } else {
                        throw new Error(`Nominatim reverse HTTP ${reverseRes.status}`);
                    }
                } catch {
                    if (!isMounted) return;
                    setLocationPlaceName("your current area");
                    setGpsPlaceName("your current area");
                }

                setLocationStatus("granted");
            } catch (locationError) {
                if (!isMounted) return;
                setLocationStatus("denied");
                console.error("Location permission/fetch error:", locationError);
            }
        };

        getUserLocation();
        return () => { isMounted = false; };
    }, []);

    const fetchLocationSuggestions = useCallback(async (query) => {
        const trimmed = (query || "").trim();
        if (!trimmed) {
            setLocationSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        setSuggestionsLoading(true);
        try {
            const params = new URLSearchParams({
                q: trimmed,
                format: "json",
                addressdetails: "1",
                limit: "8",
                "accept-language": "en",
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                {
                    headers: {
                        "User-Agent": "GoloCustomerApp/1.0",
                        "Accept": "application/json",
                    },
                }
            );
            if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

            const data = await response.json();
            const suggestions = (data || []).map((item, idx) => {
                const addr = item.address || {};
                const parts = [
                    addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.building || addr.place,
                    addr.house_number,
                    addr.road || addr.pedestrian || addr.footway || addr.street,
                    addr.neighbourhood,
                    addr.suburb,
                    addr.quarter,
                    addr.city_district,
                    addr.village,
                    addr.town,
                    addr.city,
                    addr.district,
                    addr.county,
                    addr.state_district,
                    addr.state,
                    addr.postcode,
                    addr.country,
                ].filter(Boolean);

                const cleanParts = parts.map(p => String(p).trim()).filter(Boolean);
                const uniqueParts = [];
                for (const part of cleanParts) {
                    if (!uniqueParts.some(p => p.toLowerCase() === part.toLowerCase())) {
                        uniqueParts.push(part);
                    }
                }
                const resolvedLabel = uniqueParts.join(", ");

                return {
                    id: `${item.place_id || idx}`,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    label: resolvedLabel || item.display_name || trimmed,
                };
            });

            const seen = new Set();
            const unique = suggestions.filter((s) => {
                if (seen.has(s.label)) return false;
                seen.add(s.label);
                return true;
            });
            setLocationSuggestions(unique);
        } catch (err) {
            console.error("Location suggestion error:", err);
            setLocationSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }
    }, []);

    const handleLocationQueryChange = useCallback((text) => {
        setLocationQuery(text);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchLocationSuggestions(text);
        }, 400);
    }, [fetchLocationSuggestions]);

    const handleStartEditingLocation = useCallback(() => {
        setIsEditingLocation(true);
        setLocationQuery("");
        setLocationSuggestions([]);
        setTimeout(() => locationInputRef.current?.focus(), 100);
    }, []);

    const handleCancelEditingLocation = useCallback(() => {
        setIsEditingLocation(false);
        setLocationQuery("");
        setLocationSuggestions([]);
        Keyboard.dismiss();
    }, []);

    const handleSelectSuggestion = useCallback((suggestion) => {
        Keyboard.dismiss();
        setIsEditingLocation(false);
        setLocationQuery("");
        setLocationSuggestions([]);
        setUserCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
        setLocationPlaceName(suggestion.label);
        setLocationStatus("granted");
    }, []);

    const handleResetToGPS = useCallback(() => {
        if (gpsCoordinates) {
            setUserCoordinates(gpsCoordinates);
            setLocationPlaceName(gpsPlaceName);
        }
        handleCancelEditingLocation();
    }, [gpsCoordinates, gpsPlaceName, handleCancelEditingLocation]);

    const locationLabel =
        locationStatus === "granted"
            ? locationPlaceName || "Current location"
            : locationStatus === "loading"
                ? "Checking your location..."
                : "Tap to set location";

    const activeSubFilterOptions = selectedCategory ? SUB_FILTER_OPTIONS[selectedCategory] || null : null;

   const handleCategoryPress = useCallback((label) => {
    const isSameCategory = selectedCategory === label;

    if (label === "Vehicle" || label === "Greetings" || label === "Property") {
        if (!isSameCategory) {
            // Picking a fresh category -> select it and open the dropdown
            setSelectedCategory(label);
            setSelectedSubFilter(null);
            setShowSubFilterMenu(true);
            const layout = categoryLayouts[label];
            if (layout) setDropdownLeft(layout.x - scrollX.current);
        } else if (showSubFilterMenu) {
            // Chip tapped again while dropdown is open -> fully deselect
            setSelectedCategory(null);
            setSelectedSubFilter(null);
            setShowSubFilterMenu(false);
        } else {
            // Chip tapped again while dropdown is closed -> reopen it
            // (selectedSubFilter, if any, stays intact and will show green highlight)
            setShowSubFilterMenu(true);
            const layout = categoryLayouts[label];
            if (layout) setDropdownLeft(layout.x - scrollX.current);
        }
        return;
    }

    setSelectedCategory(isSameCategory ? null : label);
    setSelectedSubFilter(null);
    setShowSubFilterMenu(false);
}, [selectedCategory, categoryLayouts, showSubFilterMenu]);

const handleCloseSubFilterMenu = useCallback(() => {
    setShowSubFilterMenu(false);
}, []);

    const handleSelectSubFilter = useCallback((value) => {
        setSelectedSubFilter((current) => (current === value ? null : value));
        setShowSubFilterMenu(false);
    }, []);

    return (
        <TouchableWithoutFeedback onPress={handleCloseSubFilterMenu}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar2 />

            {isEditingLocation ? (
                <View style={[styles.locationSection, styles.locationEditingSection]}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationLeftGroup}>
                            <Ionicons name="location-outline" size={16} color="#c47a00" />
                            <TextInput
                                ref={locationInputRef}
                                style={styles.locationInput}
                                placeholder="Type a city or area..."
                                placeholderTextColor="#888"
                                value={locationQuery}
                                onChangeText={handleLocationQueryChange}
                                returnKeyType="search"
                                autoCorrect={false}
                                autoCapitalize="words" />
                        </View>
                        <TouchableOpacity onPress={handleCancelEditingLocation} style={styles.locationCancelBtn}>
                            <Ionicons name="close-circle" size={18} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {(suggestionsLoading || locationSuggestions.length > 0) && (
                        <View style={styles.suggestionsContainer}>
                            {suggestionsLoading ? (
                                <View style={styles.suggestionLoading}>
                                    <ActivityIndicator size="small" color="#c47a00" />
                                    <Text style={styles.suggestionLoadingText}>Searching...</Text>
                                </View>
                            ) : (
                                locationSuggestions.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectSuggestion(s)}
                                        activeOpacity={0.7} >
                                        <Ionicons name="location-sharp" size={14} color="#c47a00" style={{ marginRight: 8 }} />
                                        <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                            {gpsCoordinates && (
                                <TouchableOpacity
                                    style={[styles.suggestionItem, styles.gpsResetItem]}
                                    onPress={handleResetToGPS}
                                    activeOpacity={0.7} >
                                    <Ionicons name="navigate" size={14} color="#157a4f" style={{ marginRight: 8 }} />
                                    <Text style={[styles.suggestionText, { color: "#157a4f" }]}>Use my current GPS location</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.locationSection}
                    onPress={handleStartEditingLocation}
                    activeOpacity={0.75}
                >
                    <View style={styles.locationRow}>
                        <View style={styles.locationLeftGroup}>
                            <Ionicons name="location-outline" size={16} color="#000000" />
                            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                                {locationLabel}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={14} color="#555" />
                    </View>
                </TouchableOpacity>
            )}

            <View style={styles.row1}>
                <TouchableOpacity
                    style={styles.search}
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()} >

                    <EvilIcons name="search" size={24} color="#555" />
                    <TextInput
                        ref={inputRef}
                        placeholder="Search ads by name or category"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        textAlignVertical="center"
                        returnKeyType="search"
                    />

                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                            <Ionicons name="close-circle" size={19} color="#555" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={{ paddingVertical: 12, position: "relative", zIndex: 10 }}>
               <ScrollView
    ref={scrollRef}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.chipsRow}
    onScroll={(e) => {
        scrollX.current = e.nativeEvent.contentOffset.x;
        if (selectedCategory) {
            const layout = categoryLayouts[selectedCategory];
            if (layout) setDropdownLeft(layout.x - scrollX.current);
        }
    }}
    scrollEventThrottle={16} >
    {sortedCategories.map((item, index) => {
        const isActive = selectedCategory === item.label;
        const { bg, dark } = CATEGORY_COLORS[item.label] || { bg: "#f0f0f0", dark: "#555555" };
        return (
            <TouchableOpacity
                key={index}
                onPress={() => handleCategoryPress(item.label)}
                onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setCategoryLayouts((prev) => ({ ...prev, [item.label]: { x, width } }));
                }}
                style={styles.categoryItem}
            >
                <View style={[styles.categoryIconCircle, { backgroundColor: bg }]}>
                    <Ionicons name={item.icon} size={20} color={dark} />
                </View>
                <Text style={[styles.categoryText, { color: dark }]} numberOfLines={1}>
                    {item.label}
                </Text>
                {isActive && <View style={styles.categoryUnderline} />}
            </TouchableOpacity>
        );
    })}
</ScrollView>
            

               {showSubFilterMenu && activeSubFilterOptions && (
    <View style={[styles.subFilterDropdown, { left: dropdownLeft }]}>
        {activeSubFilterOptions.map((option, idx) => {
            const isSelected = selectedSubFilter === option.value;
            const isLast = idx === activeSubFilterOptions.length - 1;
            return (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.subFilterDropdownItem,
                        isLast && { borderBottomWidth: 0 },
                        isSelected && styles.subFilterDropdownItemActive,
                    ]}
                    onPress={() => handleSelectSubFilter(option.value)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.subFilterDropdownText, isSelected && styles.subFilterDropdownTextActive]}>
                        {option.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#157a4f" />}
                </TouchableOpacity>
            );
        })}
    </View>
)}
        </View>

            <View style={{ paddingHorizontal: 8 }}>
                <View style={styles.row2}>

                    <TouchableOpacity
                        onPress={() => setTab("Chotya Jahirati")}
                        style={[
                            styles.tabButton,
                            tab === "Chotya Jahirati" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "Chotya Jahirati" && styles.activeText]} >
                            Chotya Jahirati </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("My Ads")}
                        style={[
                            styles.tabButton,
                            tab === "My Ads" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "My Ads" && styles.activeText]} >
                            My Ads </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab("I Want")}
                        style={[
                            styles.tabButton,
                            tab === "I Want" && styles.activeTab]} >
                        <Text style={[
                            styles.text,
                            tab === "I Want" && styles.activeText]} >
                            I Want </Text>
                    </TouchableOpacity>

                </View>
            </View>

            <View style={{ flex: 1, marginTop: 10 }}>
                {tab === "Chotya Jahirati" && (
                    <ChotyaJahirati
                        selectedCategory={selectedCategory}
                        selectedSubFilter={selectedSubFilter}
                        searchQuery={searchQuery}
                        lat={userCoordinates?.lat}
                        lng={userCoordinates?.lng}
                        locationPlaceName={locationPlaceName}
                    />
                )}
                {tab === "I Want" && <Iwant />}
                {tab === "My Ads" && (
                    <MyAds
                        selectedCategory={selectedCategory}
                        selectedSubFilter={selectedSubFilter}
                        searchQuery={searchQuery}
                    />
                )}
            </View>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <ChojaBottom />
            </SafeAreaView>

        </SafeAreaView>
    </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    search: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginVertical: 4,
        paddingHorizontal: 4,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: 5,
        fontFamily: "Medium",
        fontSize: 13,
        top: 4
    },
    voiceButton: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    row2: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#157a4f",
        borderRadius: 8,
        padding: 6
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        borderRadius: 6
    },
    activeTab: {
        backgroundColor: "#FFD700",
    },
    text: {
        color: "#ffffff",
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 2.4)
    },
    activeText: {
        color: "#000000",
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 2.4),
    },
    chipsRow: {
        flexDirection: "row",
        paddingHorizontal: 10,
        alignItems: "flex-start",
    },
    categoryItem: {
        alignItems: "center",
        justifyContent: "flex-start",
        width: 72,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 10,
        fontFamily: "Medium",
        color: "#000",
        marginTop: 4,
        textAlign: "center",
        lineHeight: Math.round(10 * 1.2),
    },
    categoryIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    categoryUnderline: {
        marginTop: 4,
        width: 20,
        height: 2,
        backgroundColor: "#000000",
        borderRadius: 1,
    },
   subFilterDropdown: {
    position: "absolute",
    top: "100%",
    marginTop: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f5b849",
    overflow: "hidden",
    minWidth: 120,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 200,
},
subFilterDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5e9cf",
},
subFilterDropdownItemActive: {
    backgroundColor: "#f0faf5",
},
subFilterDropdownText: {
    fontSize: 12,
    fontFamily: "Medium",
    color: "#000",
    lineHeight: Math.round(12 * 1.5),
},
subFilterDropdownTextActive: {
    color: "#157a4f",
    fontFamily: "SemiBold",
},
    locationSection: {
        backgroundColor: "#ffffffe5",
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 44,
        justifyContent: "center",
        marginHorizontal: 12,
        marginBottom: 5,
        borderColor: "#f8a812",
        borderWidth: 1,
    },
    locationEditingSection: {
        height: "auto",
        backgroundColor: "#fff8ec",
        borderWidth: 1,
        borderColor: "#f8a812",
        paddingVertical: 8,
        zIndex: 100,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    locationLeftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flex: 1,
        marginRight: 8,
    },
    locationText: {
        fontSize: 12,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
        flexShrink: 1,
    },
    locationInput: {
        flex: 1,
        fontSize: 12,
        fontFamily: "Medium",
        color: "#222",
        paddingVertical: 0,
        paddingHorizontal: 4,
        marginTop: 3,
    },
    locationCancelBtn: {
        paddingLeft: 4,
    },
    suggestionsContainer: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 20,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5c47a",
        overflow: "hidden",
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        zIndex: 200,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f5e9cf",
    },
    gpsResetItem: {
        backgroundColor: "#f0faf5",
        borderBottomWidth: 0,
    },
    suggestionText: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Medium",
        color: "#333",
        lineHeight: Math.round(13 * 1.5),
    },
    suggestionLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
    },
    suggestionLoadingText: {
        fontSize: 13,
        fontFamily: "Medium",
        color: "#888",
        lineHeight: Math.round(13 * 1.5),
    },
})