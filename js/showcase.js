// =========================
// SHOWCASE.JS WITH FIREBASE REAL-TIME UPDATES (URL ONLY)
// =========================
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export function initShowcase() {
    // Elements
    const form = document.querySelector('.submit-section form');
    if (!form) return;

    const urlInput = document.getElementById('project-url');
    const titleInput = document.getElementById('project-title');
    const descInput = document.getElementById('project-description');

    if (!urlInput || !titleInput || !descInput) return;

    // Create "User Submissions" section if it doesn't exist
    let userSection = document.querySelector('.user-submissions');
    if (!userSection) {
        userSection = document.createElement('section');
        userSection.classList.add('project-category', 'user-submissions');
        userSection.innerHTML = `
            <h3>🛠 User Submitted Projects</h3>
            <div class="project-grid"></div>
        `;
        const showcaseMain = document.querySelector('.center-container');
        const submitSection = document.querySelector('.submit-section');
        if (showcaseMain && submitSection) {
            showcaseMain.insertBefore(userSection, submitSection);
        }
    }

    const userGrid = userSection.querySelector('.project-grid');

    // Helper: Create a project card
    function createProjectCard({ title, description, url }) {
        const card = document.createElement('div');
        card.classList.add('card');

        let linkContent = '';
        if (url) {
            linkContent = `<a href="${url}" target="_blank" class="btn">View Project</a>`;
        }

        card.innerHTML = `
            <h4>${title}</h4>
            <p>${description}</p>
            ${linkContent}
        `;

        userGrid.appendChild(card);
    }

    // REAL-TIME listener for Firestore "userProjects"
    const q = query(collection(db, "userProjects"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        userGrid.innerHTML = ""; // Clear grid before updating
        snapshot.forEach(doc => {
            const data = doc.data();
            createProjectCard({
                title: data.title,
                description: data.description,
                url: data.url
            });
        });
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const url = urlInput.value.trim();

        if (!title || !url) {
            alert('Please provide a title and a project URL.');
            return;
        }

        // Save project data to Firestore
        await addDoc(collection(db, "userProjects"), {
            title,
            description,
            url,
            timestamp: serverTimestamp()
        });

        // Reset form
        form.reset();
        alert("Project submitted successfully!");
    });
}
