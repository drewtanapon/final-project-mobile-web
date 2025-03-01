import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth, db } from "./firebaseConfig";
import { signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


const LinkPhoneScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const recaptchaVerifier = useRef(null);

  const checkUserPhoneNumberMatches = async (enteredPhone) => {
    const user = auth.currentUser;
    if (!user) return false;
  
    try {
      const userDocRef = doc(db, "Student", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data().phoneNumber === enteredPhone;
      } else {
        return false;
      }
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

    const isMatch = await checkUserPhoneNumberMatches(phoneNumber);
    if (!isMatch) {
      Alert.alert("❌ เบอร์ไม่ตรงกับข้อมูลในระบบ");
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
  };

  const verifyAndLink = async () => {
    if (!verificationId || !otpCode) {
      Alert.alert("กรุณากรอก OTP ให้ครบถ้วน");
      return;
    }

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
  };

  return (
    <View style={{ padding: 20 }}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={{ 
        apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
        authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
        projectId: "webmobileapplication-cdaaf",
        storageBucket: "webmobileapplication-cdaaf.appspot.com",
        messagingSenderId: "90430005457",
        appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
        measurementId: "G-J886NPRZWK"
       }} />

      <Text>กรอกเบอร์โทร (+66...)</Text>
      <TextInput value={phoneNumber} onChangeText={setPhoneNumber} />

      <TouchableOpacity onPress={sendOTP}>
        <Text>ขอ OTP</Text>
      </TouchableOpacity>

      {verificationId && (
        <>
          <Text>กรอก OTP</Text>
          <TextInput value={otpCode} onChangeText={setOtpCode} />
          <TouchableOpacity onPress={verifyAndLink}>
            <Text>ยืนยัน OTP และ Link</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default LinkPhoneScreen;
