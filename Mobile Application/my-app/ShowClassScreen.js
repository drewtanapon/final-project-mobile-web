import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image } from "react-native";
import { auth, db, collection, doc, getDocs} from "./firebaseConfig"; // ✅ นำเข้า getDocs



const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("⚠️ กรุณาเข้าสู่ระบบใหม่");
          navigation.replace("Login");
          return;
        }

        // ✅ อ้างอิงไปที่ Collection `subjectList` ที่อยู่ภายใต้ Student/{userId}
        const studentRef = doc(db, "Student", user.uid);
        const subjectListRef = collection(studentRef, "subjectList"); // ✅ ใช้ collection() แทน doc()
        const querySnapshot = await getDocs(subjectListRef); // ✅ ใช้ getDocs() อ่าน Collection

        if (!querySnapshot.empty) {
          const subjects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClasses(subjects);
        } else {
          setClasses([]); // ถ้าไม่มีรายวิชา
        }
      } catch (error) {
        Alert.alert("❌ ข้อผิดพลาด", error.message);
      }
      setLoading(false);
    };

    fetchClasses();
  }, []);


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

              {/* ปุ่มเช็คชื่อเข้าเรียน */}
              <TouchableOpacity
                style={styles.attendanceButton}
                onPress={() => {
                  if (item.id) {
                    // ส่งรหัสวิชา `cid` ไปที่ `JoinClass`
                    navigation.navigate("JoinClass", { cid: item.id });
                  } else {
                    Alert.alert("⚠️ ข้อมูลไม่ถูกต้อง", "ไม่พบรหัสวิชา");
                  }
                }}
              >
                <Text style={styles.buttonText}>✔️ เช็คชื่อเข้าเรียน</Text>
              </TouchableOpacity>

            </View>
          )}
        />
      ) : (
        <Text style={styles.noClassText}>❌ ยังไม่มีรายวิชาที่เรียน</Text>
      )}

      {/* ปุ่มย้อนกลับ */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>🔙 ย้อนกลับ</Text>
      </TouchableOpacity>
    </View>
  );
};

// ✅ สไตล์ของหน้า ShowClass
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
  classListContainer: {
    flexGrow: 1,  // เพิ่มให้มันขยายเต็มพื้นที่
    justifyContent: 'flex-start',  // ให้รายการเริ่มจากด้านบน
    alignItems: 'center', // จัดรายการทั้งหมดให้อยู่ตรงกลางในแนวนอน
    width: "100%", // กำหนดความกว้างให้เต็มหน้าจอ
    paddingBottom: 100,  // เพิ่มพื้นที่ด้านล่างเล็กน้อยเพื่อให้ปุ่มไม่ชน
  },
  classItem: {
    backgroundColor: "#007bff",
    padding: 18,
    marginVertical: 15, // เพิ่มระยะห่างระหว่างรายวิชา
    borderRadius: 10,
    width: "90%", // กำหนดความกว้างให้แคบกว่าหน้าจอ
    alignItems: "center", // จัดเนื้อหาทุกอย่างให้ตรงกลางในแกน X
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // สำหรับ Android
  },
  classText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  attendanceButton: {
    backgroundColor: "#28a745",  // สีเขียวสำหรับปุ่มเช็คชื่อ
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  noClassText: {
    fontSize: 18,
    color: "gray",
    marginTop: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#d9534f",
    width: "80%",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
    position: 'absolute',
    bottom: 20,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default ShowClassScreen;
