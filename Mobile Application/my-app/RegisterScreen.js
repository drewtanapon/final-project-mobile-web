import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth, db, createUserWithEmailAndPassword, doc, setDoc } from "./firebaseConfig";

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ ฟังก์ชันตรวจสอบรูปแบบเบอร์โทรศัพท์
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(phone);
  };

  // ✅ ฟังก์ชันสมัครสมาชิก
  const handleRegister = async () => {
    if (!username || !email || !password || !phoneNumber || !studentId) {
      Alert.alert("❌ ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      Alert.alert("❌ ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("❌ ข้อผิดพลาด", "กรุณาใส่เบอร์โทรในรูปแบบสากล เช่น +66XXXXXXXXX หรือ +XX...");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const sid = user.uid;

      await setDoc(doc(db, "Student", sid), {
        username,
        email,
        phoneNumber,
        studentId,
        createdAt: new Date(),
      });

      Alert.alert("✅ สมัครสมาชิกสำเร็จ!", "กำลังพาไปหน้า Login...");
      setTimeout(() => navigation.navigate("Login"), 1500);
    } catch (error) {
      Alert.alert("❌ สมัครไม่สำเร็จ", error.message);
    }
    setLoading(false);
  };

  return (
    <ImageBackground
      source={{ uri: "https://i.pinimg.com/originals/76/01/a3/7601a31e47247077856ed69b7b4fa124.gif" }}
      style={styles.background}
    >
      <View style={styles.overlay}>
        

        {/* หัวข้อ สมัครสมาชิก */}
        <Text style={styles.title}>สมัครสมาชิก</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="gray" />
          <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="gray" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Phone Number */}
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

        {/* Student ID */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="book" size={24} color="gray" />
          <TextInput style={styles.input} placeholder="Student ID" value={studentId} onChangeText={setStudentId} />
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>สมัครสมาชิก</Text>}
        </TouchableOpacity>

        {/* กลับไปหน้า Login */}
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>กลับไปหน้าเข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

// ✅ สไตล์ของหน้า Register
const styles = {
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // ทำให้พื้นหลังมืดลง
    paddingHorizontal: 20,
  },
  gifImage: {
    width: 150,
    height: 150,
    marginBottom: 10, // ให้เว้นระยะห่างจากหัวข้อ
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
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
  registerButton: {
    backgroundColor: "#008000",
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
  loginButton: {
    marginTop: 15,
  },
  loginText: {
    fontSize: 16,
    color: "#007bff",
  },
};

export default RegisterScreen;
