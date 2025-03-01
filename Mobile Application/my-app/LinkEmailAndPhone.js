import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth, db } from "./firebaseConfig";
import { signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";

const LinkPhoneScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef(null);

  const checkUserPhoneNumberMatches = async (enteredPhone) => {
    const user = auth.currentUser;
    if (!user) return false;
  
    try {
      const userDocRef = doc(db, "Student", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() && userDocSnap.data().phoneNumber === enteredPhone;
    } catch (error) {
      console.error("Error checking user phone number:", error);
      return false;
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber.startsWith("+66")) {
      Alert.alert("❌ เบอร์โทรต้องอยู่ในรูปแบบสากล (+66)");
      return;
    }

    setLoading(true);
    const isMatch = await checkUserPhoneNumberMatches(phoneNumber);
    if (!isMatch) {
      Alert.alert("❌ เบอร์ไม่ตรงกับข้อมูลในระบบ");
      setLoading(false);
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setVerificationId(confirmation.verificationId);
      Alert.alert("✅ OTP ถูกส่งแล้ว!");
    } catch (error) {
      console.error("OTP Error:", error);
      Alert.alert("❌ ส่ง OTP ไม่สำเร็จ", error.message);
    }
    setLoading(false);
  };

  const verifyAndLink = async () => {
    if (!verificationId || !otpCode) {
      Alert.alert("กรุณากรอก OTP ให้ครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const user = auth.currentUser;
      await linkWithCredential(user, credential);
      await auth.currentUser.reload();
      Alert.alert("✅ ผูกเบอร์โทรสำเร็จ!");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("❌ ผูกเบอร์โทรไม่สำเร็จ", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal 
        ref={recaptchaVerifier}
        firebaseConfig={{
          apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
          authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
          projectId: "webmobileapplication-cdaaf",
          storageBucket: "webmobileapplication-cdaaf.appspot.com",
          messagingSenderId: "90430005457",
          appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
          measurementId: "G-J886NPRZWK"
        }}
      />

      <Text style={styles.title}>🔗 ผูกเบอร์โทรศัพท์</Text>

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

      <TouchableOpacity style={styles.button} onPress={sendOTP} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📩 ขอ OTP</Text>}
      </TouchableOpacity>

      {verificationId && (
        <>
          <View style={styles.inputContainer}>
            <MaterialIcons name="vpn-key" size={24} color="gray" />
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={setOtpCode}
            />
          </View>

          <TouchableOpacity style={styles.buttonVerify} onPress={verifyAndLink} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>✅ ยืนยัน OTP และ Link</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// ✅ ปรับปรุง UI/UX ด้วยสไตล์ที่ดีกว่า
const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    elevation: 3,
  },
  buttonVerify: {
    backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
};

export default LinkPhoneScreen;
