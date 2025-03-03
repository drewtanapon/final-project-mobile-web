import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ImageBackground,
} from "react-native";
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
      // ค้นหาชั้นเรียน
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

      // ดึงข้อมูลของนักเรียน
      const studentRef = doc(db, "Student", user.uid);
      const studentSnap = await getDoc(studentRef);
      const studentData = studentSnap.exists() ? studentSnap.data() : {};

      // เพิ่มนักเรียนเข้าสู่ชั้นเรียน
      await setDoc(doc(db, "classroom", classId, "Student", user.uid), {
        sid: studentData.studentId || "-",
        name: studentData.username || user.displayName || "ไม่ระบุชื่อ",
        email: user.email || "",
        phoneNumber: user.phoneNumber,
        joinedAt: serverTimestamp(),
      }, { merge: true });

      // เพิ่ม Subject ID ไปที่ subjectList ของ Student
      const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", classId);
      await setDoc(studentSubjectRef, {
        createdAt: serverTimestamp(),
        email: user.email || "",
        phoneNumber: user.phoneNumber || "-",
        studentId: studentData.studentId || "-",
        username: studentData.username || "-",
      }, { merge: true });

      Alert.alert("สำเร็จ", "เข้าร่วมชั้นเรียนเรียบร้อย!");
      setClassCode("");

      navigation.navigate("ShowClass");
    } catch (error) {
      console.error("❌ Error joining class:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเข้าร่วมชั้นเรียนได้");
    }
  };

  return (
    <ImageBackground
      source={{ uri: "https://i.pinimg.com/originals/52/64/6d/52646df3a26cd5696a1187b36b6fb095.gif" }}
      style={styles.background}
      resizeMode="cover"
    >
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // ทำให้เนื้อหาอ่านง่ายขึ้น
    borderRadius: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00000",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    fontSize: 20,
    width: "100%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 15,
  },
});

