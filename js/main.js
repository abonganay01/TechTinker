document.addEventListener('DOMContentLoaded', () => {
    // Detect base path and load components
    const basePath = detectBasePath();
    makeHeaderClickable(basePath);
    loadNavbar(basePath);

    // Add mousemove parallax effect
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;

        document.querySelectorAll(".parallax").forEach((element) => {
            const speed = element.getAttribute("data-speed");
            element.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
        });
    });
});


const signinButton = document.getElementById("signinButton");
const signinPage = document.getElementById("signinPage");
const closeIcon = document.getElementById("closeIcon");

signinButton.addEventListener("click", function(){
    signinPage.classList.remove("closeSignin")
    signinPage.classList.add("openSignin")
});

closeIcon.addEventListener("click", function(){
    signinPage.classList.remove("openSignin");
    signinPage.classList.add("closeSignin");
});


// =========================
// Detect base URL dynamically
// =========================
function detectBasePath() {
    return window.location.hostname.includes('github.io')
        ? '/TechTinker/' // Change this to your repo name
        : '/';
}

// =========================
// Make header title clickable to go home
// =========================
function makeHeaderClickable(basePath) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = basePath + 'index1.html';
        });
    }
}

// =========================
// Load navbar dynamically
// =========================
function loadNavbar(basePath) {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;

    let navbarPath = 'navbar.html';
    if (window.location.pathname.includes('/pages/')) {
        navbarPath = '../navbar.html';
    }

    fetch(navbarPath)
        .then(response => {
            if (!response.ok) throw new Error('Navbar file not found');
            return response.text();
        })
        .then(data => {
            navbarPlaceholder.innerHTML = data;
            fixHomeLink(basePath);
            initNavbarDropdown();
            highlightActiveLink(basePath);
        })
        .catch(error => console.error('Error loading navbar:', error));
}

// =========================
// Fix Home link dynamically
// =========================
function fixHomeLink(basePath) {
    const homeLink = document.querySelector('.nav-menu li a[href="/index.html"]');
    if (homeLink) {
        homeLink.setAttribute('href', basePath + 'index.html');
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
