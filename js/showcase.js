// =========================
// SHOWCASE.JS (Restrict Google Form & Handle Gmail Input)
// =========================
import { initAuth } from "./auth.js";

export function initShowcase() {
  const formSection = document.querySelector(".submit-section");
  const formIframe = formSection?.querySelector("iframe");
  const notice = document.createElement("div");
  const manualEmailBox = document.createElement("div");

  // Login required message
  notice.classList.add("login-required");
  notice.innerHTML = `
    <p class="text-red-500 font-semibold">
      🚫 You must be logged in to submit a project.
    </p>
    <button id="goLogin" class="btn mt-2">Login</button>
  `;
  notice.style.display = "none";

  // Manual Gmail entry for email/password users
  manualEmailBox.classList.add("manual-gmail", "mt-4");
  manualEmailBox.innerHTML = `
    <label for="manualGmail" class="block font-semibold mb-1">Enter your Gmail:</label>
    <input id="manualGmail" type="email" placeholder="you@gmail.com"
      class="border rounded px-2 py-1 w-full mb-2" />
    <button id="openFormBtn" class="btn">Open Project Submission Form</button>
  `;
  manualEmailBox.style.display = "none";

  if (formSection && formIframe) {
    formSection.insertBefore(notice, formIframe);
    formSection.insertBefore(manualEmailBox, formIframe);
  }

  // Track login state
  initAuth((user) => {
    if (!formSection || !formIframe) return;

    if (user && user.loggedIn) {
      notice.style.display = "none";

      if (user.isGoogle) {
        // Google login → show form directly
        formIframe.style.display = "block";
        manualEmailBox.style.display = "none";
      } else {
        // Email/password login → require Gmail first
        formIframe.style.display = "none";
        manualEmailBox.style.display = "block";
      }
    } else {
      // Not logged in → hide everything
      formIframe.style.display = "none";
      manualEmailBox.style.display = "none";
      notice.style.display = "block";
    }
  });

  // Handle Gmail submission for email/password users
  manualEmailBox.addEventListener("click", (e) => {
    if (e.target.id === "openFormBtn") {
      const email = document.getElementById("manualGmail").value.trim();
      if (!email || !email.endsWith("@gmail.com")) {
        alert("Please enter a valid Gmail address.");
        return;
      }

      // Replace YOUR_FORM_URL with your actual Google Form prefill link
      const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSdCjBBtIbpWKJLo47guhAmjiyp5NuovqTfmwOw6y3i0oL0CQg/viewform?usp=dialog${encodeURIComponent(email)}`;

      window.open(formUrl, "_blank");
    }
  });

  // Optional: clicking login button opens modal
  document.addEventListener("click", (e) => {
    if (e.target.id === "goLogin") {
      const signinBtn = document.getElementById("signinButton");
      signinBtn?.click();
    }
  });
}
