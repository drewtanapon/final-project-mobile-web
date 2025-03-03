import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image, TextInput } from "react-native";
import { auth, db, collection, doc, getDocs, getDoc, setDoc } from "./firebaseConfig";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);

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

        if (querySnapshot.empty) {
            setClasses([]);
            return;
        }

        // 1️⃣ ดึงรายการ classId ของวิชาที่นักเรียนเข้าร่วม
        const classIds = querySnapshot.docs.map(doc => doc.id);

        // 2️⃣ ดึงข้อมูลวิชาจาก classroom ตาม classIds
        const classPromises = classIds.map(async (classId) => {
            const classRef = doc(db, "classroom", classId);
            const classSnap = await getDoc(classRef);
            
            if (classSnap.exists()) {
                return { id: classId, ...classSnap.data().info }; // ✅ ดึง info ที่มี code และ room
            }
            return null;
        });

        // 3️⃣ รวบรวมข้อมูลวิชา
        const classData = (await Promise.all(classPromises)).filter(Boolean);
        setClasses(classData);

    } catch (error) {
        Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
    setLoading(false);
};


  useEffect(() => {
    fetchClasses();
    checkCheckinStatus();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchClasses();
      checkCheckinStatus();
    });
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

        // ✅ ขอให้ผู้ใช้กรอกรหัสเช็คชื่อ (Check-in Code)
        Alert.prompt(
            "กรอกรหัสเช็คชื่อ",
            "โปรดกรอกรหัสที่อาจารย์ให้มาก่อนกดเช็คชื่อ",
            [
                {
                    text: "ยกเลิก",
                    style: "cancel",
                },
                {
                    text: "ตกลง",
                    onPress: async (inputCode) => {
                        if (!inputCode) {
                            Alert.alert("⚠️ กรุณากรอกรหัสเช็คชื่อ");
                            return;
                        }

                        console.log("📌 Check-in Code ที่นักเรียนกรอก:", inputCode);

                        // ✅ ดึงข้อมูลนักเรียนจาก Firestore
                        const studentRef = doc(db, "Student", user.uid);
                        const studentSnap = await getDoc(studentRef);

                        if (!studentSnap.exists()) {
                            Alert.alert("❌ ไม่พบข้อมูลนักเรียน");
                            return;
                        }

                        const studentData = studentSnap.data();
                        const sid = studentData.studentId || "N/A";
                        const username = studentData.username || "ไม่มีชื่อ";

                        // ✅ โหลด checkin ที่เปิดอยู่ และตรวจสอบรหัส
                        const checkInRef = collection(db, "classroom", classId, "checkin");
                        const checkinCollec = await getDocs(checkInRef);

                        if (checkinCollec.empty) {
                            Alert.alert("❌ ไม่มีข้อมูลการเช็คชื่อ");
                            return;
                        }

                        let checkinMatched = false;

                        for (const docSnap of checkinCollec.docs) {
                            const docData = docSnap.data();

                            if (docData.status === 1 && docData.checkinCode === inputCode) {
                                checkinMatched = true;

                                const now = new Date();
                                const dateStr = now.toISOString().split("T")[0];
                                const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });
                                const timestamp = now.getTime();

                                console.log("📌 เวลาที่ส่งไป Firestore:", dateStr, timeStr, timestamp);

                                // ✅ บันทึกข้อมูลลง Firestore
                                const studentDocRef = doc(
                                    db,
                                    "classroom", classId,
                                    "checkin", docSnap.id,
                                    "students", user.uid
                                );

                                await setDoc(studentDocRef, {
                                    studentId: sid,
                                    username: username,
                                    date: dateStr,
                                    time: timeStr,
                                    timestamp: timestamp,
                                    remark: remark || "ไม่มีหมายเหตุ",
                                }, { merge: true });

                                console.log("✅ เช็คชื่อสำเร็จสำหรับ", user.uid);
                                Alert.alert("✔️ เช็คชื่อสำเร็จ!");
                                break; // หยุด loop ทันทีหลังจากเช็คชื่อสำเร็จ
                            }
                        }

                        if (!checkinMatched) {
                            Alert.alert("❌ รหัสเช็คชื่อไม่ถูกต้อง หรือเช็คชื่อปิดแล้ว");
                        }
                    },
                },
            ],
            "plain-text"
        );
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
};

const checkCheckinStatus = async () => {
  try {
    const classId = "your_class_id_here"; // ⚠️ ต้องเปลี่ยนเป็น classId จริง ๆ
    const checkInRef = collection(db, "classroom", classId, "checkin");
    const checkinCollec = await getDocs(checkInRef);

    let checkinOpen = false;

    checkinCollec.forEach((docSnap) => {
      const docData = docSnap.data();
      if (docData.status === 1) {
        checkinOpen = true;
      }
    });

    setIsCheckinOpen(checkinOpen);
  } catch (error) {
    console.error("❌ ตรวจสอบสถานะเช็คชื่อผิดพลาด:", error);
  }
};


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
            <Text style={styles.classText}>📖 {item.name} ({item.code})</Text>
            <Text style={styles.roomText}>📍 ห้อง: {item.room || "ไม่ระบุ"}</Text>
            <TouchableOpacity
                style={styles.attendanceButton}
                onPress={() => handleAttendance(item.id)}
            >
                <Text style={styles.buttonText}>✔️ เช็คชื่อเข้าเรียน</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attendanceButton}x  
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
