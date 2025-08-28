document.addEventListener('DOMContentLoaded', () => {
    // Make header title clickable to go to home
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }

    // Load navbar if placeholder exists
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        let navbarPath = 'navbar.html';
        if (window.location.pathname.includes('/pages/')) {
            navbarPath = '../navbar.html';
        }
        fetch(navbarPath)
            .then(response => response.text())
            .then(data => {
                navbarPlaceholder.innerHTML = data;
            });
    }

    // Make cards clickable
    const cardLinks = {
        'Showcase': 'pages/showcase.html',
        'Forum': 'pages/forum.html',
        'Tutorials': 'pages/tutorials.html',
        'Incubator': 'pages/incubator.html'
    };

    document.querySelectorAll('main .card').forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && cardLinks[heading.textContent.trim()]) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = cardLinks[heading.textContent.trim()];
            });
        }
    });
});
