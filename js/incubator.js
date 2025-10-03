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
  const ideaForm = document.getElementById("ideaForm");
  const ideaList = document.getElementById("ideaList");
  const emptyMessage = document.getElementById("emptyIdeas");
  const incubatorContainer = document.querySelector(".incubator-container");
  const detailContainer = document.getElementById("ideaDetail");

  let loggedInUser = null;
  let ideasData = [];
  let currentIdeaId = null;

  // ==============================
  // RENDER IDEA CARDS
  // ==============================
  function renderIdeas() {
    ideaList.innerHTML = "";

    if (ideasData.length === 0) {
      emptyMessage.style.display = "block";
      return;
    }
    emptyMessage.style.display = "none";

    // use uid to identify the logged-in user for sorting/ownership
    const userUid = loggedInUser ? loggedInUser.uid : null;

    const sortedIdeas = ideasData.slice().sort((a, b) => {
      if (!userUid) return 0;
      const aIsMine = a.authorId === userUid;
      const bIsMine = b.authorId === userUid;
      return aIsMine === bIsMine ? 0 : aIsMine ? -1 : 1;
    });

    sortedIdeas.forEach(idea => {
      const isMine = loggedInUser && idea.authorId === loggedInUser.uid;
      addIdeaCard(
        idea.id,
        idea.title,
        idea.desc,
        idea.tags || [],
        idea.collaborators || [],
        idea.collaboratorLimit || 5,
        idea.author || "Unknown",
        idea.authorId || null,
        isMine
      );
    });
  }

  // ==============================
  // ADD SINGLE CARD
  // ==============================
  function addIdeaCard(id, title, desc, tags, collaborators = [], collaboratorLimit = 5, author = "Unknown", authorId = null, isMine = false) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = id;

    if (isMine) card.classList.add("my-idea");

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
        ${tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <div class="card__collaborators">
        Collaborators: ${collaborators.length} / ${collaboratorLimit}
      </div>
    `;

    // ✅ Only logged-in users can open detail view
    if (loggedInUser) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;

        document.querySelectorAll('.card.active').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        showIdeaDetail(id);
      });
    }

    // ✅ Only logged-in users can join/cancel
    if (loggedInUser && !isMine) {
      const userUid = loggedInUser.uid; // use UID for firestore rules compatibility
      const alreadyCollaborator = collaborators.includes(userUid);
      const joinBtn = document.createElement("button");
      joinBtn.className = "btn join-btn";

      if (alreadyCollaborator) {
        joinBtn.textContent = "Cancel Collaboration";
        joinBtn.onclick = async (e) => {
          e.stopPropagation();
          // remove user (by uid) from collaborators and set this user's collaboration flag to 0
          await updateDoc(doc(db, "ideas", id), {
            collaborators: arrayRemove(userUid),
            [`collaborationActions.${userUid}`]: 0
          });
        };
      } else {
        joinBtn.textContent = "Join as Collaborator";
        joinBtn.disabled = collaborators.length >= collaboratorLimit;
        joinBtn.onclick = async (e) => {
          e.stopPropagation();
          // add user (by uid) to collaborators and set this user's collaboration flag to 1
          await updateDoc(doc(db, "ideas", id), {
            collaborators: arrayUnion(userUid),
            [`collaborationActions.${userUid}`]: 1
          });
        };
      }

      card.appendChild(joinBtn);
    }

    ideaList.appendChild(card);
  }

  // ==============================
  // DETAIL VIEW
  // ==============================
  function showIdeaDetail(ideaId) {
    currentIdeaId = ideaId;
    const idea = ideasData.find(i => i.id === ideaId);
    if (!idea) return;

    incubatorContainer.classList.add("details-view");
    detailContainer.innerHTML = "";

    // check ownership via authorId
    const isMyIdea = loggedInUser && idea.authorId === loggedInUser.uid;

    if (isMyIdea) {
      const form = document.createElement("form");
      form.id = "editIdeaForm";
      form.innerHTML = `
        <h2>Edit Idea</h2>
        <input type="text" id="editIdeaTitle" value="${idea.title}" required>
        <textarea id="editIdeaDesc" required>${idea.desc}</textarea>
        <input type="text" id="editIdeaTags" value="${(idea.tags || []).join(", ")}">
        <button type="submit" class="btn">Save Changes</button>
      `;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await updateDoc(doc(db, "ideas", idea.id), {
          title: document.getElementById("editIdeaTitle").value.trim(),
          desc: document.getElementById("editIdeaDesc").value.trim(),
          tags: document.getElementById("editIdeaTags").value.split(",").map(t => t.trim()).filter(Boolean)
        });
      });
      detailContainer.appendChild(form);
    } else {
      detailContainer.innerHTML = `
        <div class="incubator-card big-card idea-incubator">
          <h2>${idea.title}</h2>
          <p>${idea.desc}</p>
          <p><strong>Tags:</strong> ${(idea.tags || []).join(", ")}</p>
          <p><strong>Author:</strong> ${idea.author}</p>
          <p><strong>Collaborators:</strong> ${(idea.collaborators || []).length} / ${idea.collaboratorLimit}</p>
        </div>
      `;
    }
  }

  function resetView() {
    incubatorContainer.classList.remove("details-view");
    detailContainer.innerHTML = "";
    currentIdeaId = null;
    document.querySelectorAll('.card.active').forEach(c => c.classList.remove('active'));
  }

  document.addEventListener("click", (e) => {
    if (
      incubatorContainer.classList.contains("details-view") &&
      !e.target.closest(".card") &&
      !e.target.closest(".details-column")
    ) {
      resetView();
    }
  });

  // ==============================
  // FIREBASE LISTENERS
  // ==============================
  onAuthStateChanged(auth, (user) => {
    loggedInUser = user || null;

    // ✅ Disable form if not logged in
    if (ideaForm) {
      ideaForm.querySelectorAll("input, textarea, button").forEach(el => {
        el.disabled = !loggedInUser;
      });
    }

    ideaList.dataset.loggedIn = loggedInUser ? "true" : "false";
    renderIdeas();
  });

  ideaForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!loggedInUser) return; // restrict posting

    const title = document.getElementById("ideaTitle").value.trim();
    const desc = document.getElementById("ideaDesc").value.trim();
    const tags = document.getElementById("ideaTags").value.split(",").map(t => t.trim()).filter(Boolean);

    if (!title || !desc) return;

    const userUid = loggedInUser.uid;
    const displayName = loggedInUser.displayName || loggedInUser.email || userUid;

    // include authorId (uid) so security rules can check ownership,
    // and store collaborators as uids
    await addDoc(collection(db, "ideas"), {
      title,
      desc,
      tags,
      collaborators: [],
      collaboratorLimit: 5,
      author: displayName,
      authorId: userUid,
      collaborationActions: {} // initialize map for per-user join/cancel flags
    });
    ideaForm.reset();
  });

  onSnapshot(collection(db, "ideas"), (snapshot) => {
    ideasData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderIdeas();
    if (currentIdeaId && loggedInUser) showIdeaDetail(currentIdeaId);
  });
}
