// =========================
// FORUM MODULE (Realtime Firestore + Auth integration)
// =========================
import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  increment,
  getDoc,
  arrayUnion,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Prevent multiple initializations
let forumInitialized = false;

// --- NEW: local anonymous identity for unauthenticated users ---
const ANON_ID_KEY = "tt_anon_id";
const ANON_NAME_KEY = "tt_anon_name";
function getOrCreateAnonId() {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = "anon-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}
const localAnonId = getOrCreateAnonId();

export function initForum() {
  if (forumInitialized) return;
  forumInitialized = true;

  const usernameInput = document.getElementById("usernameInput");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");
  const commentsList = document.getElementById("commentsList");
  const emptyMessage = document.getElementById("emptyCommentsMsg");
  const sortSelect = document.getElementById("sortSelect");
  const authStatusText = document.getElementById("authStatusText");
  const systemMessageEl = document.getElementById("systemMessage");

  // Shared Firestore path
  const commentsRef = collection(db, "forumComments");
  let cachedComments = [];
  let currentUser = null;

  // -------------------------
  // System Message (non-blocking UI feedback)
  // -------------------------
  function displayMessage(text, type = "info") {
    if (!systemMessageEl) return;
    systemMessageEl.textContent = text;
    systemMessageEl.className = type === "error" ? "msg-error" : "msg-info";
    systemMessageEl.style.display = "block";
    setTimeout(() => (systemMessageEl.style.display = "none"), 4000);
  }

  // -------------------------
  // Auth state
  // -------------------------
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
    } else {
      // Synthesize a lightweight local anonymous "user" so UI logic can use uid
      const storedName = localStorage.getItem(ANON_NAME_KEY) || null;
      currentUser = {
        uid: localAnonId,
        displayName: storedName,
        email: null,
        isLocalAnon: true,
      };
    }

    if (currentUser && !currentUser.isLocalAnon) {
      console.log("✅ Logged in:", currentUser.email || currentUser.uid);
      if (postCommentBtn) postCommentBtn.disabled = false;
      if (commentInput) commentInput.disabled = false;
      if (usernameInput) usernameInput.style.display = "none";
      if (authStatusText)
        authStatusText.textContent = `Logged in as: ${currentUser.email || "User"}`;
    } else {
      console.log("ℹ️ Using local anonymous identity:", currentUser.uid);
      // Allow local anonymous posting/interactions (rules allow it)
      if (postCommentBtn) postCommentBtn.disabled = false;
      if (commentInput) commentInput.disabled = false;
      if (usernameInput) {
        usernameInput.style.display = "block";
        usernameInput.value = currentUser.displayName || "";
        usernameInput.placeholder = "Enter a display name (optional)";
      }
      if (authStatusText) authStatusText.textContent = "Posting as local anonymous user.";
    }

    renderComments(cachedComments);
  });

  // -------------------------
  // Render comments
  // -------------------------
  function renderComments(comments) {
    if (!commentsList) return;
    commentsList.innerHTML = "";

    if (comments.length === 0) {
      emptyMessage.style.display = "block";
      return;
    } else {
      emptyMessage.style.display = "none";
    }

    const sorted = [...comments];
    if (sortSelect?.value === "votes") {
      sorted.sort(
        (a, b) =>
          (b.votes - b.downvotes) - (a.votes - a.downvotes)
      );
    } else {
      sorted.sort(
        (a, b) =>
          (b.timestamp?.toMillis?.() || 0) -
          (a.timestamp?.toMillis?.() || 0)
      );
    }

    sorted.forEach((comment) => {
      comment.votes ??= 0;
      comment.downvotes ??= 0;
      comment.replies ??= [];
      comment.voters ??= {};
      const isAuthor = currentUser && currentUser.uid === comment.authorId;

      const div = document.createElement("div");
      div.className = "comment";

      const voteUI = currentUser
        ? `
          <span class="vote-btn ${comment.voters[currentUser.uid] === "upvote" ? "upvoted" : ""}" 
                data-type="comment" data-id="${comment.id}" data-action="upvote">⬆</span>
          <span class="vote-count">${comment.votes}</span>
          <span class="vote-btn ${comment.voters[currentUser.uid] === "downvote" ? "downvoted" : ""}" 
                data-type="comment" data-id="${comment.id}" data-action="downvote">⬇</span>
          <span class="vote-count">${comment.downvotes}</span>
          <span class="reply-btn" data-id="${comment.id}">Reply</span>
          ${isAuthor ? `<span class="delete-btn" data-type="comment" data-id="${comment.id}">🗑️</span>` : ""}
        `
        : `
          <span class="vote-count">${comment.votes} ⬆</span>
          <span class="vote-count">${comment.downvotes} ⬇</span>
        `;

      div.innerHTML = `
        <p><strong>${comment.username ?? "Anonymous"}</strong>
        ${isAuthor ? '<span style="color:#007bff;font-weight:700;">(You)</span>' : ""}</p>
        <p>${comment.text ?? ""}</p>
        <div class="vote-section">${voteUI}</div>
      `;

      const replyContainer = document.createElement("div");
      replyContainer.className = "reply-section";

      comment.replies.forEach((reply, rIndex) => {
        reply.votes ??= 0;
        reply.downvotes ??= 0;
        reply.voters ??= {};
        const isReplyAuthor = currentUser && currentUser.uid === reply.authorId;

        const replyUI = currentUser
          ? `
            <span class="vote-btn ${reply.voters[currentUser.uid] === "upvote" ? "upvoted" : ""}" 
                  data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="upvote">⬆</span>
            <span class="vote-count">${reply.votes}</span>
            <span class="vote-btn ${reply.voters[currentUser.uid] === "downvote" ? "downvoted" : ""}" 
                  data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="downvote">⬇</span>
            <span class="vote-count">${reply.downvotes}</span>
            <span class="reply-btn-reply" data-id="${comment.id}" data-rindex="${rIndex}">Reply</span>
            ${isReplyAuthor ? `<span class="delete-btn" data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}">🗑️</span>` : ""}
          `
          : `
            <span class="vote-count">${reply.votes} ⬆</span>
            <span class="vote-count">${reply.downvotes} ⬇</span>
          `;

        const replyDiv = document.createElement("div");
        replyDiv.className = "comment reply";
        replyDiv.innerHTML = `
          <p><strong>${reply.username ?? "Anonymous"}</strong> 
             ${isReplyAuthor ? '<span style="color:#007bff;font-weight:700;font-size:0.85em;">(You)</span>' : ""}
             <span style="font-size:0.9em;color:#555;">@${reply.replyTo ?? comment.username ?? "Anonymous"}</span>
          </p>
          <p>${reply.text ?? ""}</p>
          <div class="vote-section">${replyUI}</div>
        `;
        replyContainer.appendChild(replyDiv);
      });

      div.appendChild(replyContainer);
      commentsList.appendChild(div);
    });
  }

  // -------------------------
  // Firestore realtime listener
  // -------------------------
  onSnapshot(
    commentsRef,
    (snapshot) => {
      cachedComments = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      renderComments(cachedComments);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      displayMessage("Failed to load comments.", "error");
    }
  );

  // -------------------------
  // Add new comment
  // -------------------------
  postCommentBtn?.addEventListener("click", async () => {
    // Under permissive rules we allow posting even when not signed in.
    const text = commentInput.value.trim();
    if (!text) return;

    // Determine username and author id (may be local anon)
    const isAnonLocal = currentUser && currentUser.isLocalAnon;
    const username =
      (usernameInput?.value.trim()) ||
      currentUser?.displayName ||
      (currentUser?.email ? currentUser.email : "Anonymous");

    // Save chosen local username for future posts
    if (isAnonLocal && usernameInput?.value.trim()) {
      localStorage.setItem(ANON_NAME_KEY, username);
    }

    const authorId = currentUser ? currentUser.uid : localAnonId;

    await addDoc(commentsRef, {
      authorId,
      username,
      text,
      votes: 0,
      downvotes: 0,
      replies: [],
      voters: {},
      timestamp: serverTimestamp(),
    });

    commentInput.value = "";
  });

  // -------------------------
  // Handle votes, replies, deletes
  // -------------------------
  commentsList?.addEventListener("click", async (e) => {
    // Now currentUser is always present (real or local anon), but sanity-check:
    if (!currentUser) {
      displayMessage("Unable to identify user for this action.", "error");
      return;
    }

    const target = e.target;
    const commentId = target.dataset.id;
    const rIndex = target.dataset.rindex
      ? parseInt(target.dataset.rindex)
      : null;
    const ref = doc(db, "forumComments", commentId);

    // --- Delete ---
    if (target.classList.contains("delete-btn")) {
      const type = target.dataset.type;
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      if (type === "comment") {
        if (snap.data().authorId === currentUser.uid) {
          if (confirm("Delete this comment?")) {
            await deleteDoc(ref);
          }
        } else displayMessage("You can only delete your own comments.", "error");
      } else if (type === "reply" && rIndex !== null) {
        const data = snap.data();
        const replies = data.replies || [];
        if (replies[rIndex].authorId === currentUser.uid) {
          if (confirm("Delete this reply?")) {
            replies.splice(rIndex, 1);
            await updateDoc(ref, { replies });
          }
        } else displayMessage("You can only delete your own replies.", "error");
      }
      return;
    }

    // --- Reply Box ---
    if (target.classList.contains("reply-btn")) {
      toggleReplyBox(target.closest(".comment"), commentId, null);
    } else if (target.classList.contains("reply-btn-reply")) {
      toggleReplyBox(target.closest(".comment"), commentId, rIndex);
    }

    // --- Votes ---
    if (target.classList.contains("vote-btn")) {
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        const uid = currentUser.uid;

        if (target.dataset.type === "comment") {
          const currentVote = data.voters?.[uid] || null;
          let update = {};
          let newVote = null;

          if (currentVote === target.dataset.action) {
            newVote = null;
            if (target.dataset.action === "upvote") update.votes = increment(-1);
            else update.downvotes = increment(-1);
          } else {
            if (currentVote === "upvote") update.votes = increment(-1);
            if (currentVote === "downvote") update.downvotes = increment(-1);
            if (target.dataset.action === "upvote") update.votes = increment(1);
            else update.downvotes = increment(1);
            newVote = target.dataset.action;
          }

          await updateDoc(ref, {
            ...update,
            [`voters.${uid}`]: newVote,
          });
        } else {
          const replies = data.replies || [];
          if (rIndex === null || !replies[rIndex]) return;

          replies[rIndex].voters ??= {};
          const currentVote = replies[rIndex].voters[uid] || null;
          let newVote = null;

          if (currentVote === target.dataset.action) {
            newVote = null;
            if (target.dataset.action === "upvote") replies[rIndex].votes--;
            else replies[rIndex].downvotes--;
          } else {
            if (currentVote === "upvote") replies[rIndex].votes--;
            if (currentVote === "downvote") replies[rIndex].downvotes--;
            if (target.dataset.action === "upvote") replies[rIndex].votes++;
            else replies[rIndex].downvotes++;
            newVote = target.dataset.action;
          }

          if (newVote === null) delete replies[rIndex].voters[uid];
          else replies[rIndex].voters[uid] = newVote;

          await updateDoc(ref, { replies });
        }
      } catch (e) {
        console.error("Error updating vote:", e);
        displayMessage("Vote failed.", "error");
      }
    }
  });

  // -------------------------
  // Inline reply box
  // -------------------------
  function toggleReplyBox(parent, commentId, rIndex) {
    document.querySelectorAll(".inline-reply").forEach((box) => box.remove());

    const box = document.createElement("div");
    box.className = "inline-reply";
    box.style.marginTop = "8px";
    box.style.marginLeft = rIndex !== null ? "40px" : "20px";
    box.innerHTML = `
      <textarea rows="2" placeholder="Write a reply..." class="reply-text"></textarea>
      <button class="reply-submit btn">Post Reply</button>
    `;
    parent.appendChild(box);

    box.querySelector(".reply-submit").addEventListener("click", async () => {
      if (!currentUser) {
        displayMessage("You must be logged in to reply.", "error");
        return;
      }
      const text = box.querySelector(".reply-text").value.trim();
      if (!text) return;

      const ref = doc(db, "forumComments", commentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const replyTo =
        rIndex !== null
          ? data.replies[rIndex]?.username ?? "Anonymous"
          : data.username ?? "Anonymous";

      const username =
        currentUser.displayName ||
        currentUser.email ||
        (usernameInput?.value.trim() || "Anonymous");

      // If local anon user set a username in the reply box, store it
      if (currentUser.isLocalAnon && usernameInput?.value.trim()) {
        localStorage.setItem(ANON_NAME_KEY, usernameInput.value.trim());
      }

      const newReply = {
        authorId: currentUser.uid,
        username,
        text,
        replyTo,
        votes: 0,
        downvotes: 0,
        voters: {},
      };

      await updateDoc(ref, {
        replies: arrayUnion(newReply),
      });

      box.remove();
    });
  }

  sortSelect?.addEventListener("change", () =>
    renderComments(cachedComments)
  );
}
