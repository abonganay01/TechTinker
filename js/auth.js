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

// Load zxcvbn for password strength
import "https://cdnjs.cloudflare.com/ajax/libs/zxcvbn/4.4.2/zxcvbn.js";

// NOTE: Firestore rules are currently permissive (allow read/write for ideas, forumComments, userProjects).
// This file provides a small local-anon helper so the UI can indicate/posts anonymously when not signed in.

// --- NEW: stable local anonymous ID for unsigned users ---
const ANON_ID_KEY = "tt_anon_id";
function getOrCreateAnonId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = "anon-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}
const localAnonId = getOrCreateAnonId();

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
// support multiple google sign-in buttons by class
const googleBtns = Array.from(document.querySelectorAll(".googleSignInBtn"));
const registerLink = document.getElementById("registerLink");
const backToSignIn = document.getElementById("backToSignIn");
const createAccountForm = document.getElementById("createAccountForm");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const newUserPassword = document.getElementById("newUserPassword"); // Added for completeness

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

// ✅ Close all modals before opening another
function closeAllModals() {
  // Ensure the global modal-backdrop is also closed here
  const g = getOrCreateGlobalBackdrop();
  if (g) {
    g.classList.remove("open");
    g.classList.remove("active");
    g.style.display = "none";
  }

  [signinModal, createAccountModal].forEach((m) => {
    if (m) {
      m.classList.remove("open", "openSignin");
      m.classList.add("hidden");
    }
  });
}

function toggleModal(modalId, forceOpen, instantClose = false) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const backdrops = document.querySelectorAll(".modal-backdrop");
  const isOpen = modal.classList.contains("open") || modal.classList.contains("openSignin");

  if (forceOpen === true || (forceOpen === undefined && !isOpen)) {
    closeAllModals(); // Closes other modals and the backdrop

    // Open the target modal
    modal.classList.add("open", "openSignin");
    modal.classList.remove("hidden", "closeSignin");

    // Show the single global backdrop (positioned beneath the header)
    const g = getOrCreateGlobalBackdrop();
    if (g) {
      g.classList.add("open");
      g.classList.add("active");
      g.style.display = "block";
      updateGlobalBackdropTop();
    }

  } else if (forceOpen === false || (forceOpen === undefined && isOpen)) {
    // Close the target modal
    modal.classList.remove("open", "openSignin");
    modal.classList.add("closeSignin");

    // Close the global backdrop immediately or with a delay
    const g = getOrCreateGlobalBackdrop();
    if (g) {
      g.classList.remove("open");
      g.classList.remove("active");
      g.style.display = "none";
    }

    if (instantClose) {
      modal.classList.add("hidden");
      modal.classList.remove("closeSignin");
    } else {
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("closeSignin");
      }, 300);
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

// Create or return a single global backdrop element appended to document.body
function getOrCreateGlobalBackdrop() {
  let g = document.querySelector(".tt-global-modal-backdrop");
  if (g) return g;

  g = document.createElement("div");
  g.className = "tt-global-modal-backdrop modal-backdrop"; // keep existing CSS hooks
  g.style.position = "fixed";
  g.style.left = "0";
  g.style.right = "0";
  g.style.bottom = "0";
  g.style.zIndex = "999";
  g.style.background = "rgba(0,0,0,0.5)";
  g.style.display = "none";

  // click closes modals
  g.addEventListener("click", (e) => {
    if (e.target === g) closeAllModals();
  });

  document.body.appendChild(g);
  return g;
}

function updateGlobalBackdropTop() {
  const g = getOrCreateGlobalBackdrop();
  const header = document.querySelector("header");
  let top = 0;
  if (header) {
    const rect = header.getBoundingClientRect();
    // Use header height so backdrop starts below header
    top = rect.height + rect.top;
  }
  g.style.top = top + "px";
}

// Ensure backdrop is resized/positioned on resize/scroll
window.addEventListener("resize", () => updateGlobalBackdropTop());
window.addEventListener("scroll", () => updateGlobalBackdropTop());

// Ensure the global backdrop exists and is positioned after DOM loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    getOrCreateGlobalBackdrop();
    updateGlobalBackdropTop();
  });
} else {
  getOrCreateGlobalBackdrop();
  updateGlobalBackdropTop();
}

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
if (emailLoginForm) {
  emailLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    if (!emailInput || !passwordInput) {
      showMessage("Login form error: missing input fields.", true);
      return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      showMessage("Please enter both email and password.", true);
      return;
    }
    try {
      showLoading("signinPage");
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Signed in successfully!");
      // Reset form and close modal
      emailLoginForm.reset();
      toggleModal("signinPage", false, true);
    } catch (err) {
      showMessage("Error signing in: " + err.message, true);
    } finally {
      hideLoading("signinPage");
    }
  });
}

// =============================
// GOOGLE SIGN-IN IMPLEMENTATION (Improved)
// =============================
// Attach to all google sign-in buttons. Determine which modal the button belongs to
// and scope the loading spinner to that modal.
googleBtns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    // find the closest modal container for the spinner scope; fall back to signinPage
    const modal = btn.closest(".signin-modal");
    const modalId = (modal && modal.id) ? modal.id : "signinPage";
    showLoading(modalId);
    try {
      const popupPromise = signInWithPopup(auth, googleProvider);

      // Add a safety timeout: hide spinner after 6s if no result (popup abandoned)
      const timeout = setTimeout(() => hideLoading(modalId), 6000);

      await popupPromise;
      clearTimeout(timeout);

      showMessage("Signed in with Google successfully!");
    } catch (err) {
      hideLoading(modalId); // Always hide spinner immediately

      if (err && err.code === "auth/popup-closed-by-user") {
        console.log("Google Sign-in popup closed by user — no login attempt.");
        showMessage("Google sign-in canceled.", true);
        return;
      }

      showMessage("Google Sign-in Error: " + (err?.message || err), true);
    } finally {
      hideLoading(modalId);
    }
  });
});

// =============================
// NEW USER REGISTRATION (EMAIL) IMPLEMENTATION
// =============================
createAccountForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("newUserName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim();
  const password = document.getElementById("newUserPassword").value;

  if (!name || !email || !password) {
    showMessage("Please fill in all fields.", true);
    return;
  }
  
  // Basic password strength check before submission
  const passwordStrength = zxcvbn(password).score;
  if (passwordStrength < 2) {
    showMessage("Please choose a stronger password.", true);
    return;
  }

  try {
    showLoading("createAccountModal");
    
    // 1. Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: name
    });
    
    // 3. Log success and clean up
    createAccountForm.reset();
    showMessage(`Account created for ${name}! Signed in successfully.`);
    
    // The onAuthStateChanged listener will handle closing the modal

  } catch (err) {
    showMessage("Registration Error: " + err.message, true);
  } finally {
    hideLoading("createAccountModal");
  }
});

// =============================
// SESSION JWT HELPERS (using Firebase ID Token)
// =============================
function setSessionToken(token, expirationMillis) {
  // store token and expiry (timestamp in ms)
  try {
    if (token) sessionStorage.setItem("tt_jwt", token);
    if (expirationMillis) sessionStorage.setItem("tt_jwt_exp", String(expirationMillis));
  } catch (e) {
    // storage may fail in some environments; ignore gracefully
  }
}

function clearSessionToken() {
  try {
    sessionStorage.removeItem("tt_jwt");
    sessionStorage.removeItem("tt_jwt_exp");
  } catch (e) {}
}

// Returns stored token or null
function getStoredToken() {
  try {
    return sessionStorage.getItem("tt_jwt");
  } catch (e) {
    return null;
  }
}

// Exported helper to get current auth token (optionally force refresh).
// Other files can import { getAuthToken } from "./auth.js"
export async function getAuthToken(forceRefresh = false) {
  if (!auth || !auth.currentUser) return null;
  try {
    // If forceRefresh is true, this will mint a fresh token.
    const token = await auth.currentUser.getIdToken(forceRefresh);
    // update stored token and expiry
    try {
      const result = await auth.currentUser.getIdTokenResult();
      const expMillis = Date.parse(result.expirationTime);
      setSessionToken(token, expMillis);
    } catch (_) {
      // ignore tokenResult errors, but still return token
      setSessionToken(token, null);
    }
    return token;
  } catch (err) {
    return null;
  }
}

// =============================
// SIGN OUT
// =============================
signoutButton?.addEventListener("click", () => {
  signOut(auth);
  clearSessionToken(); // remove stored JWT on sign-out
  showMessage("Signed out successfully.");
});

// =============================
// AUTH STATE LISTENER
// =============================
// make listener async so we can fetch ID token (JWT) and expiry
let currentAuthState = { loggedIn: false, anonId: localAnonId };

onAuthStateChanged(auth, async (user) => {
  const header = document.querySelector("header");
  const loggedOutView = document.getElementById("loggedOutView");
  const userInfo = document.getElementById("userInfo");
  const signoutContainer = document.getElementById("signoutContainer");

  // Also update the backdrop state here
  const backdrop = document.querySelector(".modal-backdrop");

  if (user) {
    header?.classList.add("logged-in");
    if (loggedOutView) loggedOutView.style.display = "none";
    if (userInfo) userInfo.classList.remove("hidden");
    if (signoutContainer) signoutContainer.classList.remove("hidden");

    // Derive a friendly username to display in header:
    // 1) use displayName if present
    // 2) else derive from email local-part (before @), replace separators with spaces and title-case
    // 3) fallback to email if nothing else
    try {
      const userNameEl = document.getElementById("userName");
      if (userNameEl) {
        let display = (user.displayName || "").trim();
        if (!display && user.email) {
          // take local-part of email
          const local = user.email.split("@")[0] || user.email;
          // replace dots/underscores/dashes with spaces and title-case
          display = local.replace(/[._-]+/g, ' ').split(' ').map(s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '').join(' ').trim();
        }
        if (!display) display = user.email || 'User';
        userNameEl.textContent = display;
        // set full email as tooltip for clarity
        userNameEl.setAttribute('title', user.email || '');
      }
    } catch (e) {
      console.warn('Failed to set user display name in header:', e);
    }

    // Close any open modals and the backdrop instantly after successful sign-in
    toggleModal("signinPage", false, true);
    toggleModal("createAccountModal", false, true);
    if (backdrop) backdrop.classList.remove("open");

    const isGoogle = user.providerData.some(
      (provider) => provider.providerId === "google.com"
    );

    // fetch ID token (JWT) and expiry info
    let idToken = null;
    let tokenExpiry = null;
    try {
      const idTokenResult = await user.getIdTokenResult();
      idToken = idTokenResult.token;
      tokenExpiry = Date.parse(idTokenResult.expirationTime);
      setSessionToken(idToken, tokenExpiry);
    } catch (err) {
      // fallback: try to get raw token without result
      try {
        idToken = await user.getIdToken();
        setSessionToken(idToken, null);
      } catch (_) {
        clearSessionToken();
      }
    }

    currentAuthState = {
      loggedIn: true,
      email: user.email,
      isGoogle,
      token: idToken,
      tokenExpiry,
      anonId: localAnonId
    };
  } else {
    header?.classList.remove("logged-in");
    if (loggedOutView) loggedOutView.style.display = "flex";
    if (userInfo) userInfo.classList.add("hidden");
    if (signoutContainer) signoutContainer.classList.add("hidden");

    clearSessionToken();

    currentAuthState = { loggedIn: false, anonId: localAnonId };
    
    // Ensure backdrop is closed on sign-out
    if (backdrop) backdrop.classList.remove("open");
  }

  authListeners.forEach((cb) => cb(currentAuthState));
});

// =============================
// EXPORT HELPER FOR OTHER FILES
// =============================
const authListeners = [];
export function initAuth(callback) {
  if (typeof callback === "function") {
    authListeners.push(callback);
    callback(currentAuthState);
  }
}

// =============================
// SUBMIT BUTTON ACCESS CONTROL
// =============================
const submitButton = document.getElementById("submitButton");
let submitMessage = document.getElementById("submitMessage");

if (submitButton && !submitMessage) {
  submitMessage = document.createElement("span");
  submitMessage.id = "submitMessage";
  submitMessage.style.display = "none";
  submitButton.insertAdjacentElement("afterend", submitMessage);
}

let latestAuthState = { loggedIn: false };

function updateSubmitButton(authState) {
  latestAuthState = authState || { loggedIn: false };

  if (!submitButton) return;

  if (latestAuthState.loggedIn) {
    submitButton.style.display = "";
    submitButton.style.visibility = "visible";
    submitButton.disabled = false;
    submitButton.style.pointerEvents = "auto";
    submitButton.style.opacity = "1";
    submitButton.style.zIndex = "2";
    submitButton.setAttribute("aria-disabled", "false");

    if (submitMessage) {
      submitMessage.style.display = "none";
      submitMessage.style.visibility = "hidden";
      submitMessage.style.pointerEvents = "none";
      submitMessage.textContent = "";
    }
  } else {
    submitButton.style.visibility = "hidden";
    submitButton.disabled = true;
    submitButton.style.pointerEvents = "none";
    submitButton.setAttribute("aria-disabled", "true");
    submitButton.style.zIndex = "0";

    if (submitMessage) {
      submitMessage.style.display = "inline-block";
      submitMessage.style.visibility = "visible";
      submitMessage.style.pointerEvents = "auto";
      submitMessage.style.fontStyle = "italic";
      submitMessage.style.color = "#6b7280";
      submitMessage.textContent = "🔒 Please sign in to submit.";
      submitMessage.style.zIndex = "1";
    }
  }

  submitButton.setAttribute("title", latestAuthState.loggedIn ? "Submit" : "Sign in required");
}

initAuth(updateSubmitButton);

submitButton?.addEventListener("click", (e) => {
  if (!latestAuthState.loggedIn) {
    e.preventDefault();
    showMessage?.("Please sign in to continue.");
    toggleModal("signinPage", true);
    return;
  }
});

// =============================
// SHOW / HIDE PASSWORD TOGGLE
// =============================
// Icon-based password toggle for login
const loginPasswordInput = document.getElementById("loginPassword");
const toggleLoginPasswordIcon = document.getElementById("toggleLoginPassword");
if (loginPasswordInput && toggleLoginPasswordIcon) {
  toggleLoginPasswordIcon.addEventListener("click", () => {
    const isHidden = loginPasswordInput.type === "password";
    loginPasswordInput.type = isHidden ? "text" : "password";
    toggleLoginPasswordIcon.classList.toggle("fa-eye", isHidden);
    toggleLoginPasswordIcon.classList.toggle("fa-eye-slash", !isHidden);
  });
}

// Eye icon toggle for new user password (create account modal)
const newUserPasswordInput = document.getElementById("newUserPassword");
const toggleNewUserPasswordIcon = document.getElementById("toggleNewUserPassword");
if (newUserPasswordInput && toggleNewUserPasswordIcon) {
  toggleNewUserPasswordIcon.addEventListener("click", () => {
    const isHidden = newUserPasswordInput.type === "password";
    newUserPasswordInput.type = isHidden ? "text" : "password";
    toggleNewUserPasswordIcon.classList.toggle("fa-eye", isHidden);
    toggleNewUserPasswordIcon.classList.toggle("fa-eye-slash", !isHidden);
  });
}

// Keep checkbox-based toggle for new user password if needed
function setupPasswordToggle(passwordInputId, toggleCheckboxId) {
  const passwordInput = document.getElementById(passwordInputId);
  const toggleCheckbox = document.getElementById(toggleCheckboxId);
  if (passwordInput && toggleCheckbox) {
    toggleCheckbox.addEventListener("change", () => {
      passwordInput.type = toggleCheckbox.checked ? "text" : "password";
    });
  }
}
setupPasswordToggle("newUserPassword", "showNewUserPassword");

// =============================
// PASSWORD STRENGTH METER (live update)
// =============================

if (newUserPassword && strengthBar && strengthText) {
  newUserPassword.addEventListener("input", () => {
    const password = newUserPassword.value;
    const result = zxcvbn(password);
    const strength = result.score;

    // Update bar width and color
    strengthBar.style.width = ((strength + 1) * 20) + "%";

    let color, text;
    switch (strength) {
      case 0:
        color = "red"; text = "Very Weak"; break;
      case 1:
        color = "orangered"; text = "Weak"; break;
      case 2:
        color = "orange"; text = "Fair"; break;
      case 3:
        color = "yellowgreen"; text = "Strong"; break;
      case 4:
        color = "green"; text = "Very Strong"; break;
      default:
        color = "transparent"; text = ""; break;
    }

    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
  });
}

// =============================
// INLINE ERROR HELPERS
// =============================
function showInputError(inputEl, message) {
  if (!inputEl) return;
  clearInputError(inputEl);

  const errorEl = document.createElement("div");
  errorEl.className = "input-error";
  errorEl.style.color = "#ef4444";
  errorEl.style.fontSize = "0.875rem";
  errorEl.style.marginTop = "4px";
  errorEl.textContent = message;

  inputEl.insertAdjacentElement("afterend", errorEl);
}

function clearInputError(inputEl) {
  if (!inputEl) return;
  const nextEl = inputEl.nextElementSibling;
  if (nextEl && nextEl.classList.contains("input-error")) {
    nextEl.remove();
  }
}

// =============================
// EMAIL SIGN-IN
// =============================
if (emailLoginForm) {
  emailLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    clearInputError(emailInput);
    clearInputError(passwordInput);

    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    let hasError = false;

    if (!email) {
      showInputError(emailInput, "Email is required.");
      hasError = true;
    }
    if (!password) {
      showInputError(passwordInput, "Password is required.");
      hasError = true;
    }

    if (hasError) return;

    try {
      showLoading("signinPage");
      await signInWithEmailAndPassword(auth, email, password);

      emailLoginForm.reset();
      toggleModal("signinPage", false, true);
      showMessage("Signed in successfully!");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        showInputError(passwordInput, "Email or password is incorrect.");
      } else if (err.code === "auth/invalid-email") {
        showInputError(emailInput, "Invalid email format.");
      } else {
        showInputError(passwordInput, err.message);
      }
    } finally {
      hideLoading("signinPage");
    }
  });
}

// =============================
// NEW USER REGISTRATION (EMAIL)
// =============================
createAccountForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("newUserName");
  const emailInput = document.getElementById("newUserEmail");
  const passwordInput = document.getElementById("newUserPassword");

  clearInputError(nameInput);
  clearInputError(emailInput);
  clearInputError(passwordInput);

  const name = nameInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  let hasError = false;

  if (!name) {
    showInputError(nameInput, "Username is required.");
    hasError = true;
  }

  if (!email) {
    showInputError(emailInput, "Email is required.");
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showInputError(emailInput, "Invalid email format.");
    hasError = true;
  }

  if (!password) {
    showInputError(passwordInput, "Password is required.");
    hasError = true;
  } else if (password.length < 6) {
    showInputError(passwordInput, "Password must be at least 6 characters.");
    hasError = true;
  }

  // Password strength check (only if not already invalid)
  if (!hasError) {
    const passwordStrength = zxcvbn(password).score;
    if (passwordStrength < 2) {
      showInputError(passwordInput, "Please choose a stronger password.");
      hasError = true;
    }
  }

  if (hasError) return;

  try {
    showLoading("createAccountModal");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    createAccountForm.reset();
    showMessage(`Account created for ${name}! Signed in successfully.`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      showInputError(emailInput, "This email is already registered.");
    } else {
      showInputError(passwordInput, err.message);
    }
  } finally {
    hideLoading("createAccountModal");
  }
});
