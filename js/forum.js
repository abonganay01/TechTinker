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
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Prevent multiple initializations
let forumInitialized = false;

export function initForum() {
  if (forumInitialized) return;
  forumInitialized = true;

  const usernameInput = document.getElementById("usernameInput");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");
  const commentsList = document.getElementById("commentsList");
  const emptyMessage = document.getElementById("emptyCommentsMsg");
  const sortSelect = document.getElementById("sortSelect");

  const commentsRef = collection(db, "forumComments");
  let cachedComments = [];
  let currentUser = null;

// -------------------------
// Auth state
// -------------------------
onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    console.log("✅ Logged in:", user.email);

    // Enable comment form
    if (postCommentBtn) postCommentBtn.disabled = false;
    if (commentInput) commentInput.disabled = false;
    if (usernameInput) usernameInput.style.display = "none"; // optional hide username box if using auth identity

  } else {
    console.log("❌ Not logged in");

    // Disable comment form
    if (postCommentBtn) postCommentBtn.disabled = true;
    if (commentInput) commentInput.disabled = true;
    if (usernameInput) usernameInput.style.display = "block";
  }

  // 🔄 re-render comments so vote/reply buttons update immediately
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
    sorted.sort((a, b) => (b.votes - b.downvotes) - (a.votes - a.downvotes));
  } else {
    sorted.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
  }

  sorted.forEach(comment => {
    comment.votes ??= 0;
    comment.downvotes ??= 0;
    comment.replies ??= [];
    comment.voters ??= {};

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
      `
      : `
        <span class="vote-count">${comment.votes} ⬆</span>
        <span class="vote-count">${comment.downvotes} ⬇</span>
      `;

    div.innerHTML = `
      <p><strong>${comment.username ?? "Anonymous"}</strong></p>
      <p>${comment.text ?? ""}</p>
      <div class="vote-section">${voteUI}</div>
    `;

    const replyContainer = document.createElement("div");
    replyContainer.className = "reply-section";

    comment.replies.forEach((reply, rIndex) => {
      reply.votes ??= 0;
      reply.downvotes ??= 0;
      reply.voters ??= {};

      const replyUI = currentUser
        ? `
          <span class="vote-btn ${reply.voters[currentUser.uid] === "upvote" ? "upvoted" : ""}" 
                data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="upvote">⬆</span>
          <span class="vote-count">${reply.votes}</span>
          <span class="vote-btn ${reply.voters[currentUser.uid] === "downvote" ? "downvoted" : ""}" 
                data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="downvote">⬇</span>
          <span class="vote-count">${reply.downvotes}</span>
          <span class="reply-btn-reply" data-id="${comment.id}" data-rindex="${rIndex}">Reply</span>
        `
        : `
          <span class="vote-count">${reply.votes} ⬆</span>
          <span class="vote-count">${reply.downvotes} ⬇</span>
        `;

      const replyDiv = document.createElement("div");
      replyDiv.className = "comment reply";
      replyDiv.innerHTML = `
        <p><strong>${reply.username ?? "Anonymous"}</strong> 
           <span style="font-size:0.9em;color:#555;">@${reply.replyTo ?? comment.username ?? "Anonymous"}</span>
        </p>
        <p>${reply.text ?? ""}</p>
        <div class="vote-section">${replyUI}</div>
      `;
      replyDiv.style.marginLeft = "20px";
      replyContainer.appendChild(replyDiv);
    });

    div.appendChild(replyContainer);
    commentsList.appendChild(div);
  });
}


  // -------------------------
  // Firestore realtime listener
  // -------------------------
  onSnapshot(commentsRef, snapshot => {
    cachedComments = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderComments(cachedComments);
  });

  // -------------------------
  // Add new comment
  // -------------------------
  postCommentBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      alert("You must be logged in to post a comment.");
      return;
    }
    const text = commentInput.value.trim();
    if (!text) return;

    await addDoc(commentsRef, {
      username: currentUser.displayName || currentUser.email || "Anonymous",
      text,
      votes: 0,
      downvotes: 0,
      replies: [],
      voters: {}, // track who voted
      timestamp: serverTimestamp(),
    });

    commentInput.value = "";
  });

  // -------------------------
  // Handle votes & replies
  // -------------------------
  commentsList?.addEventListener("click", async e => {
    if (!currentUser) {
      alert("You must be logged in to interact.");
      return;
    }

    const commentId = e.target.dataset.id;
    const rIndex = e.target.dataset.rindex;

    if (e.target.classList.contains("reply-btn"))
      toggleReplyBox(e.target.closest(".comment"), commentId, null);

    if (e.target.classList.contains("reply-btn-reply"))
      toggleReplyBox(e.target.closest(".comment"), commentId, rIndex);


    if (e.target.classList.contains("vote-btn")) {
      const type = e.target.dataset.type;
      const action = e.target.dataset.action; // "upvote" or "downvote"
      const ref = doc(db, "forumComments", commentId);

      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const uid = currentUser.uid;

      if (type === "comment") {
        const currentVote = data.voters?.[uid] || null;

        let update = {};
        let newVote = null;

        if (currentVote === action) {
          // 🔄 cancel same vote
          newVote = null;
          if (action === "upvote") update.votes = increment(-1);
          else update.downvotes = increment(-1);
        } else {
          // 🆕 switch or first time
          if (currentVote === "upvote") update.votes = increment(-1);
          if (currentVote === "downvote") update.downvotes = increment(-1);

          if (action === "upvote") update.votes = increment(1);
          else update.downvotes = increment(1);

          newVote = action;
        }

        await updateDoc(ref, {
          ...update,
          [`voters.${uid}`]: newVote,
        });
      } else {
        // Reply votes
        const replies = data.replies || [];
        if (!replies[rIndex]) return;

        replies[rIndex].voters ??= {};
        const currentVote = replies[rIndex].voters[uid] || null;
        let newVote = null;

        if (currentVote === action) {
          // 🔄 cancel same vote
          newVote = null;
          if (action === "upvote") replies[rIndex].votes--;
          else replies[rIndex].downvotes--;
        } else {
          // 🆕 switch or first time
          if (currentVote === "upvote") replies[rIndex].votes--;
          if (currentVote === "downvote") replies[rIndex].downvotes--;

          if (action === "upvote") replies[rIndex].votes++;
          else replies[rIndex].downvotes++;

          newVote = action;
        }

        replies[rIndex].voters[uid] = newVote;

        await updateDoc(ref, { replies });
      }
    }

  });

  // -------------------------
  // Inline reply box
  // -------------------------
  function toggleReplyBox(parent, commentId, rIndex) {
    document.querySelectorAll(".inline-reply").forEach(box => box.remove());

    const box = document.createElement("div");
    box.className = "inline-reply";
    box.style.marginTop = "8px";
    box.style.marginLeft = rIndex !== null ? "40px" : "20px";
    box.innerHTML = `
      <textarea rows="2" placeholder="Write a reply..." class="reply-text"></textarea>
      <button class="reply-submit btn">Reply</button>
    `;
    parent.appendChild(box);

    box.querySelector(".reply-submit").addEventListener("click", async () => {
      if (!currentUser) {
        alert("You must be logged in to reply.");
        return;
      }
      const text = box.querySelector(".reply-text").value.trim();
      if (!text) return;

      const ref = doc(db, "forumComments", commentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const replies = snap.data().replies || [];
      const replyTo =
        rIndex !== null ? replies[rIndex]?.username ?? "Anonymous" : snap.data().username ?? "Anonymous";

      replies.push({
        username: currentUser.displayName || currentUser.email || "Anonymous",
        text,
        replyTo,
        votes: 0,
        downvotes: 0,
        voters: {},
      });
      await updateDoc(ref, { replies });

      box.remove();
    });
  }

  sortSelect?.addEventListener("change", () => renderComments(cachedComments));
}
