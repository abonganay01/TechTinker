// =============================
// AUTHENTICATION LOGIC
// =============================
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// =============================
// DOM ELEMENTS
// =============================
const signinModal = document.getElementById("signinPage");
const signinButton = document.getElementById("signinButton");
const signoutButton = document.getElementById("signoutButton");
const closeIcon = document.getElementById("closeIcon");
const emailLoginForm = document.getElementById("emailLoginForm");
const googleBtn = document.getElementById("googleSignInBtn");
const newAccountLink = document.getElementById("newAccountLink");
const createAccountModal = document.getElementById("createAccountModal");
const closeCreateAccount = document.getElementById("closeCreateAccount");
const registerLink = document.getElementById("registerLink");
const backToSignIn = document.getElementById("backToSignIn");

const createAccountForm = document.getElementById("createAccountForm");
const authArea = document.getElementById("authArea");
const userName = document.getElementById("userName");

// =============================
// MODAL BEHAVIOR
// =============================
signinButton?.addEventListener("click", () => {
  signinModal.classList.remove("closeSignin");
  signinModal.classList.add("openSignin");
});
closeIcon?.addEventListener("click", () => {
  signinModal.classList.remove("openSignin");
  signinModal.classList.add("closeSignin");
});

// =============================
// EMAIL SIGN-IN
// =============================
emailLoginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    signinModal.classList.remove("openSignin");
    signinModal.classList.add("closeSignin");
  } catch (err) {
    alert("Error signing in: " + err.message);
  }
});

// =============================
// CREATE NEW ACCOUNT
// =============================
newAccountLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  createAccountModal.classList.remove("hidden");

  if (!email || !password) return;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("✅ Account created and signed in!");
    signinModal.classList.remove("openSignin");
    signinModal.classList.add("closeSignin");
  } catch (err) {
    alert("Error creating account: " + err.message);
  }
});

// =============================
// GOOGLE SIGN-IN
// =============================
const googleProvider = new GoogleAuthProvider();

// Optional: Add extra scopes if needed
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Force account chooser
googleProvider.setCustomParameters({
  prompt: "select_account"
});

googleBtn?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    // Get user info
    const user = result.user;

    console.log("Google Sign-In successful:", user);

    signinModal.classList.remove("openSignin");
    signinModal.classList.add("closeSignin");

    document.getElementById("userName").textContent =
      user.displayName || user.email;

  } catch (err) {
    console.error("Google sign-in error:", err);
    alert("Google sign-in failed: " + err.message);
  }
});

// Close Create Account Modal
closeCreateAccount?.addEventListener("click", () => {
  createAccountModal.classList.add("hidden");
});

// Switch from Sign In to Create Account
registerLink?.addEventListener("click", (e) => {
  e.preventDefault();
  signinModal.classList.add("hidden");
  createAccountModal.classList.remove("hidden");
});

// Switch from Create Account back to Sign In
backToSignIn?.addEventListener("click", (e) => {
  e.preventDefault();
  createAccountModal.classList.add("hidden");
  signinModal.classList.remove("hidden");
});


// =============================
// AUTH STATE LISTENER
// =============================
onAuthStateChanged(auth, (user) => {
  const header = document.querySelector("header");
  const loggedOutView = document.getElementById("loggedOutView");
  const userInfo = document.getElementById("userInfo");
  const signoutContainer = document.getElementById("signoutContainer");

  if (user) {
    header.classList.add("logged-in");
    loggedOutView.style.display = "none";
    userInfo.classList.remove("hidden");
    signoutContainer.classList.remove("hidden");
    document.getElementById("userName").textContent = user.displayName || user.email;
  } else {
    header.classList.remove("logged-in");
    loggedOutView.style.display = "flex";
    userInfo.classList.add("hidden");
    signoutContainer.classList.add("hidden");
  }
});

createAccountForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("newUserEmail").value;
  const password = document.getElementById("newUserPassword").value;
  const name = document.getElementById("newUserName").value;

  if (!email || !password || !name) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await userCredential.user.updateProfile({ displayName: name });

    alert("✅ Account created and signed in!");

    createAccountModal.classList.add("hidden");
    signinModal.classList.remove("openSignin");
  } catch (err) {
    alert("Error creating account: " + err.message);
  }
});


document.getElementById("signoutButton").addEventListener("click", () => {
  signOut(auth);
});


