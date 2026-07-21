import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { textPresets } from "../theme/typography";

const { width } = Dimensions.get("window");

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "others", label: "Others" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function Registration({ navigation }) {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [visiblepass, setvisiblepass] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [dobDate, setDobDate] = useState(null); // actual Date object backing the picker
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);


  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const formatPhone = (value) => {
    const cleaned = (value || "").replace(/\D/g, "");

    if (!cleaned) {
      return undefined;
    }

    // User enters 10 digits; we send E.164 to satisfy backend @IsPhoneNumber
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`;
    }

    if (cleaned.length > 10 && value.trim().startsWith("+")) {
      return value.trim();
    }

    return null;
  };

  // Accepts dd-mm-yyyy and auto-inserts dashes as the user types
  const formatDobInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  // Converts dd-mm-yyyy -> yyyy-mm-dd (ISO), returns null if invalid or out of range
  const parseDobToIso = (value) => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
    if (!match) return null;

    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    const now = new Date();
    let age = now.getFullYear() - year;
    const hasHadBirthdayThisYear =
      now.getMonth() > month - 1 ||
      (now.getMonth() === month - 1 && now.getDate() >= day);
    if (!hasHadBirthdayThisYear) age -= 1;

    if (age < 1 || age > 120) return null;

    return `${yyyy}-${mm}-${dd}`;
  };

  const getErrorMessage = (message, fallback) => {
    if (Array.isArray(message)) {
      return message.filter(Boolean).join("\n");
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    return fallback;
  };

  // Static for now — will be wired up to real OAuth later
  const handleGooglePress = () => {
    Alert.alert("Coming soon", "Google sign-up will be available soon.");
  };

  const handleFacebookPress = () => {
    Alert.alert("Coming soon", "Facebook sign-up will be available soon.");
  };

  const handleSendOtp = async () => {
    if (timer > 0) {
      Alert.alert("Please wait", `You can request a new OTP in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}.`);
      return;
    }

    if (!email.trim() || !isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address first.");
      return;
    }

    try {
      setOtpLoading(true);
      const response = await fetch(`${BASE_URL}/users/email-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: "register",
          accountType: "user"
        }),
      });

      const data = await response.json();
      setOtpLoading(false);

      if (!response.ok) {
        Alert.alert(
          "Verification failed",
          getErrorMessage(data?.message, "Unable to send verification code.")
        );
        return;
      }

      setOtpSent(true);
      setTimer(300); // 5 minutes timer
      Alert.alert("Verification Code Sent", "Please check your email for the OTP.");
    } catch (error) {
      setOtpLoading(false);
      Alert.alert("Server error", "Unable to send verification code.");
    }
  };

  const handleVerifyOtp = async () => {
    if (timer === 0) {
      Alert.alert("Expired", "OTP has expired. Please resend the code.");
      return;
    }

    if (!otp.trim()) {
      Alert.alert("Code required", "Enter the OTP code sent to your email.");
      return;
    }

    try {
      setVerifyingOtp(true);
      const response = await fetch(`${BASE_URL}/users/email-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();
      setVerifyingOtp(false);

      if (!response.ok) {
        Alert.alert(
          "Verification failed",
          getErrorMessage(data?.message, "Invalid or expired OTP.")
        );
        return;
      }

      setEmailVerified(true);
      setOtpSent(false);
      setTimer(0);
      Alert.alert("Verified", "Your email address has been verified successfully!");
    } catch (error) {
      setVerifyingOtp(false);
      Alert.alert("Server error", "Unable to verify the code.");
    }
  };

  const handleRegister = async () => {
    if (registerLoading) {
      return;
    }

    if (!username.trim() || !email.trim() || !password.trim() || !dob.trim() || !gender) {
      Alert.alert("Missing details", "Fill all fields.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Email verification required", "Please verify your email address first.");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (!dobDate) {
      Alert.alert("Missing details", "Please select your date of birth.");
      return;
    }

    const formattedPhone = formatPhone(phone);
    if (formattedPhone === null) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit phone number.");
      return;
    }

    if (!["male", "female", "others", "prefer_not_to_say"].includes(gender)) {
      Alert.alert("Invalid gender", "Select a valid gender option.");
      return;
    }

    if (!agreedToTerms) {
      Alert.alert("Terms required", "Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    try {
      setRegisterLoading(true);
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username.trim(),
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
          password,
          accountType: "user",
          gender,
          dateOfBirth: dobDate ? dobDate.toISOString() : undefined,
        }),
      });

      const data = await response.json();
      setRegisterLoading(false);

      if (!response.ok) {
        Alert.alert(
          "Registration failed",
          getErrorMessage(data?.message, "Unable to register.")
        );
        return;
      }

      Alert.alert("Registration Successful", "You can log in now.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      setRegisterLoading(false);
      Alert.alert("Server error", "Unable to complete registration.");
    }
  };

  const selectedGenderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label;

  const pad2 = (n) => String(n).padStart(2, "0");

  const onDobChange = (event, selectedDate) => {
    // On Android the picker closes itself after a pick/dismiss; on iOS it stays open (usually in a modal/spinner)
    if (Platform.OS === "android") {
      setShowDobPicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    const now = new Date();
    let age = now.getFullYear() - selectedDate.getFullYear();
    const hasHadBirthdayThisYear =
      now.getMonth() > selectedDate.getMonth() ||
      (now.getMonth() === selectedDate.getMonth() && now.getDate() >= selectedDate.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

    if (age < 1 || age > 120) {
      Alert.alert("Invalid date", "Please select a valid date of birth.");
      return;
    }

    setDobDate(selectedDate);
    setDob(`${pad2(selectedDate.getDate())}-${pad2(selectedDate.getMonth() + 1)}-${selectedDate.getFullYear()}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Join GOLO Network Group</Text>
          <Text style={styles.subtitle}>Grow Smarter With Every Ad. Join Free.</Text>

          {/* Static social buttons — backend wiring comes later */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGooglePress}>
              <FontAwesome name="google" size={18} color="#EA4335" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookPress}>
              <FontAwesome name="facebook" size={18} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={username}
              placeholder="Enter your full name"
              placeholderTextColor="#a0a0a0"
              onChangeText={setUsername}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailVerified(false);
                setOtpSent(false);
                setOtp("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
              placeholderTextColor="#a0a0a0"
              editable={!emailVerified}
            />
            {emailVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#157a4f" style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* OTP Send Button */}
          {isValidEmail(email) && !emailVerified && !otpSent && (
            <TouchableOpacity
              style={[styles.otpBtn, otpLoading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator size="small" color="#157a4f" />
              ) : (
                <Text style={styles.otpBtnText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          )}

          {/* OTP Input and Verify Button */}
          {otpSent && !emailVerified && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Enter verification code sent to your email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor="#a0a0a0"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.verifyOtpBtn, verifyingOtp && { opacity: 0.7 }]}
                  onPress={handleVerifyOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyOtpBtnText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={otpLoading || timer > 0}
                style={{ alignSelf: "flex-end", marginTop: -6 }}
              >
                <Text style={{ color: (otpLoading || timer > 0) ? "#a0a0a0" : "#157a4f", ...textPresets.label, fontWeight: "600" }}>
                  {timer > 0 ? `Resend Code in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}` : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {emailVerified && (
            <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#157a4f" />
              <Text style={{ color: "#157a4f", ...textPresets.label, fontWeight: "600" }}>Email verified successfully!</Text>
            </View>
          )}

          <Text style={styles.label}>Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              placeholder="Enter your phone number"
              placeholderTextColor="#a0a0a0"
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            activeOpacity={0.7}
            onPress={() => setShowDobPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <Text style={[styles.input, !dob && styles.placeholderText, { top: 2 }]}>
              {dob || "Select date of birth"}
            </Text>
          </TouchableOpacity>

          {showDobPicker && (
            <DateTimePicker
              value={dobDate || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={onDobChange}
            />
          )}

          {Platform.OS === "ios" && showDobPicker && (
            <TouchableOpacity
              style={styles.iosDobDoneButton}
              onPress={() => setShowDobPicker(false)}
            >
              <Text style={styles.iosDobDoneText}>Done</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            activeOpacity={0.7}
            onPress={() => setGenderMenuOpen((open) => !open)}
          >
            <Ionicons name="person-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <Text style={[styles.input, !selectedGenderLabel && styles.placeholderText, { top: 2 }]}>
              {selectedGenderLabel || "Select gender"}
            </Text>
            <Ionicons
              name={genderMenuOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#8a8a8a"
            />
          </TouchableOpacity>

          {genderMenuOpen && (
            <View style={styles.genderMenu}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.genderMenuItem}
                  onPress={() => {
                    setGender(option.value);
                    setGenderMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.genderMenuItemText,
                      gender === option.value && styles.genderMenuItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {gender === option.value && (
                    <Ionicons name="checkmark" size={18} color="#157a4f" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Create Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#8a8a8a" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create password"
              placeholderTextColor="#a0a0a0"
              secureTextEntry={!visiblepass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setvisiblepass(!visiblepass)}>
              <Ionicons name={visiblepass ? "eye-outline" : "eye-off-outline"} size={20} color="#8a8a8a" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.8}
            onPress={() => setAgreedToTerms((prev) => !prev)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={styles.termsText}>
              By clicking on "Continue", I agree to the{" "}
              <Text style={styles.termsLink}>Terms</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>. We ensure your data is
              secure and never shared without your consent.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, registerLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={registerLoading}
          >
            {registerLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="white" />
                <Text style={styles.buttonText}>Please wait...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: width * 0.06,
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    color: "#111111",
    textAlign: "center",
    marginBottom: 6,
    ...textPresets.title
  },
  subtitle: {
    ...textPresets.body,
    color: "#8a8a8a",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: Math.round(14 * 1.5)
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  socialText: {
    ...textPresets.body,
    color: "#333333",
    lineHeight: Math.round(14 * 1.5)
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    ...textPresets.label,
    color: "#a0a0a0",
    letterSpacing: 0.5,
  },
  label: {
    ...textPresets.body,
    color: "#111111",
    marginBottom: 6,
    lineHeight: Math.round(14 * 1.5)
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...textPresets.body,
    color: "#111111",
    top: 3,
  },
  placeholderText: {
    color: "#a0a0a0",
  },
  genderMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: -10,
    marginBottom: 16,
    overflow: "hidden",
  },
  genderMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  genderMenuItemText: {
    ...textPresets.body,
    color: "#333333",
    lineHeight: Math.round(14 * 1.5)
  },
  genderMenuItemTextActive: {
    color: "#157a4f",
  },
  eyeButton: {
    padding: 6,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#c0c0c0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  checkboxChecked: {
    backgroundColor: "#157a4f",
    borderColor: "#157a4f",
  },

  termsText: {
    flex: 1,
    ...textPresets.label,
    color: "#666666",
  },

  termsLink: {
    color: "#157a4f",
  },

  button: {
    backgroundColor: "#157a4f",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#ffffff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginPrompt: {
    ...textPresets.body,
    color: "#555555",
    lineHeight: Math.round(14 * 1.5)
  },
  loginLink: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  otpBtn: {
    alignSelf: "stretch",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#157a4f",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  otpBtnText: {
    color: "#157a4f",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  verifyOtpBtn: {
    backgroundColor: "#157a4f",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyOtpBtnText: {
    color: "#ffffff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
});