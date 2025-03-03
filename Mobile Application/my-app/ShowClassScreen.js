import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  ImageBackground,
} from "react-native";
import {
  auth,
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
} from "./firebaseConfig";

const { width, height } = Dimensions.get("window");

const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");

  const fetchClasses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("⚠️ กรุณาเข้าสู่ระบบใหม่");
        navigation.replace("Login");
        return;
      }
      setStudentId(user.uid);

      // ดึงรายวิชาจาก Student/{uid}/subjectList
      const studentRef = doc(db, "Student", user.uid);
      const subjectListRef = collection(studentRef, "subjectList");
      const querySnapshot = await getDocs(subjectListRef);

      if (!querySnapshot.empty) {
        const subjects = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setClasses(subjects);
      } else {
        setClasses([]);
      }
    } catch (error) {
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
    const unsubscribe = navigation.addListener("focus", fetchClasses);
    return unsubscribe;
  }, [navigation]);

  // ฟังก์ชันเช็คชื่อ
  const markAttendance = async (classId, remark) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
        return;
      }

      console.log("📌 เริ่มเช็คชื่อสำหรับ classId:", classId, "id:", studentId);

      const studentRef = doc(db, "Student", studentId);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        Alert.alert("❌ ไม่พบข้อมูลนักเรียน");
        return;
      }

      const studentData = studentSnap.data();
      const sid = studentData.studentId || "N/A";
      const username = studentData.username || "ไม่มีชื่อ";

      // ค้นหา checkin ที่ status = "open"
      const checkInRef = collection(db, "classroom", classId, "checkin");
      const checkinCollec = await getDocs(checkInRef);

      if (checkinCollec.empty) {
        Alert.alert("❌ ไม่มีข้อมูลการเช็คชื่อ");
        return;
      }

      for (const docSnap of checkinCollec.docs) {
        const docData = docSnap.data();
        console.log("🔍 เจอ checkin:", docSnap.id, "status:", docData.status);

        if (docData.status === "open") {
          // บันทึกคะแนน/สถานะใน subcollection scores
          const scoresDocRef = doc(
            db,
            "classroom",
            classId,
            "checkin",
            docSnap.id,
            "scores",
            user.uid
          );
          console.log("📌 กำลังบันทึกข้อมูล scores:", user.uid);

          await setDoc(
            scoresDocRef,
            {
              score: 1,
              sid: sid,
              status: 1,
              studentName: username,
              remark: remark, // บันทึกหมายเหตุ
            },
            { merge: true }
          );

          console.log("✅ เช็คชื่อสำเร็จสำหรับ", user.uid);
          Alert.alert("✔️ เช็คชื่อสำเร็จ!");
        }
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
  };

  // ฟังก์ชัน prompt ให้กรอกหมายเหตุ
  const handleAttendance = (classId) => {
    Alert.prompt(
      "กรอกหมายเหตุ",
      "รายละเอียดการเช็คชื่อ มาตรงเวลา หรือมาสาย เพราะอะไร?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ตกลง",
          onPress: (remark) => markAttendance(classId, remark || "ไม่มีหมายเหตุ"),
        },
      ],
      "plain-text"
    );
  };

  return (
    <ImageBackground
      source={{ uri: "https://i.pinimg.com/originals/8d/a9/07/8da9074b5420a96f47a5941e0c317b58.gif" }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>📚 รายวิชาที่เรียน</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : classes.length > 0 ? (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.classItem}>
                {/* แสดงภาพปกของรายวิชา ถ้ามี */}
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.classImage} />
                ) : null}
                <Text style={styles.classText}>📖 {item.name} ({item.code})</Text>
                <Text style={styles.roomText}>📍 ห้อง: {item.room || "ไม่ระบุ"}</Text>
                <TouchableOpacity
                  style={styles.attendanceButton}
                  onPress={() => handleAttendance(item.id)}
                >
                  <Text style={styles.buttonText}>✔️ เช็คชื่อเข้าเรียน</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attendanceButton}
                  onPress={() => {
                    if (item.id) {
                      navigation.navigate("ClassDetail", { cid: item.id });
                    } else {
                      Alert.alert("⚠️ ข้อมูลไม่ถูกต้อง");
                    }
                  }}
                >
                  <Text style={styles.buttonText}>✔️ เข้าห้องเรียน</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noClassText}>❌ ยังไม่มีรายวิชาที่เรียน</Text>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>🔙 ย้อนกลับ</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },
  container: {
    flex: 0.95,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: "rgba(0,0,0,0.3)", // โปร่งใสเล็กน้อยเพื่อให้ข้อความเด่นขึ้น
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff", // ให้ตัวอักษรสีขาวเพื่อให้อ่านง่าย
    marginBottom: 20,
  },
  classItem: {
    backgroundColor: "#F8F8FF",
    padding: 180,
    marginVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  classImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 8,
  },
  classText: {
    color: "#000000",
    fontSize: 18,
  },
  roomText: {
    color: "#000000",
    fontSize: 16,
    marginBottom: 10,
  },
  attendanceButton: {
    backgroundColor: "#28a745",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  backButton: {
    backgroundColor: "#d9534f",
    width: "80%",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  noClassText: {
    fontSize: 18,
    color: "#fff",
    marginTop: 20,
  },
});

export default ShowClassScreen;
