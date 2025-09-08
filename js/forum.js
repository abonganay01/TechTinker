// js/forum.js
import { db } from './firebase-config.js';
import {
  collection, addDoc, query, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM
const commentsList = document.getElementById('commentsList');
const postBtn = document.getElementById('postCommentBtn');

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch])); }

const commentsRef = collection(db, 'comments');
const q = query(commentsRef, orderBy('createdAt', 'desc'));

// realtime listener
onSnapshot(q, snapshot => {
  if (!commentsList) return;
  commentsList.innerHTML = snapshot.docs.map(doc => {
    const c = doc.data();
    return `<div class="comment"><strong>${escapeHtml(c.username)}</strong>: ${escapeHtml(c.text)}</div>`;
  }).join('') || `<p class="muted">No comments yet.</p>`;
});

postBtn?.addEventListener('click', async () => {
  const username = document.getElementById('usernameInput').value.trim();
  const text = document.getElementById('commentInput').value.trim();
  if (!username || !text) return alert('Please enter name and comment.');

  await addDoc(commentsRef, {
    username,
    text,
    votes: 0,
    createdAt: serverTimestamp()
  });

  document.getElementById('usernameInput').value = '';
  document.getElementById('commentInput').value = '';
});
