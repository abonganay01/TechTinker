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
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// =============================
// DOM ELEMENTS
// =============================
const signinModal = document.getElementById("signinPage");
const createAccountModal = document.getElementById("createAccountModal");
const signinButton = document.getElementById("signinButton");
const newAccountLink = document.getElementById("newAccountLink");
const messageBox = document.getElementById("messageBox");
const signoutButton = document.getElementById("signoutButton");
const closeIcon = document.getElementById("closeIcon");
const closeCreateAccount = document.getElementById("closeCreateAccount");
const emailLoginForm = document.getElementById("emailLoginForm");
const googleBtn = document.getElementById("googleSignInBtn");
const registerLink = document.getElementById("registerLink");
const backToSignIn = document.getElementById("backToSignIn");
const createAccountForm = document.getElementById("createAccountForm");

// =============================
// GOOGLE PROVIDER
// =============================
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
googleProvider.setCustomParameters({ prompt: "select_account" });

// =============================
// MODAL & MESSAGE BEHAVIOR
// =============================
function showMessage(msg, isError = false) {
  if (!messageBox) return;
  messageBox.textContent = msg;
  messageBox.style.backgroundColor = isError ? "#ef4444" : "#10b981";
  messageBox.style.opacity = "1";
  setTimeout(() => {
    messageBox.style.opacity = "0";
  }, 3000);
}

function toggleModal(modalId, forceOpen, instantClose = false) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const isOpen = modal.classList.contains("open") || modal.classList.contains("openSignin");

  if (forceOpen === true || (forceOpen === undefined && !isOpen)) {
    modal.classList.add("open", "openSignin");
    modal.classList.remove("hidden", "closeSignin");
  } else if (forceOpen === false || (forceOpen === undefined && isOpen)) {
    modal.classList.remove("open", "openSignin");
    modal.classList.add("closeSignin");

    if (instantClose) {
      modal.classList.add("hidden");
      modal.classList.remove("closeSignin");
    } else {
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("closeSignin");
      }, 300); // match animation duration
    }
  }
}

// =============================
// LOADING SPINNER HELPERS
// =============================
function showLoading(modalId = "signinPage") {
  document.querySelector(`#${modalId} .authLoading`)?.classList.remove("hidden");
}
function hideLoading(modalId = "signinPage") {
  document.querySelector(`#${modalId} .authLoading`)?.classList.add("hidden");
}

// =============================
// EVENT LISTENERS
// =============================
signinButton?.addEventListener("click", () => toggleModal("signinPage", true));
closeIcon?.addEventListener("click", () => toggleModal("signinPage", false));
closeCreateAccount?.addEventListener("click", () => toggleModal("createAccountModal", false));

[signinModal, createAccountModal].forEach((modal) => {
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(modal.id, false);
  });
});

newAccountLink?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleModal("createAccountModal", true);
});

registerLink?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleModal("signinPage", false);
  toggleModal("createAccountModal", true);
});

backToSignIn?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleModal("createAccountModal", false);
  toggleModal("signinPage", true);
});

// =============================
// EMAIL SIGN-IN
// =============================
emailLoginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    showLoading("signinPage");
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Signed in successfully!");
  } catch (err) {
    showMessage("Error signing in: " + err.message, true);
  } finally {
    hideLoading("signinPage");
  }
});

// =============================
// CREATE NEW ACCOUNT
// =============================
createAccountForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("newUserEmail").value;
  const password = document.getElementById("newUserPassword").value;
  const name = document.getElementById("newUserName").value;

  if (!email || !password || !name) {
    showMessage("Please fill in all fields.", true);
    return;
  }

  try {
    showLoading("createAccountModal");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    showMessage("✅ Account created successfully!");
  } catch (err) {
    showMessage("Error creating account: " + err.message, true);
  } finally {
    hideLoading("createAccountModal");
  }
});

// =============================
// GOOGLE SIGN-IN
// =============================
googleBtn?.addEventListener("click", async () => {
  try {
    showLoading("signinPage");
    await signInWithPopup(auth, googleProvider);
    showMessage("Google sign-in successful!");
  } catch (err) {
    showMessage("Google sign-in failed: " + err.message, true);
  } finally {
    hideLoading("signinPage");
  }
});

// =============================
// SIGN OUT
// =============================
signoutButton?.addEventListener("click", () => {
  signOut(auth);
  showMessage("Signed out successfully.");
});

// =============================
// AUTH STATE LISTENER
// =============================
// Track user state globally so showcase.js can use it
let currentAuthState = { loggedIn: false };

onAuthStateChanged(auth, (user) => {
  const header = document.querySelector("header");
  const loggedOutView = document.getElementById("loggedOutView");
  const userInfo = document.getElementById("userInfo");
  const signoutContainer = document.getElementById("signoutContainer");

  if (user) {
    header?.classList.add("logged-in");
    if (loggedOutView) loggedOutView.style.display = "none";
    if (userInfo) userInfo.classList.remove("hidden");
    if (signoutContainer) signoutContainer.classList.remove("hidden");

    document.getElementById("userName").textContent = user.displayName || user.email;

    // ✅ Always close modals when logged in
    toggleModal("signinPage", false, true);
    toggleModal("createAccountModal", false, true);

    // ✅ Update global state for showcase.js
    const isGoogle = user.providerData.some(
      (provider) => provider.providerId === "google.com"
    );
    currentAuthState = {
      loggedIn: true,
      email: user.email,
      isGoogle
    };

  } else {
    header?.classList.remove("logged-in");
    if (loggedOutView) loggedOutView.style.display = "flex";
    if (userInfo) userInfo.classList.add("hidden");
    if (signoutContainer) signoutContainer.classList.add("hidden");

    currentAuthState = { loggedIn: false };
  }

  // Notify listeners (like showcase.js)
  authListeners.forEach((cb) => cb(currentAuthState));
});

// =============================
// EXPORT HELPER FOR OTHER FILES
// =============================
const authListeners = [];
export function initAuth(callback) {
  if (typeof callback === "function") {
    authListeners.push(callback);
    callback(currentAuthState); // fire once immediately
  }
}
