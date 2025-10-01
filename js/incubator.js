import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export function initIncubator() {
  const ideaForm = document.getElementById('ideaForm');
  const ideaList = document.getElementById('ideaList');
  const emptyMessage = document.getElementById('emptyIdeas');

  let loggedInUser = null;
  let ideasData = []; // local copy of ideas
  let currentIdeaId = null; // track open detail view

  function renderIdeas() {
    ideaList.innerHTML = "";

    if (ideasData.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';

    const sortedIdeas = ideasData.slice().sort((a, b) => {
      if (!loggedInUser) return 0;
      const aIsMine = a.author === (loggedInUser.displayName || loggedInUser.email);
      const bIsMine = b.author === (loggedInUser.displayName || loggedInUser.email);
      return aIsMine === bIsMine ? 0 : aIsMine ? -1 : 1;
    });

    sortedIdeas.forEach(idea => {
      const isMine = loggedInUser && idea.author === (loggedInUser.displayName || loggedInUser.email);
      addIdeaCard(
        idea.id,
        idea.title,
        idea.desc,
        idea.tags || [],
        idea.collaborators || [],
        idea.collaboratorLimit || 5,
        idea.author || "Unknown",
        isMine
      );
    });
  }

  function addIdeaCard(id, title, desc, tags, collaborators = [], collaboratorLimit = 5, author = "Unknown", isMine = false) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = id;

    if (isMine) card.classList.add('my-idea');

    card.innerHTML = `
      <div class="card__body">
        <h3 class="card__title">
          ${title}
          ${isMine ? `<span class="my-idea-badge">Your Idea</span>` : ""}
        </h3>
        <p class="card__text">${desc}</p>
        <p class="card__author"><strong>Author:</strong> ${author}</p>
      </div>
      <div class="card__footer">
        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <div class="card__collaborators">
        Collaborators: ${collaborators.length} / ${collaboratorLimit}
      </div>
    `;

    // ✅ Fix: prevent button clicks from triggering detail view
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // ignore button clicks
      showIdeaDetail(id);
    });

    if (!isMine && loggedInUser) {
      const alreadyCollaborator = collaborators.includes(loggedInUser.email);
      const joinBtn = document.createElement('button');
      joinBtn.className = 'btn join-btn';

      if (alreadyCollaborator) {
        joinBtn.textContent = "Cancel Collaboration";
        joinBtn.disabled = false;
        joinBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const ideaRef = doc(db, "ideas", id);
            await updateDoc(ideaRef, {
              collaborators: arrayRemove(loggedInUser.email)
            });
          } catch (err) {
            console.error("Error cancelling collaboration:", err);
          }
        };
      } else {
        joinBtn.textContent = "Join as Collaborator";
        joinBtn.disabled = collaborators.length >= collaboratorLimit;
        joinBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const ideaRef = doc(db, "ideas", id);
            await updateDoc(ideaRef, {
              collaborators: arrayUnion(loggedInUser.email)
            });
          } catch (err) {
            console.error("Error joining idea:", err);
          }
        };
      }

      card.appendChild(joinBtn);
    }

    ideaList.appendChild(card);
  }

  function updateJoinButtons() {
    ideasData.forEach(idea => {
      const card = ideaList.querySelector(`.card[data-id="${idea.id}"]`);
      if (!card) return;

      const collabDiv = card.querySelector(".card__collaborators");

      // 🚫 Skip if it's my idea → no join button at all
      const isMine = loggedInUser && idea.author === (loggedInUser.displayName || loggedInUser.email);
      if (isMine) {
        const existingBtn = card.querySelector('.join-btn');
        if (existingBtn) existingBtn.remove(); // remove if somehow already present
        collabDiv.textContent = `Collaborators: ${idea.collaborators.length} / ${idea.collaboratorLimit}`;
        return;
      }

      // --- existing join button logic here ---
      let joinBtn = card.querySelector('.join-btn');
      const alreadyCollaborator = loggedInUser && idea.collaborators.includes(loggedInUser.email);

      if (!joinBtn && loggedInUser) {
        joinBtn = document.createElement('button');
        joinBtn.className = 'btn join-btn';
        card.appendChild(joinBtn);
      }

      if (joinBtn) {
        joinBtn.textContent = alreadyCollaborator ? "Cancel Collaboration" : "Join as Collaborator";
        joinBtn.disabled = !alreadyCollaborator && idea.collaborators.length >= idea.collaboratorLimit;

        joinBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const ideaRef = doc(db, "ideas", idea.id);
            if (alreadyCollaborator) {
              await updateDoc(ideaRef, { collaborators: arrayRemove(loggedInUser.email) });
            } else {
              await updateDoc(ideaRef, { collaborators: arrayUnion(loggedInUser.email) });
            }
          } catch (err) {
            console.error("Error updating collaboration:", err);
          }
        };
      }

      collabDiv.textContent = `Collaborators: ${idea.collaborators.length} / ${idea.collaboratorLimit}`;
    });
  }


  function updateUI() {
    renderIdeas();
    updateJoinButtons();
    if (currentIdeaId) {
      showIdeaDetail(currentIdeaId);
    }
  }

  let previousLoginState = null;

  onAuthStateChanged(auth, (user) => {
    const isLoggedIn = !!user;
    loggedInUser = user;
    ideaList.dataset.loggedIn = isLoggedIn ? "true" : "false";

    if (ideaForm) {
      ideaForm.querySelectorAll("input, textarea, button").forEach(el => {
        el.disabled = !user;
      });
    }

    // Only re-render when login state changes
    if (previousLoginState !== isLoggedIn) {
      previousLoginState = isLoggedIn;
      renderIdeas();
    }
  });

  ideaForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loggedInUser) {
      alert("You must be logged in to pitch an idea.");
      return;
    }

    const title = document.getElementById('ideaTitle').value.trim();
    const desc = document.getElementById('ideaDesc').value.trim();
    const tags = document.getElementById('ideaTags').value
      .trim().split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !desc) return;

    const newIdea = {
      title,
      desc,
      tags,
      collaborators: [],
      collaboratorLimit: 5,
      author: loggedInUser.displayName || loggedInUser.email
    };

    try {
      await addDoc(collection(db, "ideas"), newIdea);
      ideaForm.reset();
    } catch (err) {
      console.error("Error saving idea:", err);
    }
  });

  onSnapshot(collection(db, "ideas"), (snapshot) => {
    const newIdeasData = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // Find changes instead of re-rendering all
    newIdeasData.forEach(newIdea => {
      const existingIdea = ideasData.find(i => i.id === newIdea.id);
      if (!existingIdea) {
        // New idea added → add card
        ideasData.push(newIdea);
        addIdeaCard(
          newIdea.id,
          newIdea.title,
          newIdea.desc,
          newIdea.tags || [],
          newIdea.collaborators || [],
          newIdea.collaboratorLimit || 5,
          newIdea.author || "Unknown",
          loggedInUser && newIdea.author === (loggedInUser.displayName || loggedInUser.email)
        );
      } else if (JSON.stringify(existingIdea) !== JSON.stringify(newIdea)) {
        // Idea updated → update relevant UI
        const index = ideasData.findIndex(i => i.id === newIdea.id);
        ideasData[index] = newIdea;
        updateJoinButtons(); // Only update join buttons
      }
    });

    updateUI();
  });

  window.showIdeaDetail = function (ideaId) {
    currentIdeaId = ideaId;

    const idea = ideasData.find(i => i.id === ideaId);
    const detailContainer = document.getElementById("ideaDetail");
    if (!idea) return;

    detailContainer.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to ideas";
    backBtn.className = "btn back-btn";
    backBtn.addEventListener("click", () => {
      detailContainer.innerHTML = "";
      currentIdeaId = null;
    });
    detailContainer.appendChild(backBtn);

    const isMyIdea = loggedInUser && idea.author === (loggedInUser.displayName || loggedInUser.email);

    if (isMyIdea) {
      const form = document.createElement("form");
      form.id = "editIdeaForm";
      form.innerHTML = `
        <h2>Edit Idea</h2>
        <label>Title</label>
        <input type="text" id="editIdeaTitle" value="${idea.title}" required>
        <label>Description</label>
        <textarea id="editIdeaDesc" required>${idea.desc}</textarea>
        <label>Tags (comma separated)</label>
        <input type="text" id="editIdeaTags" value="${idea.tags.join(", ")}">
        <button type="submit" class="btn">Save Changes</button>
      `;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const ideaRef = doc(db, "ideas", idea.id);
          await updateDoc(ideaRef, {
            title: document.getElementById("editIdeaTitle").value.trim(),
            desc: document.getElementById("editIdeaDesc").value.trim(),
            tags: document.getElementById("editIdeaTags").value
              .split(",")
              .map(t => t.trim())
              .filter(Boolean)
          });
        } catch (err) {
          console.error("Error editing idea:", err);
        }
      });
      detailContainer.appendChild(form);
    } else {
      detailContainer.innerHTML += `
        <h2>${idea.title}</h2>
        <p>${idea.desc}</p>
        <p><strong>Tags:</strong> ${idea.tags.join(", ")}</p>
        <p><strong>Author:</strong> ${idea.author}</p>
        <p><strong>Collaborators:</strong> ${idea.collaborators.length} / ${idea.collaboratorLimit}</p>
      `;
    }
  };
}
