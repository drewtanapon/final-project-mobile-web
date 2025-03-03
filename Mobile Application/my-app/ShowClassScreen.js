import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image } from "react-native";
import { auth, db, collection, doc, getDocs, getDoc, updateDoc, setDoc , createCheckin} from "./firebaseConfig";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

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
      const studentRef = doc(db, "Student", user.uid);
      const subjectListRef = collection(studentRef, "subjectList");
      const querySnapshot = await getDocs(subjectListRef);

      

      if (!querySnapshot.empty) {
        const subjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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

  const markAttendance = async (classId, remark) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
            return;
        }

        // ✅ ดึงข้อมูลของนักเรียนจาก Firestore ตาม UID
        const studentRef = doc(db, "Student", user.uid);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
            Alert.alert("❌ ไม่พบข้อมูลนักเรียน");
            return;
        }

        const studentData = studentSnap.data();
        const sid = studentData.studentId || "N/A";  // ✅ ดึงค่า studentId อัตโนมัติ
        const username = studentData.username || "ไม่มีชื่อ";  // ✅ ดึงชื่ออัตโนมัติ

        // ✅ ดึงเวลาปัจจุบันของนักเรียน
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = now.toLocaleTimeString("en-GB", { hour12: false }); // HH:mm:ss
        const timestamp = now.getTime(); // ✅ แปลงเป็น timestamp (milliseconds)

        console.log("📌 เวลาที่ส่งไป Firestore:", dateStr, timeStr, timestamp);

        // ✅ โหลด checkin ที่กำลังเปิดอยู่
        const checkInRef = collection(db, "classroom", classId, "checkin");
        const checkinCollec = await getDocs(checkInRef);

        if (checkinCollec.empty) {
            Alert.alert("❌ ไม่มีข้อมูลการเช็คชื่อ");
            return;
        }

        for (const docSnap of checkinCollec.docs) {
            const docData = docSnap.data();

            if (docData.status === 1) { // ✅ เฉพาะ checkin ที่เปิดอยู่
                const studentDocRef = doc(
                    db,
                    "classroom", classId,
                    "checkin", docSnap.id,
                    "students", user.uid
                );

                await setDoc(studentDocRef, {
                    studentId: sid, // ✅ ไม่ fix ค่า
                    username: username, // ✅ ไม่ fix ค่า
                    date: dateStr,
                    time: timeStr,
                    timestamp: timestamp, // ✅ ส่ง timestamp ไปด้วย
                    remark: remark || "ไม่มีหมายเหตุ"
                }, { merge: true });

                console.log("✅ เช็คชื่อสำเร็จสำหรับ", user.uid);
                Alert.alert("✔️ เช็คชื่อสำเร็จ!");
            }
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาด:", error);
        Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
};
  
  const handleAttendance = (classId) => {
    Alert.prompt(
      "กรอกหมายเหตุ",
      "รายละเอียดการเช็คชื่อ มาตรงเวลา หรือมาสาย เพราะอะไร?",
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        {
          text: "ตกลง",
          onPress: (remark) => markAttendance(classId, remark || "ไม่มีหมายเหตุ")
        }
      ],
      "plain-text"
    );
  };
  return (
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
              <Image source={{ uri: item.photo }} style={styles.classImage} />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.95,
    justifyContent: "flex-start",  // ปรับให้เริ่มจากด้านบน
    alignItems: "center", // จัดกลางในแนวนอน
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 20,
    paddingTop: 80, // เพิ่มระยะห่างจากด้านบน
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  classItem: {
    backgroundColor: "#007bff",
    padding: 18,
    marginVertical: 15, 
    borderRadius: 10,
    width: "90%", 
    alignItems: "center",
    alignSelf: "center",  // ✅ บังคับให้อยู่ตรงกลางแนวนอน
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  classText: {
    color: "#fff",
    fontSize: 18,
  },
  refreshButton: {
    backgroundColor: "#17a2b8",
    width: "80%",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
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
    position: 'absolute',
    bottom: 20,
  },
  noClassText: {
    fontSize: 18,
    color: "gray",
    marginTop: 20,
  },
});

export default ShowClassScreen;
