// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { getFirestore, doc, setDoc ,getDoc ,getDocs} from "firebase/firestore";
import { ref } from "firebase/storage";

// แทนที่ค่าด้านล่างด้วย Firebase Config ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
  authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
  projectId: "webmobileapplication-cdaaf",
  storageBucket: "webmobileapplication-cdaaf.appspot.com",
  messagingSenderId: "90430005457",
  appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
  measurementId: "G-J886NPRZWK"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  firebaseConfig, // ส่งออก firebaseConfig เพื่อให้ส่งเป็น prop ให้ FirebaseRecaptchaVerifierModal ในคอมโพเนนต์ OTP ของคุณ
  auth,
  db,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
};
