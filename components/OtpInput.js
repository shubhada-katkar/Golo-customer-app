import React, { useRef } from "react";
import { View, TextInput, StyleSheet } from "react-native";

export default function OtpInput({ value, onChangeOtp, length = 6, editable = true }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length }, (_, index) => value[index] || "");

  const updateOtp = (nextDigits) => {
    onChangeOtp(nextDigits.join("").slice(0, length));
  };

  const handleChange = (text, index) => {
    const cleanText = text.replace(/\D/g, "");

    if (!cleanText) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateOtp(nextDigits);
      return;
    }

    if (cleanText.length > 1) {
      const nextDigits = [...digits];
      cleanText.slice(0, length - index).split("").forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
      updateOtp(nextDigits);
      const focusIndex = Math.min(index + cleanText.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanText;
    updateOtp(nextDigits);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key !== "Backspace") {
      return;
    }

    if (digits[index]) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateOtp(nextDigits);
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[styles.box, !editable && styles.boxDisabled]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          editable={editable}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    fontSize: 20,
    fontFamily: "SemiBold",
      lineHeight: Math.round(20 * 1.5),
  },
  boxDisabled: {
    backgroundColor: "#f3f4f6",
  },
});