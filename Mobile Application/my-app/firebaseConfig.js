import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

//แทนที่ค่าด้านล่างด้วย Firebase Config ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
    authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
    projectId: "webmobileapplication-cdaaf",
    storageBucket: "webmobileapplication-cdaaf.appspot.com",
    messagingSenderId: "90430005457",
    appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
    measurementId: "G-J886NPRZWK"
};

// ✅ เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db,createUserWithEmailAndPassword, doc, setDoc, ref};

