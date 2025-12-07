// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrq7n9gFLHrabtt1f19v_rs27AvHOxFXA",
  authDomain: "gikonnect-2b5e0.firebaseapp.com",
  projectId: "gikonnect-2b5e0",
  storageBucket: "gikonnect-2b5e0.firebasestorage.app",
  messagingSenderId: "782880079260",
  appId: "1:782880079260:web:a52d958f768c3867f1dc59",
  measurementId: "G-M7YT2G1ELW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, analytics, db };