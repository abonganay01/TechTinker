// =========================
// FORUM MODULE (Realtime Firestore)
// =========================
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  increment,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export function initForum() {
  console.log("initForum() called"); // make sure it's only called once

  const usernameInput = document.getElementById("usernameInput");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");
  const commentsList = document.getElementById("commentsList");
  const emptyMessage = document.getElementById("emptyCommentsMsg");
  const sortSelect = document.getElementById("sortSelect");

  const commentsRef = collection(db, "forumComments");
  let cachedComments = [];

  // -------------------------
  // Render comments
  // -------------------------
  function renderComments(comments) {
    if (!commentsList) return;

    commentsList.innerHTML = ""; // clear previous comments
    if (comments.length === 0) {
      emptyMessage.style.display = "block";
      return;
    } else {
      emptyMessage.style.display = "none";
    }

    let sorted = [...comments];
    if (sortSelect?.value === "votes") {
      sorted.sort((a, b) => (b.votes - b.downvotes) - (a.votes - a.downvotes));
    } else {
      sorted.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
    }

    sorted.forEach(comment => {
      comment.votes ??= 0;
      comment.downvotes ??= 0;
      comment.replies ??= [];

      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `
        <p><strong>${comment.username ?? "Anonymous"}</strong></p>
        <p>${comment.text ?? ""}</p>
        <div class="vote-section">
          <span class="vote-btn" data-type="comment" data-id="${comment.id}" data-action="upvote">⬆</span>
          <span class="vote-count">${comment.votes}</span>
          <span class="vote-btn" data-type="comment" data-id="${comment.id}" data-action="downvote">⬇</span>
          <span class="vote-count">${comment.downvotes}</span>
          <span class="reply-btn" data-id="${comment.id}">Reply</span>
        </div>
      `;

      const replyContainer = document.createElement("div");
      replyContainer.className = "reply-section";

      comment.replies.forEach((reply, rIndex) => {
        reply.votes ??= 0;
        reply.downvotes ??= 0;

        const replyDiv = document.createElement("div");
        replyDiv.className = "comment reply";
        replyDiv.innerHTML = `
          <p><strong>${reply.username ?? "Anonymous"}</strong> 
             <span style="font-size:0.9em;color:#555;">@${reply.replyTo ?? comment.username ?? "Anonymous"}</span>
          </p>
          <p>${reply.text ?? ""}</p>
          <div class="vote-section">
            <span class="vote-btn" data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="upvote">⬆</span>
            <span class="vote-count">${reply.votes}</span>
            <span class="vote-btn" data-type="reply" data-id="${comment.id}" data-rindex="${rIndex}" data-action="downvote">⬇</span>
            <span class="vote-count">${reply.downvotes}</span>
            <span class="reply-btn-reply" data-id="${comment.id}" data-rindex="${rIndex}">Reply</span>
          </div>
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
    const username = usernameInput.value.trim() || "Anonymous";
    const text = commentInput.value.trim();
    if (!text) return;

    await addDoc(commentsRef, {
      username,
      text,
      votes: 0,
      downvotes: 0,
      replies: [],
      timestamp: serverTimestamp(),
    });

    usernameInput.value = "";
    commentInput.value = "";
  });

  // -------------------------
  // Handle votes & replies
  // -------------------------
  commentsList?.addEventListener("click", async e => {
    const commentId = e.target.dataset.id;
    const rIndex = e.target.dataset.rindex;

    if (e.target.classList.contains("reply-btn"))
      toggleReplyBox(e.target.closest(".comment"), commentId, null);

    if (e.target.classList.contains("reply-btn-reply"))
      toggleReplyBox(e.target.closest(".comment"), commentId, rIndex);

    if (e.target.classList.contains("vote-btn")) {
      const type = e.target.dataset.type;
      const action = e.target.dataset.action;

      const ref = doc(db, "forumComments", commentId);

      if (type === "comment") {
        await updateDoc(ref, { [action === "upvote" ? "votes" : "downvotes"]: increment(1) });
      } else {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const replies = snap.data().replies || [];
        replies[rIndex][action === "upvote" ? "votes" : "downvotes"]++;
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
      <input type="text" placeholder="Your name" class="reply-username">
      <textarea rows="2" placeholder="Write a reply..." class="reply-text"></textarea>
      <button class="reply-submit btn">Reply</button>
    `;
    parent.appendChild(box);

    box.querySelector(".reply-submit").addEventListener("click", async () => {
      const username = box.querySelector(".reply-username").value.trim() || "Anonymous";
      const text = box.querySelector(".reply-text").value.trim();
      if (!text) return;

      const ref = doc(db, "forumComments", commentId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const replies = snap.data().replies || [];
      const replyTo = rIndex !== null ? replies[rIndex]?.username ?? "Anonymous" : snap.data().username ?? "Anonymous";

      replies.push({ username, text, replyTo, votes: 0, downvotes: 0 });
      await updateDoc(ref, { replies });

      box.remove();
    });
  }

  // -------------------------
  // Sort comments
  // -------------------------
  sortSelect?.addEventListener("change", () => renderComments(cachedComments));
}
