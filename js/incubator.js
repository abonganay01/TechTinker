// js/incubator.js
import { db } from './firebase-config.js';
import {
  collection, addDoc, query, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ideaList = document.getElementById('ideaList');
const ideaForm = document.getElementById('ideaForm');
const ideasRef = collection(db, 'ideas');
const q = query(ideasRef, orderBy('createdAt', 'desc'));

onSnapshot(q, snapshot => {
  if (!ideaList) return;
  const ideas = snapshot.docs.map(doc => doc.data());
  if (!ideas.length) {
    ideaList.innerHTML = `<p class="muted" id="emptyIdeas">No ideas yet. Be the first to pitch!</p>`;
    return;
  }
  ideaList.innerHTML = ideas.map(i => `
    <div class="card">
      <h4>${i.title}</h4>
      <p>${i.description}</p>
      <small>Tags: ${i.tags || ''}</small>
    </div>
  `).join('');
});

ideaForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('ideaTitle').value.trim();
  const description = document.getElementById('ideaDesc').value.trim();
  const tags = document.getElementById('ideaTags').value.trim();

  if (!title || !description) return alert('Title + description required.');

  await addDoc(ideasRef, {
    title, description, tags, createdAt: serverTimestamp()
  });

  ideaForm.reset();
});
