document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // Get base path dynamically
    // =========================
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const basePath = isInPagesFolder ? '../' : '';

    // =========================
    // Make header title clickable to go to home
    // =========================
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = `${basePath}index.html`;
        });
    }

    // =========================
    // Load navbar if placeholder exists
    // =========================
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        const navbarPath = `${basePath}navbar.html`;

        fetch(navbarPath)
            .then(response => {
                if (!response.ok) throw new Error('Navbar file not found');
                return response.text();
            })
            .then(data => {
                navbarPlaceholder.innerHTML = data;

                // After navbar loads, activate dropdown functionality
                initNavbarDropdown();
                highlightActiveLink();
            })
            .catch(error => console.error('Error loading navbar:', error));
    }

    // =========================
    // Make cards clickable
    // =========================
    const cardLinks = {
        'Showcase': `${basePath}pages/showcase.html`,
        'Forum': `${basePath}pages/forum.html`,
        'Tutorials': `${basePath}pages/tutorials.html`,
        'Incubator': `${basePath}pages/incubator.html`
    };

    document.querySelectorAll('main .card').forEach(card => {
        const heading = card.querySelector('h3');
        if (heading) {
            const destination = cardLinks[heading.textContent.trim()];
            if (destination) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = destination;
                });
            }
        }
    });

    // =========================
    // Form validation for project submission
    // =========================
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', event => {
            const fileInput = document.getElementById('project-file');
            const linkInput = document.getElementById('project-link');

            if (!fileInput.value && !linkInput.value) {
                event.preventDefault();
                alert('Please provide either a project link or upload a file.');
            }
        });
    }

    // =========================
    // Initialize Dropdown (Projects menu)
    // =========================
    function initNavbarDropdown() {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            const toggleLink = dropdown.querySelector('.dropbtn');
            const dropdownContent = dropdown.querySelector('.dropdown-content');

            if (toggleLink && dropdownContent) {
                toggleLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent navigation on the main button
                    dropdownContent.classList.toggle('show');
                });

                // Close dropdown on outside click
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdownContent.classList.remove('show');
                    }
                });
            }
        }
    }

    // =========================
    // Highlight active link in navbar
    // =========================
    function highlightActiveLink() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.style.backgroundColor = '#63b3ed';
                link.style.color = '#2d3748';
                link.style.borderRadius = '6px';
            }
        });
    }
});
