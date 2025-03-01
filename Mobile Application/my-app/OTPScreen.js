// OTPScreen.js
import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { MaterialIcons } from "@expo/vector-icons";
import { 
  auth,
  firebaseConfig,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  db,
  // ส่วนที่เกี่ยวกับ Firestore
  collection,
  query,
  where,
  getDocs
} from "./firebaseConfig";

const OTPScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  // สร้าง ref สำหรับ RecaptchaVerifier
  const recaptchaVerifier = useRef(null);

  // ฟังก์ชันตรวจสอบเบอร์ใน Firestore (ตามที่คุณใช้งาน)
  const checkPhoneNumberExists = async (phone) => {
    try {
      const usersRef = collection(db, "Student");
      const q = query(usersRef, where("phoneNumber", "==", phone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone.startsWith("+")) {
      Alert.alert("⚠️ รูปแบบเบอร์ไม่ถูกต้อง", "กรุณาใช้ +66XXXXXXXXX");
      return null;
    }
    return phone;
  };

  // ฟังก์ชันส่ง OTP โดยใช้ recaptchaVerifier
  const sendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) return;

    setLoading(true);

    try {
      // (ถ้าต้องการตรวจสอบเบอร์ใน Firestore ก่อน)
      const phoneExists = await checkPhoneNumberExists(formattedPhone);
      if (!phoneExists) {
        Alert.alert("❌ เบอร์นี้ยังไม่ได้สมัครสมาชิก", "กรุณาสมัครสมาชิกก่อน");
        setLoading(false);
        return;
      }

      // ส่ง OTP โดยส่ง recaptchaVerifier.current เป็นพารามิเตอร์ที่ 3
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setVerificationId(confirmation.verificationId);
      Alert.alert("✅ OTP ถูกส่งแล้ว", "โปรดตรวจสอบข้อความในโทรศัพท์ของคุณ");
    } catch (error) {
      console.error("OTP Error:", error);
      Alert.alert("❌ ส่ง OTP ไม่สำเร็จ", error.message);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!verificationCode) {
      Alert.alert("⚠️ กรุณากรอกรหัส OTP");
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      Alert.alert("✅ ล็อกอินสำเร็จ!", "คุณเข้าสู่ระบบด้วย OTP แล้ว");
      navigation.replace("Home");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      Alert.alert("❌ OTP ไม่ถูกต้อง", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบด้วย OTP</Text>

      {/* เพิ่ม Recaptcha Modal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        // optional: คุณสามารถกำหนดเพิ่มเติม เช่น timeout, attemptInvisibleVerification: true
      />

      <View style={styles.inputContainer}>
        <MaterialIcons name="phone" size={24} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Phone Number (+66...)"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <TouchableOpacity style={styles.sendOTPButton} onPress={sendOTP} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ส่ง OTP</Text>}
      </TouchableOpacity>

      {verificationId && (
        <>
          <View style={styles.inputContainer}>
            <MaterialIcons name="vpn-key" size={24} color="gray" />
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
          </View>

          <TouchableOpacity style={styles.verifyOTPButton} onPress={verifyOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ยืนยัน OTP</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  sendOTPButton: {
    backgroundColor: "#007bff",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  verifyOTPButton: {
    backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
};

export default OTPScreen;
