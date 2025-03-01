import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { auth, db, signOut, onAuthStateChanged, doc, getDoc } from "./firebaseConfig";

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ ตรวจสอบว่าผู้ใช้เข้าสู่ระบบอยู่หรือไม่
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        navigation.replace("Login"); // ถ้าไม่ได้เข้าสู่ระบบให้ไปที่หน้า Login
      }
    });

    return unsubscribe;
  }, []);

  // ✅ ฟังก์ชันดึงข้อมูลผู้ใช้จาก Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "Student", uid)); // ดึงข้อมูลจาก Collection `Student`
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        Alert.alert("⚠️ ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในระบบ");
      }
    } catch (error) {
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
    setLoading(false);
  };

  // ✅ ฟังก์ชัน Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("❌ ออกจากระบบไม่สำเร็จ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ข้อมูลส่วนตัว</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : userData ? (
        <>
          <Text style={styles.info}>👤 ชื่อ: {userData.username}</Text>
          <Text style={styles.info}>👤 รหัสนักศึกษา: {userData.studentId}</Text>
          <Text style={styles.info}>📧 อีเมล: {userData.email}</Text>
          <Text style={styles.info}>📞 เบอร์โทร: {userData.phoneNumber}</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.errorText}>❌ ไม่สามารถโหลดข้อมูลผู้ใช้ได้</Text>
      )}
    </View>
  );
};

// ✅ สไตล์ของหน้า Home
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
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  logoutButton: {
    backgroundColor: "#d9534f",
    width: "80%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
};

export default HomeScreen;
