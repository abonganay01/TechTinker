// ==============================
// showcase.js - User Submissions (with Firebase Storage)
// ==============================

import { db, app } from "./firebase-config.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const storage = getStorage(app);

// User project submissions
const form = document.querySelector('.submit-section form');
const fileInput = document.getElementById('project-file');
const urlInput = document.getElementById('project-url');

// Ensure user submissions section exists
let userSection = document.querySelector('.user-submissions');
if (!userSection) {
  userSection = document.createElement('section');
  userSection.classList.add('project-category', 'user-submissions');
  userSection.innerHTML = `
    <h3>🛠 User Submitted Projects</h3>
    <div class="project-grid"></div>
  `;
  const showcaseMain = document.querySelector('.center-container');
  showcaseMain.insertBefore(userSection, document.querySelector('.submit-section'));
}

const userGrid = userSection.querySelector('.project-grid');

// Render project card helper
function renderCard({ title, description, projectUrl, fileUrl, fileName, fileType }) {
  const card = document.createElement('div');
  card.classList.add('card');

  let mediaContent = '';
  if (fileUrl && fileType && fileType.startsWith('image/')) {
    mediaContent = `<img src="${fileUrl}" alt="${title}" style="border-radius:10px;">`;
  } else if (fileUrl) {
    mediaContent = `<a href="${fileUrl}" download="${fileName}">${fileName}</a>`;
  }

  let linkContent = '';
  if (projectUrl) {
    linkContent = `<a href="${projectUrl}" target="_blank" class="btn">View Project</a>`;
  }

  card.innerHTML = `
    ${mediaContent}
    <h4>${title}</h4>
    <p>${description}</p>
    ${linkContent}
  `;

  userGrid.appendChild(card);
}

// Load saved submissions from Firestore
async function loadProjects() {
  userGrid.innerHTML = ''; // clear before reload
  const snapshot = await getDocs(collection(db, "userProjects"));
  snapshot.forEach((doc) => {
    renderCard(doc.data());
  });
}
loadProjects();

// Form submission handling
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!fileInput.files.length && !urlInput.value.trim()) {
    alert('Please upload a file OR provide a project URL.');
    return;
  }

  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const file = fileInput.files[0];
  const projectUrl = urlInput.value.trim();

  // Prepare submission object
  const submission = {
    title,
    description,
    projectUrl: projectUrl || "",
    fileUrl: "",
    fileName: "",
    fileType: ""
  };

  try {
    // If a file is provided, upload to Firebase Storage
    if (file) {
      const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      submission.fileUrl = downloadURL;
      submission.fileName = file.name;
      submission.fileType = file.type;
    }

    // Save metadata to Firestore
    await addDoc(collection(db, "userProjects"), submission);

    // Render immediately
    renderCard(submission);
    form.reset();

  } catch (err) {
    console.error("Error saving project:", err);
    alert("❌ Failed to save project. Check console.");
  }
});
