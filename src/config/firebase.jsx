// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdX8kW-GTO4v2ThW-Cw9yz2RPERvi7cBo",
  authDomain: "cpusas.firebaseapp.com",
  projectId: "cpusas",
  storageBucket: "cpusas.firebasestorage.app",
  messagingSenderId: "410555312666",
  appId: "1:410555312666:web:b49fe287e6346362caffa3",
  measurementId: "G-Y7NG377MT5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);