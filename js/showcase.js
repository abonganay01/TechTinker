// js/showcase.js
import { db, storage } from './firebase-config.js';
import {
  collection, addDoc, query, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const projectsRef = collection(db, 'projects');
const projectGrid = document.querySelector('.project-grid');
const form = document.querySelector('.submit-section form');

const q = query(projectsRef, orderBy('createdAt', 'desc'));
onSnapshot(q, snapshot => {
  if (!projectGrid) return;
  const arr = snapshot.docs.map(d => d.data());
  projectGrid.innerHTML = arr.map(p => `
    <div class="card">
      <img src="${p.imageUrl || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${p.title}">
      <h4>${p.title}</h4>
      <p>${p.description}</p>
      ${p.projectUrl ? `<a href="${p.projectUrl}" target="_blank" class="btn">View Project</a>` : ''}
    </div>
  `).join('');
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const projectUrl = document.getElementById('project-url').value.trim();
  const fileInput = document.getElementById('project-file');
  const file = fileInput?.files?.[0];

  if (!title || !description) return alert('Title and description required.');

  let imageUrl = '';
  if (file) {
    const stRef = storageRef(storage, `projects/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(stRef, file);

    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        () => {},
        (err) => reject(err),
        async () => {
          imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve();
        }
      );
    });
  }

  await addDoc(projectsRef, {
    title, description, projectUrl, imageUrl, createdAt: serverTimestamp()
  });

  form.reset();
});
