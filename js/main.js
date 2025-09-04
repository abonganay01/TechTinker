document.addEventListener('DOMContentLoaded', () => {
    const basePath = detectBasePath();

    // Load components dynamically using resolvePath
    loadComponent(resolvePath('htmldesign/header.html'), 'header-placeholder', () => {
        makeHeaderClickable(basePath);
        loadNavbar(basePath);
        initSigninModal(); // Initialize sign-in only after header loads
    });

    loadComponent(resolvePath('htmldesign/hero.html'), 'hero-placeholder');
    loadComponent(resolvePath('htmldesign/footer.html'), 'footer-placeholder');
    

    // Add parallax effect
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;

        document.querySelectorAll(".parallax").forEach((element) => {
            const speed = element.getAttribute("data-speed");
            element.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
        });
    });
});

// =========================
// Load HTML Component
// =========================
function loadComponent(file, placeholderId, callback = null) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(placeholderId).innerHTML = data;
            if (callback) callback();
        })
        .catch(err => console.error(`Error loading ${file}:`, err));
}

// =========================
// Detect base URL dynamically
// =========================
function detectBasePath() {
    return window.location.hostname.includes('github.io')
        ? '/TechTinker/' // Change this to your repo name
        : '/';
}

// =========================
// Resolve correct path for components
// =========================
function resolvePath(file) {
    const basePath = detectBasePath();
    const isPagesDir = window.location.pathname.includes('/pages/');
    return isPagesDir ? '../' + file : file; // Use ../ when inside /pages/
}

// =========================
// Make header title clickable to go home
// =========================
function makeHeaderClickable(basePath) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = basePath + 'index.html';
        });
    }
}


// =========================
// Highlight active link
// =========================
function highlightActiveLink(basePath) {
    const currentPath = window.location.pathname.replace(basePath, '');
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').replace(basePath, '');
        if (linkPath === currentPath || (linkPath === 'index.html' && currentPath === '')) {
            link.style.backgroundColor = '#63b3ed';
            link.style.color = '#2d3748';
            link.style.borderRadius = '6px';
        }
    });
}

// =========================
// Initialize dropdown menu
// =========================
function initNavbarDropdown() {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown) return;

    const toggleLink = dropdown.querySelector('.dropbtn');
    const dropdownContent = dropdown.querySelector('.dropdown-content');

    if (toggleLink && dropdownContent) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownContent.classList.toggle('show');
        });

        

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
    }
}

// =========================
// Initialize Sign-In Modal
// =========================
function initSigninModal() {
    const signinButton = document.getElementById("signinButton");
    const signinPage = document.getElementById("signinPage");
    const closeIcon = document.getElementById("closeIcon");

    if (signinButton && signinPage && closeIcon) {
        signinButton.addEventListener("click", () => {
            signinPage.classList.remove("closeSignin");
            signinPage.classList.add("openSignin");
        });

        closeIcon.addEventListener("click", () => {
            signinPage.classList.remove("openSignin");
            signinPage.classList.add("closeSignin");
        });
    }
}
