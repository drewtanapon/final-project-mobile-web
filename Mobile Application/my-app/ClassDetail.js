import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { Image } from "react-native";

const ClassDetail = ({ navigation, route }) => {
  const { cid } = route.params || {};
  const [cno, setCno] = useState(null);
  const [qid, setQid] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [remark, setRemark] = useState("");
  const [questionShow, setQuestionShow] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  // เมื่อ mount หรือ cid เปลี่ยน
  useEffect(() => {
    if (cid) {
      fetchClassData(cid);
      fetchLastCheckin(cid);
      fetchQuestionId(cid);
    } else {
      loadStoredData();
    }
  }, [cid]);

  // ฟังก์ชันดึง ID คำถามล่าสุด
  const fetchQuestionId = async (classId) => {
    try {
      const questionCollectionRef = collection(db, `classroom/${classId}/question`);
      const qQuestion = query(questionCollectionRef, orderBy("question_no", "desc"), limit(1));
      const querySnapshot = await getDocs(qQuestion);
      if (!querySnapshot.empty) {
        const latestQuestionDoc = querySnapshot.docs[0];
        setQid(latestQuestionDoc.id);
      } else {
        setQid(null);
      }
    } catch (error) {
      console.error("❌ Error fetching question ID:", error);
    }
  };

  // subscribe เพื่อฟังการเปลี่ยนแปลง question_show, question_text
  useEffect(() => {
    if (cid && qid) {
      const questionRef = doc(db, `classroom/${cid}/question/${qid}`);
      const unsubscribe = onSnapshot(questionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setQuestionShow(data.question_show || false);
          setQuestionText(data.question_text || "");
        }
      });
      return () => unsubscribe();
    }
  }, [qid]);

  // ฟังก์ชันดึงข้อมูลวิชา
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

  // ฟังก์ชันดึง check-in ล่าสุด
  const fetchLastCheckin = async (classId) => {
    try {
      const checkinRef = collection(db, `classroom/${classId}/checkin`);
      const qCheckin = query(checkinRef, orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(qCheckin);
      if (!querySnapshot.empty) {
        const lastCheckin = querySnapshot.docs[0].id;
        setCno(lastCheckin);
        storeData(classId, lastCheckin);
      }
    } catch (error) {
      console.error("Error fetching check-in:", error);
    }
  };

  // บันทึกข้อมูล class ลง AsyncStorage
  const storeData = async (classId, checkinNo) => {
    try {
      await AsyncStorage.setItem("classInfo", JSON.stringify({ classId, checkinNo }));
    } catch (error) {
      console.error("Error storing class info:", error);
    }
  };

  // โหลดข้อมูลจาก AsyncStorage ถ้าไม่มี cid
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

  // ฟังก์ชันบันทึกหมายเหตุ
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

  // ฟังก์ชันส่งคำตอบ
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
    <ImageBackground
      source={{ uri: "https://i.pinimg.com/736x/b5/13/e5/b513e52cca72cb94d0de9944c20baba8.jpg" }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <>
            <Text style={styles.title}>
            เข้าห้องเรียน
            <Image
              source={{ uri: "https://i.pinimg.com/originals/73/69/6e/73696e022df7cd5cb3d999c6875361dd.gif" }}
              style={styles.icon}
            />
            </Text>
            <Text style={styles.courseText}>📚 รหัสวิชา: {cid}</Text>
            <Text style={styles.courseText}>📖 ชื่อวิชา: {courseName}</Text>

            <Text style={styles.label}>📌 หมายเหตุ</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกหมายเหตุ"
              value={remark}
              onChangeText={setRemark}
            />
            <TouchableOpacity style={styles.button} onPress={handleSaveRemark}>
              <Text style={styles.buttonText}>บันทึกหมายเหตุ</Text>
            </TouchableOpacity>

            {questionShow && (
              <>
                <Text style={styles.courseText}>📖 คำถาม: {questionText}</Text>
                <Text style={styles.label}>✍️ ตอบคำถาม</Text>
                <TextInput
                  style={styles.input}
                  placeholder="พิมพ์คำตอบของคุณ"
                  value={answer}
                  onChangeText={setAnswer}
                />
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
    </ImageBackground>
  );
};

const styles = {
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.52)", // โปร่งใสเพื่อเห็นพื้นหลัง
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  courseText: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 20
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  exitButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  icon: {
    width: 40,  // ปรับขนาดกว้าง
    height: 40, // ปรับขนาดสูง
    marginLeft: 10, // เว้นระยะห่างจากข้อความ
  },
};

export default ClassDetail;
