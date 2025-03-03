import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Button, Alert, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar, Dimensions, ScrollView, TextInput } from "react-native";
import { auth, db, signOut, onAuthStateChanged, doc, getDoc, collection, setDoc, } from "./firebaseConfig";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [joinedClass, setJoinedClass] = useState(null);     

  // ✅ ตรวจสอบว่าผู้ใช้เข้าสู่ระบบอยู่หรือไม่
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
        await fetchRegisteredClasses(user.uid);
        await fetchClassNames();
      } else {
        navigation.replace("Login"); // ถ้าไม่ได้เข้าสู่ระบบให้ไปที่หน้า Login
      }
    });
    return unsubscribe;
  }, []);

  // ฟังก์ชันสำหรับลงทะเบียนด้วยรหัสห้อง (ใช้ได้ทั้งกรอกด้วยมือและสแกน QR Code)
  const registerRoomCode = async (code) => {
    if (!code.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสห้อง");
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      // ค้นหา classroom ที่มีรหัสตรงกับ roomCode
      const q = query(collectionGroup(db, "classroom"), where("roomCode", "==", code));
      const classSnap = await getDocs(q);
  
      if (classSnap.empty) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบบทเรียนที่ตรงกับรหัสนี้");
        return;
      }
  
      // ลงทะเบียนผู้ใช้ในห้องแรกที่พบ
      const classDoc = classSnap.docs[0];
      const classRef = classDoc.ref;
      const studentRef = doc(classRef, "students", user.uid);
  
      await setDoc(studentRef, { status: 1, timestamp: new Date() });
  
      Alert.alert("สำเร็จ", "ลงทะเบียนเข้าห้องเรียนเรียบร้อยแล้ว!");
      await fetchRegisteredClasses(user.uid); // อัปเดต UI
    } catch (error) {
      console.error("Error registering room:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลงทะเบียน");
    }
  };  

  // ฟังก์ชันสำหรับลงทะเบียนด้วยรหัสห้องจาก TextInput
  const handleRegisterWithCode = async () => {
    await registerRoomCode(roomCode);
    setRoomCode("");
  };

  // ✅ ฟังก์ชันดึงข้อมูลผู้ใช้จาก Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "Student", uid)); // ดึงข้อมูลจาก Collection `Student`
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, "users", uid));
      }
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
  const handleJoin = async () => {
    try {
      await signOut(auth);
      navigation.replace("JoinClassScreen");
    } catch (error) {
      Alert.alert("❌ ออกจากระบบไม่สำเร็จ", error.message);
    }
  };


  // ✅ ฟังก์ชันสแกน QR Code
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setIsScanning(false);

    try {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("❌ ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        // ดึงค่า subjectId จาก URL ของ QR Code
        const urlParams = new URL(data).searchParams;
        const subjectId = urlParams.get("subjectId");

        if (!subjectId) {
            Alert.alert("❌ ข้อผิดพลาด", "QR Code ไม่มีข้อมูลวิชา");
            return;
        }

        // ดึงข้อมูลของนักเรียนจาก Firestore
        const studentRef = doc(db, "Student", user.uid);
        const studentDoc = await getDoc(studentRef);

        if (!studentDoc.exists()) {
            Alert.alert("❌ ข้อผิดพลาด", "ไม่พบนักเรียนในระบบ");
            return;
        }

        const studentData = studentDoc.data();

        // เพิ่มนักเรียนเข้าสู่วิชาใน Firestore (classroom/{subjectId}/Student/{studentId})
        const classStudentRef = doc(db, "classroom", subjectId, "Student", user.uid);
        await setDoc(classStudentRef, {
            studentId: studentData.studentId || "-",
            username: studentData.username || "ไม่ระบุชื่อ",
            email: studentData.email || "-",
            phoneNumber: studentData.phoneNumber || "-",
            joinedAt: new Date()
        });

        // ✅ บันทึกว่าผู้ใช้เข้าร่วมวิชาในคอลเลกชัน `Student/{studentId}/subjectList/{subjectId}`
        const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", subjectId);
        await setDoc(studentSubjectRef, {
            code: subjectId, 
            joinedAt: new Date()
        });

        // ✅ อัปเดต UI แสดงว่านักเรียนเข้าร่วมแล้ว
        setJoinedClass(subjectId);
        Alert.alert("✅ ลงทะเบียนสำเร็จ", `คุณได้เข้าร่วมวิชา ${subjectId}`);

    } catch (error) {
        console.error("Error registering student:", error);
        Alert.alert("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลงทะเบียน");
    }
  };
  
  // ฟังก์ชันเริ่มการสแกน
  const startScanning = async () => {
    // ตรวจสอบว่ามีสิทธิ์กล้องหรือไม่
    const { granted } = await requestPermission();
    if (granted) {
      setIsScanning(true); // เปิดกล้องเพื่อสแกน
      setScanned(false); // รีเซ็ตสถานะการสแกน
    } else {
      Alert.alert("การอนุญาตกล้องถูกปฏิเสธ", "คุณต้องอนุญาตให้ใช้กล้องเพื่อสแกน QR Code");
    }
  };
  
    // ฟังก์ชันหยุดการสแกน
  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : userData ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>ข้อมูลส่วนตัว</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileAvatarContainer}>
              <Text style={styles.profileAvatar}>{userData.username?.charAt(0) || "?"}</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{userData.username}</Text>
              <Text style={styles.info}>รหัสนักศึกษา: {userData.studentId}</Text>
              <Text style={styles.info}>อีเมล: {userData.email}</Text>
              <Text style={styles.info}>เบอร์โทร: {userData.phoneNumber || "-"}</Text>
            </View>
          </View>

          {/* ✅ แสดงข้อความเมื่อนักเรียนเข้าร่วมชั้นเรียนสำเร็จ */}
          {joinedClass && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ เข้าร่วมชั้นเรียน {joinedClass} สำเร็จแล้ว!</Text>
            </View>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={isScanning ? stopScanning : startScanning}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>สแกน QR Code เข้าร่วมชั้นเรียน</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.joinClassButton} 
              onPress={() => navigation.navigate("JoinClassByCode")}
            >
              <Ionicons name="enter-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>เข้าร่วมชั้นเรียนด้วยรหัส</Text>
            </TouchableOpacity>
            

            <TouchableOpacity size={24} style={styles.showClassButton} onPress={() => navigation.navigate("ShowClass")} >
            <Text style={styles.buttonText}>แสดงรายวิชาที่เรียน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
          
          {isScanning && permission?.granted && (
            <View style={styles.fullScreenScanner}>
              <StatusBar barStyle="light-content" backgroundColor="black" />
              <CameraView
                style={styles.fullScreenCamera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              
              {/* Scan Frame */}
              <View style={styles.scannerOverlay}>
                <View style={styles.scanFrame}></View>
                <Text style={styles.scanInstructionText}>วางโค้ด QR ให้อยู่ในกรอบเพื่อสแกน</Text>
              </View>
              
              {/* Header controls */}
              <SafeAreaView style={styles.scannerControls}>
                <View style={styles.scannerHeader}>
                  <Text style={styles.scannerTitle}>สแกน QR Code</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setScanning(false)}
                  >
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
              
              {/* Bottom controls */}
              <SafeAreaView style={styles.bottomControls}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setScanning(false)}
                >
                  <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#d9534f" />
          <Text style={styles.errorText}>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData(auth.currentUser?.uid)}>
            <Text style={styles.retryButtonText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 15,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileAvatar: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 6,
  },
  info: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
  },
  actionContainer: {
    padding: 16,
  },
  scanButton: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },
  joinClassButton: {
    backgroundColor: "#17a2b8", // สีฟ้า (Bootstrap Info)
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  showClassButton: {
    backgroundColor: "#007bff",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },  
  // Full Screen Scanner Styles
  fullScreenScanner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "black",
    zIndex: 1000,
  },
  fullScreenCamera: {
    width: width,
    height: height,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: "#28a745",
    borderRadius: 15,
    backgroundColor: "transparent",
  },
  scanInstructionText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scannerControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: StatusBar.currentHeight || 44,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 8,
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: "#d9534f",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  successBox: {
    backgroundColor: "#d4edda",
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#c3e6cb",
    alignItems: "center",
  },
  successText: {
    color: "#155724",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;