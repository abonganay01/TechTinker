// =========================
// FIREBASE CONFIG
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2_Qcn3bRS_ebTIr0K-9jSPpYNy7G3Fv4",
  authDomain: "techtinker-98925.firebaseapp.com",
  projectId: "techtinker-98925",
  storageBucket: "techtinker-98925.appspot.com",  // ✅ fixed here
  messagingSenderId: "41268919544",
  appId: "1:41268919544:web:5925d3935d2584b4a80f0d",
  measurementId: "G-YQKWW6XY56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Export everything you need
export { app, analytics, db, auth };
