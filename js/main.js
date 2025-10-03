import { db } from "./firebase-config.js";

// =========================
// ON DOM READY
// =========================
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const basePath = detectBasePath();

    fixPaths();

    // Header
    loadComponent(basePath + 'htmldesign/header.html', 'header-placeholder', () => {
        makeHeaderClickable(basePath);
        initSigninModal(); // only handles modal UI (open/close)

        // ✅ Load Firebase Auth logic after header is inserted
        import("./auth.js").catch(err =>
            console.error("Error loading auth module:", err)
        );
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
    if (document.getElementById('commentsList'))
        import("./forum.js").then(m => m.initForum());

    // Incubator
    if (document.getElementById('ideaForm'))
        import("./incubator.js").then(m => m.initIncubator());

    // Showcase
    if (document.querySelector('.submit-section form')) {
        import('./showcase.js')
            .then(module => module.initShowcase())
            .catch(err => console.error("Error loading showcase module:", err));
    }

    // Quizzes
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

function initSigninModal() {
    const signinButton = document.getElementById("signinButton");
    const signinPage = document.getElementById("signinPage");
    const closeIcon = document.getElementById("closeIcon");

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
}

// =========================
// FIX PATHS
// =========================
// =========================
// FIX PATHS
// =========================
function fixPaths() {
    const basePath = detectBasePath();

    // Fix logo
    const logo = document.getElementById('logo');
    if (logo) logo.style.backgroundImage = `url(${basePath}images/logo.png)`;

    // Rewrite all nav-links with data-href
    document.querySelectorAll('.nav-link').forEach(link => {
        const target = link.dataset.href;
        if (!target) return;

        // Always override href with normalized basePath + target
        link.href = basePath + target;

        // Ensure correct navigation even if browser cached old href
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = link.href;
        });
    });
}


// =========================
// PARALLAX
// =========================
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

// =========================
// HEADER SCROLL
// =========================
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

// =========================
// QUIZZES (GLOBAL HANDLER)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  const quizConfigs = {
    "ohms.html": {
      formId: "quizForm",
      resultId: "result",
      answers: { q1: "a", q2: "b" }
    },
    "arduino.html": {
      formId: "quizForm",
      resultId: "quizResult",
      answers: { q1: "a", q2: "b", q3: "b" }
    },
    "soldering.html": {
      formId: "quizForm",
      resultId: "result",
      answers: { q1: "b", q2: "b" }
    },
    "rfid.html": {
      formId: "quiz-form",
      resultId: "quiz-result",
      answers: { q1: "3.3V", q2: "SPI", q3: "Pin 10" }
    }
  };

  const file = path.split("/").pop();
  const config = quizConfigs[file];
  if (!config) return; // Not a quiz page

  function checkQuiz() {
    const quizForm = document.getElementById(config.formId);
    const result = document.getElementById(config.resultId);
    const answers = config.answers;

    let score = 0;
    let feedback = "";

    // Reset styles
    quizForm.querySelectorAll("label").forEach(label => {
      label.style.color = "";
    });

    for (let key in answers) {
      const correct = answers[key];
      const selected = quizForm.querySelector(`input[name="${key}"]:checked`);
      const correctInput = quizForm.querySelector(`input[name="${key}"][value="${correct}"]`);
      const correctLabel = correctInput ? correctInput.parentElement : null;

      if (selected) {
        if (selected.value === correct) {
          score++;
          feedback += `✔ Question ${key.slice(1)} is correct!<br>`;
          selected.parentElement.style.color = "green";
        } else {
          feedback += `✘ Question ${key.slice(1)} is incorrect. Correct answer: <strong>${correct}</strong><br>`;
          selected.parentElement.style.color = "red";
          if (correctLabel) correctLabel.style.color = "green";
        }
      } else {
        feedback += `⚠ Question ${key.slice(1)} not answered.<br>`;
        if (correctLabel) correctLabel.style.color = "green";
      }
    }

    result.innerHTML = `You got <strong>${score}/${Object.keys(answers).length}</strong> correct.<br><br>${feedback}`;
  }

  const submitBtn = document.querySelector(`#${config.formId} button`);
  if (submitBtn) {
    submitBtn.addEventListener("click", checkQuiz);
  }
});


// =========================
// DEVICE CLASS
// =========================
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

// Lightweight client-side filters
    (function () {
      const q = (sel) => document.querySelector(sel);
      const qa = (sel) => Array.from(document.querySelectorAll(sel));

      const search = q('#search');
      const level = q('#level');
      const topic = q('#topic');
      const clearBtn = q('#clearFilters');
      const empty = q('#emptyState');

      function matches(card) {
        const term = (search.value || '').trim().toLowerCase();
        const byTerm = !term || card.textContent.toLowerCase().includes(term);
        const byLevel = !level.value || card.dataset.level === level.value;
        const byTopic = !topic.value || card.dataset.topic === topic.value;
        return byTerm && byLevel && byTopic;
      }

      function applyFilters() {
        let shown = 0;
        qa('#tutorialList .card').forEach((card) => {
          const ok = matches(card);
          card.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        empty.hidden = shown !== 0;
      }

      [search, level, topic].forEach((el) => el.addEventListener('input', applyFilters));
      clearBtn.addEventListener('click', () => {
        search.value = '';
        level.value = '';
        topic.value = '';
        applyFilters();
        search.focus();
      });

      applyFilters();
    })();