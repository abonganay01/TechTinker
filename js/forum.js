export function initForum() {
  const usernameInput = document.getElementById("usernameInput");
  const commentInput = document.getElementById("commentInput");
  const postCommentBtn = document.getElementById("postCommentBtn");
  const commentsList = document.getElementById("commentsList");
  const sortSelect = document.getElementById("sortSelect");

  let comments = JSON.parse(localStorage.getItem("forumComments")) || [];

  function saveComments() {
    localStorage.setItem("forumComments", JSON.stringify(comments));
  }

  function renderComments() {
    if (!commentsList) return;
    commentsList.innerHTML = "";
    if (sortSelect?.value === "votes") {
      comments.sort((a, b) => (b.votes - b.downvotes) - (a.votes - a.downvotes));
    } else comments.sort((a, b) => b.timestamp - a.timestamp);

    comments.forEach((comment, index) => {
      comment.votes ??= 0;
      comment.downvotes ??= 0;
      comment.replies ??= [];

      const div = document.createElement("div");
      div.classList.add("comment");
      div.innerHTML = `
        <p><strong>${comment.username ?? "Anonymous"}</strong></p>
        <p>${comment.text ?? ""}</p>
        <div class="vote-section">
          <span class="vote-btn" data-type="comment" data-index="${index}" data-action="upvote">⬆</span>
          <span class="vote-count">${comment.votes}</span>
          <span class="vote-btn" data-type="comment" data-index="${index}" data-action="downvote">⬇</span>
          <span class="vote-count">${comment.downvotes}</span>
          <span class="reply-btn" data-index="${index}">Reply</span>
        </div>
      `;

      const replyContainer = document.createElement("div");
      replyContainer.classList.add("reply-section");

      comment.replies.forEach((reply, rIndex) => {
        reply.votes ??= 0;
        reply.downvotes ??= 0;
        const replyDiv = document.createElement("div");
        replyDiv.classList.add("comment");
        replyDiv.style.marginLeft = "20px";
        replyDiv.innerHTML = `
          <p><strong>${reply.username ?? "Anonymous"}</strong> 
             <span style="font-size:0.9em;color:#555;">@${reply.replyTo ?? comment.username ?? "Anonymous"}</span>
          </p>
          <p>${reply.text ?? ""}</p>
          <div class="vote-section">
            <span class="vote-btn" data-type="reply" data-index="${index}" data-rindex="${rIndex}" data-action="upvote">⬆</span>
            <span class="vote-count">${reply.votes}</span>
            <span class="vote-btn" data-type="reply" data-index="${index}" data-rindex="${rIndex}" data-action="downvote">⬇</span>
            <span class="vote-count">${reply.downvotes}</span>
            <span class="reply-btn-reply" data-index="${index}" data-rindex="${rIndex}">Reply</span>
          </div>
        `;
        replyContainer.appendChild(replyDiv);
      });

      div.appendChild(replyContainer);
      commentsList.appendChild(div);
    });
  }

  postCommentBtn?.addEventListener("click", () => {
    const username = usernameInput.value.trim() || "Anonymous";
    const text = commentInput.value.trim();
    if (!text) return;
    comments.push({ username, text, votes: 0, downvotes: 0, timestamp: Date.now(), replies: [] });
    saveComments();
    renderComments();
    usernameInput.value = commentInput.value = "";
  });

  commentsList?.addEventListener("click", (e) => {
    const commentIndex = e.target.dataset.index;
    const rIndex = e.target.dataset.rindex;

    if (e.target.classList.contains("reply-btn")) toggleInlineReply(e.target.closest(".comment"), commentIndex, null);
    if (e.target.classList.contains("reply-btn-reply")) toggleInlineReply(e.target.closest(".comment"), commentIndex, rIndex);

    if (e.target.classList.contains("vote-btn")) {
      const type = e.target.dataset.type;
      const action = e.target.dataset.action;
      if (type === "comment") comments[commentIndex][action === "upvote" ? "votes" : "downvotes"]++;
      else comments[commentIndex].replies[rIndex][action === "upvote" ? "votes" : "downvotes"]++;
      saveComments();
      renderComments();
    }
  });

  function toggleInlineReply(parentDiv, commentIndex, rIndex) {
    const existingBox = parentDiv.querySelector(".inline-reply");
    if (existingBox) { existingBox.remove(); return; }

    const replyBox = document.createElement("div");
    replyBox.classList.add("inline-reply");
    replyBox.style.marginTop = "8px";
    replyBox.style.marginLeft = rIndex !== null ? "40px" : "20px";
    replyBox.innerHTML = `
      <input type="text" placeholder="Your name" class="reply-username">
      <textarea rows="2" placeholder="Write a reply..." class="reply-text"></textarea>
      <button class="reply-submit">Reply</button>
    `;
    parentDiv.appendChild(replyBox);

    replyBox.querySelector(".reply-submit").addEventListener("click", () => {
      const username = replyBox.querySelector(".reply-username").value.trim() || "Anonymous";
      const text = replyBox.querySelector(".reply-text").value.trim();
      if (!text) return;

      let replyTo = rIndex !== null
        ? comments[commentIndex].replies[rIndex].username ?? "Anonymous"
        : comments[commentIndex].username ?? "Anonymous";

      comments[commentIndex].replies.push({ username, text, replyTo, votes: 0, downvotes: 0 });
      saveComments();
      renderComments();
    });
  }

  sortSelect?.addEventListener("change", renderComments);
  renderComments();
}
