import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { auth, db } from "./firebaseConfig"; 
import { collection, doc, setDoc, query, getDocs, getDoc, serverTimestamp } from "firebase/firestore";

export default function JoinClassByCode({ navigation }) {
  const [classCode, setClassCode] = useState("");

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสวิชา");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("ข้อผิดพลาด", "กรุณาล็อกอินก่อนเข้าร่วมชั้นเรียน");
      return;
    }

    try {
      // 1) ค้นหาชั้นเรียนที่มี info.code ตรงกับ classCode
      const q = query(collection(db, "classroom"));
      const querySnapshot = await getDocs(q);

      let classId = "";
      querySnapshot.forEach((docSnap) => {
        const classData = docSnap.data();
        if (classData.info && classData.info.code === classCode) {
          classId = docSnap.id;
        }
      });

      if (!classId) {
        Alert.alert("ไม่พบชั้นเรียน", `ไม่พบชั้นเรียนที่มีรหัส: ${classCode}`);
        return;
      }

      // 2) ดึงข้อมูลของนักเรียน
      const studentRef = doc(db, "Student", user.uid);
      const studentSnap = await getDoc(studentRef);
      const studentData = studentSnap.exists() ? studentSnap.data() : {};

      // 3) เพิ่มนักเรียนเข้าสู่ชั้นเรียน
      await setDoc(doc(db, "classroom", classId, "Student", user.uid), {
        sid: studentData.studentId || "-",
        name: studentData.username || user.displayName || "ไม่ระบุชื่อ",
        email: user.email || "",
        phoneNumber: user.phoneNumber,
        joinedAt: serverTimestamp(),
      }, { merge: true });

      // 4) ✅ เพิ่ม Subject ID ไปที่ subjectList ของ Student
      const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", classId);
      await setDoc(studentSubjectRef, {
        createdAt: serverTimestamp(),
        email: user.email || "",
        phoneNumber: user.phoneNumber || "-",
        studentId: studentData.studentId || "-",
        username: studentData.username || "-",
      }, { merge: true }); // ✅ ใช้ merge เพื่อไม่ให้ข้อมูลเก่าหายไป

      Alert.alert("สำเร็จ", "เข้าร่วมชั้นเรียนเรียบร้อย!");
      setClassCode(""); // ล้างค่า

      // ✅ กลับไปที่หน้า ShowClass เพื่อดูชั้นเรียนที่เพิ่มใหม่
      navigation.navigate("ShowClass");
    } catch (error) {
      console.error("❌ Error joining class:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเข้าร่วมชั้นเรียนได้");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เข้าร่วมชั้นเรียน</Text>
      <TextInput
        style={styles.input}
        placeholder="กรอกรหัสวิชา (info.code)"
        value={classCode}
        onChangeText={setClassCode}
      />
      <Button title="เข้าร่วม" onPress={handleJoinClass} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // สีพื้นหลังโทนอ่อน
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007bff", // สีน้ำเงินสดใส
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // เงาใน Android
    marginBottom: 15,
  },
  input: {
    fontSize: 18,
    width: "100%",
    color: "#333",
  },
  joinButton: {
    backgroundColor: "#28a745", // สีเขียวสด
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: "100%",
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  backButton: {
    backgroundColor: "#dc3545", // สีแดง
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: "100%",
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});