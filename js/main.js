document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // Detect base URL dynamically for GitHub Pages or local
    // =========================
    const basePath = window.location.hostname.includes('github.io')
        ? '/TechTinker/' // Change this to your repo name
        : '/';

    // =========================
    // Make header title clickable to go to home
    // =========================
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = basePath + 'index.html';
        });
    }

    // =========================
    // Load navbar if placeholder exists
    // =========================
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
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

                // After navbar loads, fix Home link dynamically
                const homeLink = document.querySelector('.nav-menu li a[href="/index.html"]');
                if (homeLink) {
                    homeLink.setAttribute('href', basePath + 'index.html');
                }

                // Activate dropdown + highlight
                initNavbarDropdown();
                highlightActiveLink();
            })
            .catch(error => console.error('Error loading navbar:', error));
    }

    // =========================
    // Highlight active link in navbar
    // =========================
    function highlightActiveLink() {
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
    // Dropdown logic remains same
    // =========================
    function initNavbarDropdown() {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
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
    }
});
