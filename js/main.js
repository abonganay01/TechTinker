// This file contains the JavaScript code for the application, handling interactivity and dynamic content on the web pages.

// Function to load a specific page
function loadPage(page) {
    const main = document.querySelector('main');
    fetch(`pages/${page}.html`)
        .then(response => response.text())
        .then(data => {
            main.innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading page:', error);
            main.innerHTML = '<section class="error"><p>Error loading page. Please try again later.</p></section>';
        });
}

// Event listeners for navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = event.target.getAttribute('href').split('/').pop().replace('.html', '');
            loadPage(page);
        });
    });

    // Optionally, only use dynamic loading if a #content or SPA structure is present
    // Load the default page if desired
    // loadPage('showcase');
});