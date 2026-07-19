import React, { useCallback, useContext, useRef, useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback, Modal, Dimensions } from "react-native";
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
import { textPresets } from "../theme/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Price High to Low", value: "price_desc" },
    { label: "Price Low to High", value: "price_asc" },
    { label: "Nearby", value: "nearby" },
];

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

    // Modal state
    const [allCategoriesModalOpen, setAllCategoriesModalOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");

    // Sort state
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [selectedSort, setSelectedSort] = useState("newest");

    useEffect(() => {
        if (selectedCategory) {
            const layout = categoryLayouts[selectedCategory];
            if (layout) {
                setDropdownLeft(layout.x);
            }
        }
    }, [selectedCategory, categoryLayouts]);

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
                if (layout) setDropdownLeft(layout.x);
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
                if (layout) setDropdownLeft(layout.x);
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

    const STRIP_CATEGORIES = categories.slice(0, 4);
    let displayedCategories = [...STRIP_CATEGORIES];
    if (selectedCategory) {
        const selectedIndex = categories.findIndex(cat => cat.label === selectedCategory);
        if (selectedIndex >= 4) {
            const selectedItem = categories[selectedIndex];
            displayedCategories[3] = selectedItem;
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => {
            handleCloseSubFilterMenu();
            setShowSortDropdown(false);
        }}>
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
                        style={[styles.search, { flex: 1 }]}
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

                    {/* Filter Button */}
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => setShowSortDropdown(!showSortDropdown)}
                    >
                        <Ionicons name="options-outline" size={20} color="#157a4f" />
                    </TouchableOpacity>

                    {/* Sort Dropdown */}
                    {showSortDropdown && (
                        <View style={styles.sortDropdown}>
                            {SORT_OPTIONS.map((option) => {
                                const isSelected = selectedSort === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.sortDropdownItem,
                                            isSelected && styles.sortDropdownItemActive
                                        ]}
                                        onPress={() => {
                                            setSelectedSort(option.value);
                                            setShowSortDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.sortDropdownText,
                                            isSelected && styles.sortDropdownTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#157a4f" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Categories */}
                <View style={{ paddingTop: 12, position: "relative", zIndex: 10, paddingHorizontal: 10 }}>
                    <View style={styles.categoryStripRow}>
                        {displayedCategories.map((item, index) => {
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
                                    style={styles.stripChip}
                                >
                                    <View style={[styles.stripIconCircle, { backgroundColor: isActive ? dark : bg }]}>
                                        <Ionicons name={item.icon} size={18} color={isActive ? "#fff" : dark} />
                                    </View>
                                    <Text style={[styles.stripText, { color: dark, ...textPresets.caption }]} numberOfLines={2}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={styles.stripChip}
                            activeOpacity={0.8}
                            onPress={() => setAllCategoriesModalOpen(true)}
                        >
                            <View style={[styles.stripIconCircle, { backgroundColor: "#f2f2f2" }]}>
                                <Ionicons name="grid" size={18} color="#444" />
                            </View>
                            <Text style={[styles.stripText, { color: "#444" }]} numberOfLines={1}>
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

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
                        {/* 
                        <TouchableOpacity
                            onPress={() => setTab("I Want")}
                            style={[
                                styles.tabButton,
                                tab === "I Want" && styles.activeTab]} >
                            <Text style={[
                                styles.text,
                                tab === "I Want" && styles.activeText]} >
                                I Want </Text>
                        </TouchableOpacity> */}

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
                            selectedSort={selectedSort}
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

                {/* ---- All Categories Modal ---- */}
                <Modal
                    visible={allCategoriesModalOpen}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setAllCategoriesModalOpen(false)}
                    statusBarTranslucent
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
                        <LinearGradient
                            colors={["#f8a812", "#fad081", "#ffffff"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.modalHeaderGradient}
                        >
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalTitle}>All Categories</Text>
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setAllCategoriesModalOpen(false)}
                                >
                                    <Ionicons name="close" size={16} color="#333" style={{ marginRight: 2 }} />
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Modal Search Input */}
                            <View style={styles.modalSearchContainer}>
                                <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
                                <TextInput
                                    placeholder="Search categories..."
                                    placeholderTextColor="#888"
                                    value={categorySearchQuery}
                                    onChangeText={setCategorySearchQuery}
                                    style={styles.modalSearchInput}
                                />
                                {categorySearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setCategorySearchQuery("")}>
                                        <Ionicons name="close-circle" size={18} color="#888" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </LinearGradient>

                        {/* Scrollable grid content */}
                        <ScrollView
                            contentContainerStyle={styles.modalGridContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.modalGridRow}>
                                {categories.filter((item) =>
                                    item.label.toLowerCase().includes(categorySearchQuery.toLowerCase())
                                ).map((item) => {
                                    const { bg, dark } = CATEGORY_COLORS[item.label] || { bg: "#f0f0f0", dark: "#555" };

                                    return (
                                        <TouchableOpacity
                                            key={item.label}
                                            style={[styles.modalGridCard, { backgroundColor: bg }]}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                setAllCategoriesModalOpen(false);
                                                setCategorySearchQuery("");
                                                handleCategoryPress(item.label);
                                            }}
                                        >
                                            <View style={styles.modalCardIconCircle}>
                                                <Ionicons name={item.icon} size={22} color={dark} />
                                            </View>
                                            <Text style={styles.modalCardText} numberOfLines={2}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </Modal>

            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    row1: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        position: "relative",
        zIndex: 500,
    },
    search: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        marginVertical: 4,
        paddingHorizontal: 8,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: 5,
        ...textPresets.body,
        top: 3
    },
    voiceButton: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    filterBtn: {
        marginLeft: 8,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        paddingHorizontal: 10,
        justifyContent: "center",
        alignItems: "center",
        height: 48,
        width: 48,
    },
    sortDropdown: {
        position: "absolute",
        top: 52,
        right: 10,
        backgroundColor: "#ffffff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#cacaca",
        width: 170,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        zIndex: 1000,
        overflow: "hidden",
    },
    sortDropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    sortDropdownItemActive: {
        backgroundColor: "#f0faf5",
    },
    sortDropdownText: {
        ...textPresets.label,
        color: "#333",
    },
    sortDropdownTextActive: {
        color: "#157a4f",
        ...textPresets.label
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
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        paddingVertical: 6
    },
    activeText: {
        color: "#000000",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
        paddingVertical: 6
    },
    // Category Strip Styling
    categorySection: {
        marginTop: 5,
        marginBottom: 4,
        paddingHorizontal: 10,
    },
    categoryStripRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    },
    stripChip: {
        alignItems: "center",
        width: "18%",
    },
    stripIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 5,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    stripText: {
        textAlign: "center",
        minHeight: 32,
        lineHeight: 14,
        ...textPresets.caption
    },
    // Modal Styling
    modalHeaderGradient: {
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    modalHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 16,
    },
    modalTitle: {
        color: "#111",
        ...textPresets.subtitle
    },
    modalCloseBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        paddingVertical: 6,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    modalCloseText: {
        color: "#333",
        ...textPresets.label
    },
    modalSearchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e2e2",
        paddingHorizontal: 12,
        paddingVertical: 5,
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1
    },
    modalSearchInput: {
        flex: 1,
        ...textPresets.body,
        color: "#222",
        paddingVertical: 4,
        top: 3
    },
    modalGridContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 40,
    },
    modalGridRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    modalGridCard: {
        width: "48%",
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    modalCardIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    modalCardText: {
        textAlign: "center",
        color: "#111",
        ...textPresets.label
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
        ...textPresets.label,
        color: "#000",
    },
    subFilterDropdownTextActive: {
        color: "#157a4f",
        ...textPresets.label
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
        ...textPresets.label,
        flexShrink: 1,
    },
    locationInput: {
        flex: 1,
        ...textPresets.label,
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
        ...textPresets.body,
        color: "#333",
        lineHeight: Math.round(14 * 1.5),
    },
    suggestionLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
    },
    suggestionLoadingText: {
        ...textPresets.body,
        color: "#888",
        lineHeight: Math.round(14 * 1.5),
    },
})