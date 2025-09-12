import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  increment
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export function initForum() {
  const usernameInput = document.getElementById("usernameInput");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");
  const commentsList = document.getElementById("commentsList");
  const sortSelect = document.getElementById("sortSelect");

  const commentsRef = collection(db, "comments");

  // Pagination state for top-level comments
  let lastVisible = null;
  let loading = false;
  const pageSize = 10;

  async function loadComments(reset = false) {
    if (loading) return;
    loading = true;

    if (reset) commentsList.innerHTML = "";

    let q;
    if (sortSelect?.value === "votes") {
      q = query(commentsRef, orderBy("votes", "desc"), limit(pageSize));
    } else {
      q = query(commentsRef, orderBy("timestamp", "desc"), limit(pageSize));
    }

    if (lastVisible && !reset) {
      q = query(
        commentsRef,
        orderBy(sortSelect?.value === "votes" ? "votes" : "timestamp", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      loading = false;
      return;
    }

    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    all.filter(c => !c.parentId).forEach(c => renderNode(c));

    loading = false;
  }

  // Render one comment (with reply controls)
  function renderNode(comment, depth = 0) {
    const div = document.createElement("div");
    div.classList.add("comment");
    div.style.marginLeft = depth * 20 + "px";

    div.innerHTML = `
      <p><strong>${comment.username ?? "Anonymous"}</strong></p>
      <p>${comment.text ?? ""}</p>
      <div class="vote-section">
        <span class="vote-btn" data-id="${comment.id}" data-action="upvote">⬆</span>
        <span class="vote-count">${comment.votes ?? 0}</span>
        <span class="vote-btn" data-id="${comment.id}" data-action="downvote">⬇</span>
        <span class="vote-count">${comment.downvotes ?? 0}</span>
        <span class="reply-btn" data-id="${comment.id}">Reply</span>
      </div>
      <div class="replies" id="replies-${comment.id}" style="display:none"></div>
      <button class="toggle-replies-btn" data-id="${comment.id}">Show replies</button>
    `;

    commentsList.appendChild(div);
  }

  // Replies state management
  const repliesState = {}; // { commentId: { lastVisible, container, loading, visible } }
  const repliesPageSize = 5;

  async function loadReplies(parentId) {
    if (!repliesState[parentId]) {
      repliesState[parentId] = {
        lastVisible: null,
        loading: false,
        container: document.getElementById(`replies-${parentId}`),
        visible: false
      };
    }
    const state = repliesState[parentId];

    if (state.loading) return;
    state.loading = true;

    let q = query(
      commentsRef,
      orderBy("timestamp", "asc"),
      limit(repliesPageSize)
    );

    if (state.lastVisible) {
      q = query(
        commentsRef,
        orderBy("timestamp", "asc"),
        startAfter(state.lastVisible),
        limit(repliesPageSize)
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      state.loading = false;
      return;
    }

    state.lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const replies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    replies
      .filter(r => r.parentId === parentId)
      .forEach(r => {
        const replyDiv = document.createElement("div");
        replyDiv.classList.add("comment");
        replyDiv.style.marginLeft = "20px";
        replyDiv.innerHTML = `
          <p><strong>${r.username ?? "Anonymous"}</strong></p>
          <p>${r.text ?? ""}</p>
          <div class="vote-section">
            <span class="vote-btn" data-id="${r.id}" data-action="upvote">⬆</span>
            <span class="vote-count">${r.votes ?? 0}</span>
            <span class="vote-btn" data-id="${r.id}" data-action="downvote">⬇</span>
            <span class="vote-count">${r.downvotes ?? 0}</span>
            <span class="reply-btn" data-id="${r.id}">Reply</span>
          </div>
          <div class="replies" id="replies-${r.id}" style="display:none"></div>
          <button class="toggle-replies-btn" data-id="${r.id}">Show replies</button>
        `;
        state.container.appendChild(replyDiv);
      });

    state.loading = false;
  }

  // Toggle replies visibility
  function toggleReplies(parentId, btn) {
    const state = repliesState[parentId];
    if (!state) {
      // first time load
      loadReplies(parentId).then(() => {
        repliesState[parentId].visible = true;
        state.container.style.display = "block";
        btn.textContent = "Hide replies";
      });
      return;
    }

    if (state.visible) {
      state.container.style.display = "none";
      btn.textContent = "Show replies";
      state.visible = false;
    } else {
      state.container.style.display = "block";
      btn.textContent = "Hide replies";
      if (!state.lastVisible) {
        // no replies loaded yet
        loadReplies(parentId);
      }
      state.visible = true;
    }
  }

  // Post top-level comment
  postCommentBtn?.addEventListener("click", async () => {
    const username = usernameInput.value.trim() || "Anonymous";
    const text = commentInput.value.trim();
    if (!text) return;

    await addDoc(commentsRef, {
      username,
      text,
      votes: 0,
      downvotes: 0,
      timestamp: Date.now(),
      parentId: null
    });

    usernameInput.value = commentInput.value = "";
    lastVisible = null; // reset pagination
    await loadComments(true);
  });

  // Handle votes, replies, reply box, toggle replies
  commentsList?.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;

    if (e.target.classList.contains("vote-btn")) {
      const action = e.target.dataset.action;
      const targetDoc = doc(db, "comments", id);
      await updateDoc(targetDoc, {
        [action === "upvote" ? "votes" : "downvotes"]: increment(1)
      });
    }

    if (e.target.classList.contains("reply-btn")) {
      toggleInlineReply(e.target.closest(".comment"), id);
    }

    if (e.target.classList.contains("toggle-replies-btn")) {
      toggleReplies(id, e.target);
    }
  });

  // Inline reply box
  function toggleInlineReply(parentDiv, parentId) {
    const existingBox = parentDiv.querySelector(".inline-reply");
    if (existingBox) { existingBox.remove(); return; }

    const replyBox = document.createElement("div");
    replyBox.classList.add("inline-reply");
    replyBox.style.marginTop = "8px";
    replyBox.innerHTML = `
      <input type="text" placeholder="Your name" class="reply-username">
      <textarea rows="2" placeholder="Write a reply..." class="reply-text"></textarea>
      <button class="reply-submit">Reply</button>
    `;
    parentDiv.appendChild(replyBox);

    replyBox.querySelector(".reply-submit").addEventListener("click", async () => {
      const username = replyBox.querySelector(".reply-username").value.trim() || "Anonymous";
      const text = replyBox.querySelector(".reply-text").value.trim();
      if (!text) return;

      await addDoc(commentsRef, {
        username,
        text,
        votes: 0,
        downvotes: 0,
        timestamp: Date.now(),
        parentId
      });

      replyBox.remove();
      // reset reply state so fresh reload happens
      repliesState[parentId] = null;
      loadReplies(parentId);
    });
  }

  // Infinite scroll for top-level comments
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadComments();
    }
  });

  sortSelect?.addEventListener("change", async () => {
    lastVisible = null;
    await loadComments(true);
  });

  // Initial load
  loadComments(true);
}
