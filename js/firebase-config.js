<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA2_Qcn3bRS_ebTIr0K-9jSPpYNy7G3Fv4",
    authDomain: "techtinker-98925.firebaseapp.com",
    projectId: "techtinker-98925",
    storageBucket: "techtinker-98925.firebasestorage.app",
    messagingSenderId: "41268919544",
    appId: "1:41268919544:web:5925d3935d2584b4a80f0d",
    measurementId: "G-YQKWW6XY56"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>