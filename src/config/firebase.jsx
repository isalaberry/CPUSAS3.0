import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBdX8kW-GTO4v2ThW-Cw9yz2RPERvi7cBo",
  authDomain: "cpusas.firebaseapp.com",
  projectId: "cpusas",
  storageBucket: "cpusas.firebasestorage.app",
  messagingSenderId: "410555312666",
  appId: "1:410555312666:web:b49fe287e6346362caffa3",
  measurementId: "G-Y7NG377MT5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);