import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

const ClassDetail = ({ navigation, route }) => {
    const { cid } = route.params || {};
    const [cno, setCno] = useState(null);
    const [qid, setQid] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [remark, setRemark] = useState("");
    const [questionShow, setQuestionShow] = useState(false);
    const [questionText, setQuestionText] = useState(""); // ✅ เพิ่มตัวแปรเก็บคำถาม
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);
  
    const uid = auth.currentUser?.uid; // UID ของผู้ใช้
  
    useEffect(() => {
      if (cid) {
        fetchClassData(cid);
        fetchLastCheckin(cid);
        fetchQuestionId(cid); // ✅ ดึง ID ของคำถามล่าสุด
      } else {
        loadStoredData();
      }
    }, [cid]);
  
    // ✅ ฟังก์ชันดึง `qid` ล่าสุด
    const fetchQuestionId = async (classId) => {
      try {
        const questionCollectionRef = collection(db, `classroom/${classId}/question`);
        const q = query(questionCollectionRef, orderBy("question_no", "desc"), limit(1)); // ✅ ดึงคำถามล่าสุด
  
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const latestQuestionDoc = querySnapshot.docs[0];
          setQid(latestQuestionDoc.id);
          console.log("✅ Latest question ID:", latestQuestionDoc.id);
        } else {
          setQid(null);
          console.warn("⚠️ No question found!");
        }
      } catch (error) {
        console.error("❌ Error fetching question ID:", error);
      }
    };
  
    // ✅ ฟังก์ชันติดตาม `question_show`
    useEffect(() => {
      if (cid && qid) {
        console.log(`📡 Subscribing to question_show: classroom/${cid}/question/${qid}`);
        const questionRef = doc(db, `classroom/${cid}/question/${qid}`);
  
        const unsubscribe = onSnapshot(questionRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            console.log("📢 question_show:", data.question_show);
            setQuestionShow(data.question_show || false);
            setQuestionText(data.question_text || ""); // ✅ เพิ่มดึงคำถาม
          } else {
            console.warn("⚠️ No question data found!");
          }
        });
  
        return () => unsubscribe();
      }
    }, [qid]);
  
    const fetchClassData = async (classId) => {
      try {
        const classRef = doc(db, "classroom", classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          setCourseName(classSnap.data().info?.name || "ไม่ระบุชื่อวิชา");
        } else {
          Alert.alert("⚠️ ไม่พบข้อมูลวิชา");
        }
      } catch (error) {
        Alert.alert("❌ ข้อผิดพลาด", error.message);
      }
      setLoading(false);
    };
  
    const fetchLastCheckin = async (classId) => {
      try {
        const checkinRef = collection(db, `classroom/${classId}/checkin`);
        const q = query(checkinRef, orderBy("timestamp", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const lastCheckin = querySnapshot.docs[0].id;
          console.log("✅ Latest check-in ID:", lastCheckin);
          setCno(lastCheckin);
          storeData(classId, lastCheckin);
        }
      } catch (error) {
        console.error("Error fetching check-in:", error);
      }
    };
  
    const storeData = async (classId, checkinNo) => {
      try {
        await AsyncStorage.setItem("classInfo", JSON.stringify({ classId, checkinNo }));
      } catch (error) {
        console.error("Error storing class info:", error);
      }
    };

  const loadStoredData = async () => {
    try {
      const value = await AsyncStorage.getItem("classInfo");
      if (value) {
        const { classId, checkinNo } = JSON.parse(value);
        setCno(checkinNo);
        fetchClassData(classId);
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  };


  const handleSaveRemark = async () => {
    if (!remark) return Alert.alert("กรุณากรอกหมายเหตุ");

    try {
      const remarkRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${uid}`);
      await setDoc(remarkRef, { remark }, { merge: true });
      Alert.alert("✅ บันทึกหมายเหตุสำเร็จ!");
    } catch (error) {
      Alert.alert("❌ บันทึกไม่สำเร็จ", error.message);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer) return Alert.alert("กรุณากรอกคำตอบ");

    try {
      const answerRef = doc(db, `classroom/${cid}/question/${qid}/answers/${uid}`);
      await setDoc(answerRef, { text: answer, timestamp: new Date() }, { merge: true });
      Alert.alert("✅ ส่งคำตอบสำเร็จ!");
    } catch (error) {
      Alert.alert("❌ ส่งคำตอบไม่สำเร็จ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color="#007bff" /> : (
        <>
          <Text style={styles.title}>เข้าห้องเรียน</Text>
          <Text style={styles.courseText}>📚 รหัสวิชา: {cid}</Text>
          <Text style={styles.courseText}>📖 ชื่อวิชา: {courseName}</Text>

          <Text style={styles.label}>📌 หมายเหตุ</Text>
          <TextInput style={styles.input} placeholder="กรอกหมายเหตุ" value={remark} onChangeText={setRemark} />
          <TouchableOpacity style={styles.button} onPress={handleSaveRemark}>
            <Text style={styles.buttonText}>บันทึกหมายเหตุ</Text>
          </TouchableOpacity>

          {questionShow && (
            <>
              <Text style={styles.courseText}>📖 ชื่อวิชา: {questionText}</Text>
              <Text style={styles.label}>✍️ ตอบคำถาม</Text>
              <TextInput style={styles.input} placeholder="พิมพ์คำตอบของคุณ" value={answer} onChangeText={setAnswer} />
              <TouchableOpacity style={styles.button} onPress={handleSubmitAnswer}>
                <Text style={styles.buttonText}>ส่งคำตอบ</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.exitButton} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = {
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f4f4f4" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  courseText: { fontSize: 18, marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { backgroundColor: "#fff", width: "100%", padding: 10, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, width: "100%", alignItems: "center", marginTop: 10 },
  exitButton: { backgroundColor: "#dc3545", padding: 12, borderRadius: 8, width: "100%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
};

export default ClassDetail;
