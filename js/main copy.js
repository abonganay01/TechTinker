import { db } from "./firebase-config.js";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// =========================
// ON DOM READY
// =========================
document.addEventListener('DOMContentLoaded', () => {
    let lastScrollTop = 0;
    const header = document.querySelector('header');

    const basePath = detectBasePath();
    fixPaths();

    // Header
    loadComponent(basePath + 'htmldesign/header.html', 'header-placeholder', () => {
        makeHeaderClickable(basePath);
        initSigninModal();
    });

    // Hero + Footer
    ['hero', 'footer'].forEach(id => {
        loadComponent(`${basePath}htmldesign/${id}.html`, `${id}-placeholder`);
    });

    // Parallax
    setupParallax();

    // Highlight nav
    highlightActiveLink(basePath);

    // Header scroll hide/show
    if (header) setupHeaderScroll(header);

    // Forum
    if (document.getElementById('commentsList')) import("./forum.js").then(m => m.initForum());

    // Incubator
    if (document.getElementById('ideaForm')) import("./incubator.js").then(m => m.initIncubator());

    // Showcase
    // Lazy-load Showcase only if form exists
    if (document.querySelector('.submit-section form')) {
        import('./showcase.js').then(module => {
            module.initShowcase(); // call the exported function
        }).catch(err => console.error("Error loading showcase module:", err));
    }
    
    const signoutBtn = document.getElementById("signoutButton");
    if (signoutBtn) {
        signoutBtn.addEventListener("click", signOut);
    }


    // Quizzes
    setupQuizzes();
});

// =========================
// HELPERS
// =========================
function loadComponent(file, placeholderId, callback = null) {
    const cached = sessionStorage.getItem(file);
    if (cached) {
        document.getElementById(placeholderId).innerHTML = cached;
        if (callback) callback();
        return;
    }
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(placeholderId).innerHTML = data;
            sessionStorage.setItem(file, data);
            if (callback) callback();
        })
        .catch(err => console.error(`Error loading ${file}:`, err));
}

function detectBasePath() {
    const hostname = window.location.hostname;
    const repoName = 'TechTinker';
    return hostname.includes('github.io') ? `/${repoName}/` : '/';
}

function makeHeaderClickable(basePath) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = basePath + 'index.html';
        });
    }
}

function highlightActiveLink(basePath) {
    const currentPath = window.location.pathname.replace(basePath, '');
    document.querySelectorAll('nav a').forEach(link => {
        const linkPath = link.getAttribute('href').replace(basePath, '');
        if (linkPath === currentPath || (linkPath === 'index.html' && currentPath === '')) {
            link.style.backgroundColor = '#63b3ed';
            link.style.color = '#2d3748';
            link.style.borderRadius = '6px';
        }
    });
}

// =========================
// SIGN-IN MODAL
// =========================
function initSigninModal() {
    const signinButton = document.getElementById("signinButton");
    const signinPage = document.getElementById("signinPage");
    const closeIcon = document.getElementById("closeIcon");
    const signinForm = signinPage?.querySelector("form");

    if (signinButton && signinPage && closeIcon) {
        // Open modal
        signinButton.addEventListener("click", () => {
            signinPage.classList.remove("closeSignin");
            signinPage.classList.add("openSignin");
        });

        // Close modal
        closeIcon.addEventListener("click", () => {
            signinPage.classList.remove("openSignin");
            signinPage.classList.add("closeSignin");
        });
    }

    // Email/Password Sign-In (basic demo)
    if (signinForm) {
        signinForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const inputs = signinForm.querySelectorAll("input");
            const usernameOrEmail = inputs[0].value.trim();
            const password = inputs[1].value.trim();

            if (!usernameOrEmail || !password) {
                alert("Please fill in all fields.");
                return;
            }

            alert(`Signed in as ${usernameOrEmail}`);
            signinPage.classList.remove("openSignin");
            signinPage.classList.add("closeSignin");
        });
    }
}

// Sign out function

function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;

      // Save/update user in Firestore
      db.collection("users").doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    })
    .catch((error) => {
      console.error("Error signing in:", error);
    });
}


function signOut() {
  auth.signOut().then(() => {
    console.log("User signed out");
  });
}
document.getElementById("signoutButton").addEventListener("click", signOut);





function fixPaths() {
    const relativePath = detectBasePath();
    const logo = document.getElementById('logo');
    if (logo) logo.src = relativePath + 'images/logo.png';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.dataset.href;
        if (!href) return;
        link.href = detectBasePath() + href;
        link.addEventListener('click', () => window.location.href = link.href);
    });
}

function setupParallax() {
    let parallaxX = 0, parallaxY = 0;
    document.addEventListener("mousemove", (e) => {
        parallaxX = e.clientX / window.innerWidth - 0.5;
        parallaxY = e.clientY / window.innerHeight - 0.5;
    });
    function updateParallax() {
        document.querySelectorAll(".parallax").forEach(el => {
            const speed = el.getAttribute("data-speed");
            el.style.transform = `translate(${parallaxX * speed * 20}px, ${parallaxY * speed * 20}px)`;
        });
        requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);
}

function setupHeaderScroll(header) {
    let lastScrollTop = 0, ticking = false;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (scrollTop > lastScrollTop) header.classList.add('header-hidden');
                else header.classList.remove('header-hidden');
                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                ticking = false;
            });
            ticking = true;
        }
    });
}

function setupQuizzes() {
    window.checkAnswers = function() {
        let score = 0;
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const result = document.getElementById("result");
        if (!q1 || !q2) {
            result.textContent = "Please answer all questions.";
            result.style.color = "orange";
        } else {
            if (q1.value === "a") score++;
            if (q2.value === "b") score++;
            result.textContent = `You scored ${score}/2.`;
            result.style.color = score === 2 ? "green" : "red";
        }
    };

    window.checkQuiz = function() {
        let score = 0;
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const q3 = document.querySelector('input[name="q3"]:checked');
        const quizResult = document.getElementById("quiz-result");
        if (!quizResult) return;
        if (q1 && q1.value === "3.3V") score++;
        if (q2 && q2.value === "SPI") score++;
        if (q3 && q3.value === "Pin 10") score++;
        quizResult.textContent = `You scored ${score}/3`;
    };
}

// Device class
function applyDeviceClass() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add("mobile-view");
        document.body.classList.remove("desktop-view");
        document.documentElement.style.fontSize = "15px";
    } else {
        document.body.classList.add("desktop-view");
        document.body.classList.remove("mobile-view");
        document.documentElement.style.fontSize = "16px";
    }
}
window.addEventListener("load", applyDeviceClass);
window.addEventListener("resize", applyDeviceClass);

// =========================
// GOOGLE SIGN-IN CALLBACK
// =========================
window.handleGoogleSignIn = function(response) {
    const data = parseJwt(response.credential);
    console.log("Google User:", data);
    alert(`Signed in with Google: ${data.name} (${data.email})`);

    const signinPage = document.getElementById("signinPage");
    if (signinPage) {
        signinPage.classList.remove("openSignin");
        signinPage.classList.add("closeSignin");
    }
};

// Helper: decode JWT
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64).split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
    return JSON.parse(jsonPayload);
}