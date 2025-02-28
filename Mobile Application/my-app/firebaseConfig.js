import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase Config (Replace with your Firebase project credentials)
const firebaseConfig = {
    apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
    authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
    projectId: "webmobileapplication-cdaaf",
    storageBucket: "webmobileapplication-cdaaf.appspot.com",
    messagingSenderId: "90430005457",
    appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
    measurementId: "G-J886NPRZWK"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
