import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export function initIncubator() {
  const ideaForm = document.getElementById('ideaForm');
  const ideaList = document.getElementById('ideaList');
  const emptyMessage = document.getElementById('emptyIdeas');

  function addIdeaCard(title, desc, tags) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card__body">
        <h3 class="card__title">${title}</h3>
        <p class="card__text">${desc}</p>
      </div>
      <div class="card__footer">
        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    `;
    ideaList.appendChild(card);
  }

  async function loadIdeas() {
    try {
      const querySnapshot = await getDocs(collection(db, "ideas"));
      if (querySnapshot.empty) {
        emptyMessage.style.display = 'block';
        return;
      }
      querySnapshot.forEach(doc => {
        const data = doc.data();
        addIdeaCard(data.title, data.desc, data.tags || []);
      });
      emptyMessage.style.display = 'none';
    } catch (err) {
      console.error("Error loading ideas:", err);
    }
  }

  loadIdeas();

  ideaForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ideaTitle').value.trim();
    const desc = document.getElementById('ideaDesc').value.trim();
    const tags = document.getElementById('ideaTags').value
      .trim().split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !desc) return;

    try {
      await addDoc(collection(db, "ideas"), { title, desc, tags });
      console.log("Idea saved to Firestore!");
    } catch (err) {
      console.error("Error saving idea:", err);
    }

    addIdeaCard(title, desc, tags);
    emptyMessage.style.display = 'none';
    ideaForm.reset();
  });
}
