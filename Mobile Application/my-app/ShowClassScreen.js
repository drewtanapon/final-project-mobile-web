import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image } from "react-native";
import { auth, db, collection, doc, getDocs, getDoc, updateDoc, setDoc , createCheckin} from "./firebaseConfig";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");

  
  useEffect(() => {
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

    fetchClasses();
  }, []);

  const markAttendance = async (classId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
        return;
      }
  
      console.log("📌 เริ่มเช็คชื่อสำหรับ classId:", classId, "id:", studentId);
  
      // ดึงข้อมูลนักเรียน
      const studentRef = doc(db, "Student", studentId);
      const studentSnap = await getDoc(studentRef);
  
      if (!studentSnap.exists()) {
        Alert.alert("❌ ไม่พบข้อมูลนักเรียน");
        return;
      }
  
      const studentData = studentSnap.data();
      const sid = studentData.studentId || "N/A"; // ใช้ค่าเริ่มต้นหากไม่มีข้อมูล
      const username = studentData.username || "ไม่มีชื่อ";
  
      // ค้นหา checkin ที่เปิดอยู่
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
          const scoresDocRef = doc(db, "classroom", classId, "checkin", docSnap.id, "scores", user.uid);
          
          console.log("📌 กำลังบันทึกข้อมูล scores:", user.uid);
  
          try {
            await setDoc(scoresDocRef, {
              score: 1,
              sid: sid,
              status: 1,
              studentName: username,
            }, { merge: true });
  
            console.log("✅ เช็คชื่อสำเร็จสำหรับ", user.uid);
            Alert.alert("✔️ เช็คชื่อสำเร็จ!");
          } catch (error) {
            console.error("❌ ผิดพลาดในการอัปเดต:", error);
            Alert.alert("❌ อัปเดตข้อมูลล้มเหลว", error.message);
          }
        }
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
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
              <Text style={styles.classText}>📖 {item.name} ({item.code}) {item.id}</Text>
              <Text style={styles.roomText}>📍 ห้อง: {item.room || "ไม่ระบุ"}</Text>
              <TouchableOpacity
                style={styles.attendanceButton}
                onPress={() => {
                  markAttendance(item.id);
                }}
              >
                <Text style={styles.buttonText} >✔️ เช็คชื่อเข้าเรียน</Text>
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
