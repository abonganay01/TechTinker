// =========================
// DOMContentLoaded Main
// =========================
document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ======== MAIN.JS =========
    // =========================
    const basePath = detectBasePath();
    const relativePath = getRelativePath();
    fixPaths();
    console.log(relativePath); // "../../" for /pages/pages/about.html
    
    // Load components dynamically
    loadComponent(basePath + 'htmldesign/header.html', 'header-placeholder', () => {
        makeHeaderClickable(basePath);
        initSigninModal();
    });

    loadComponent(basePath + 'htmldesign/hero.html', 'hero-placeholder');

    
    loadComponent(basePath + 'htmldesign/footer.html', 'footer-placeholder');








    // Parallax effect
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        document.querySelectorAll(".parallax").forEach((element) => {
            const speed = element.getAttribute("data-speed");
            element.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
        });
    });

    highlightActiveLink(basePath);


    // =========================
    // ======== FORUM.JS =======
    // =========================
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
        if (!commentsList) return; // avoid errors if forum not present
        commentsList.innerHTML = "";

        if (sortSelect?.value === "votes") {
            comments.sort((a, b) => (b.votes - b.downvotes) - (a.votes - a.downvotes));
        } else {
            comments.sort((a, b) => b.timestamp - a.timestamp);
        }

        comments.forEach((comment, index) => {
            comment.votes = comment.votes ?? 0;
            comment.downvotes = comment.downvotes ?? 0;
            comment.replies = comment.replies ?? [];

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
                reply.votes = reply.votes ?? 0;
                reply.downvotes = reply.downvotes ?? 0;

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

    if (postCommentBtn) {
        postCommentBtn.addEventListener("click", () => {
            const username = usernameInput.value.trim() || "Anonymous";
            const text = commentInput.value.trim();
            if (text) {
                comments.push({
                    username,
                    text,
                    votes: 0,
                    downvotes: 0,
                    timestamp: Date.now(),
                    replies: []
                });
                saveComments();
                renderComments();
                commentInput.value = "";
                usernameInput.value = "";
            }
        });
    }

    if (commentsList) {
        commentsList.addEventListener("click", (e) => {
            const commentIndex = e.target.dataset.index;
            const rIndex = e.target.dataset.rindex;

            if (e.target.classList.contains("reply-btn")) {
                const commentDiv = e.target.closest(".comment");
                toggleInlineReply(commentDiv, commentIndex, null);
            }

            if (e.target.classList.contains("reply-btn-reply")) {
                const commentDiv = e.target.closest(".comment");
                toggleInlineReply(commentDiv, commentIndex, rIndex);
            }

            if (e.target.classList.contains("vote-btn")) {
                const type = e.target.dataset.type;
                const action = e.target.dataset.action;

                if (type === "comment") {
                    comments[commentIndex][action === "upvote" ? "votes" : "downvotes"]++;
                } else if (type === "reply") {
                    comments[commentIndex].replies[rIndex][action === "upvote" ? "votes" : "downvotes"]++;
                }
                saveComments();
                renderComments();
            }
        });
    }

    function toggleInlineReply(parentDiv, commentIndex, rIndex) {
        const existingBox = parentDiv.querySelector(".inline-reply");
        if (existingBox) {
            existingBox.remove();
            return;
        }

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

            comments[commentIndex].replies.push({
                username,
                text,
                replyTo,
                votes: 0,
                downvotes: 0
            });

            saveComments();
            renderComments();
        });
    }

    sortSelect?.addEventListener("change", renderComments);
    renderComments();

    // =========================
    // ======== INCUBATOR.JS ===
    // =========================
    const ideaForm = document.getElementById('ideaForm');
    const ideaList = document.getElementById('ideaList');
    const emptyMessage = document.getElementById('emptyIdeas');

    ideaForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('ideaTitle');
        const descInput = document.getElementById('ideaDesc');
        const tagsInput = document.getElementById('ideaTags');

        const title = titleInput.value.trim();
        const desc = descInput.value.trim();
        const tags = tagsInput.value.trim().split(',').map(t => t.trim()).filter(Boolean);

        if (!title || !desc) return;

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
        emptyMessage.style.display = 'none';
        ideaForm.reset();
    });

    // =========================
    // ======== OHM.JS =========
    // =========================
    window.checkAnswers = function() {
        let score = 0;
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');

        const result = document.getElementById("result");
        if (!q1 || !q2) {
            result.textContent = "Please answer all questions.";
            result.style.color = "orange";
        } else {
            if (q1.value === "a") score++;
            if (q2.value === "b") score++;
            result.textContent = `You scored ${score}/2.`;
            result.style.color = score === 2 ? "green" : "red";
        }
    };

    // =========================
    // ======== RFID.JS ========
    // =========================
    window.checkQuiz = function() {
        let score = 0;
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const q3 = document.querySelector('input[name="q3"]:checked');

        const quizResult = document.getElementById("quiz-result");
        if (!quizResult) return;

        if (q1 && q1.value === "3.3V") score++;
        if (q2 && q2.value === "SPI") score++;
        if (q3 && q3.value === "Pin 10") score++;
        quizResult.textContent = `You scored ${score}/3`;
    };
});

// =========================
// ======== MAIN.JS HELPERS
// =========================
function loadComponent(file, placeholderId, callback = null) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(placeholderId).innerHTML = data;
            if (callback) callback();
        })
        .catch(err => console.error(`Error loading ${file}:`, err));
}

function detectBasePath() {
    const hostname = window.location.hostname;
    const repoName = 'TechTinker';
    return hostname.includes('github.io') ? `/${repoName}/` : '/';
}

function getRelativePath() {
    const basePath = detectBasePath();
    return basePath; // always use /TechTinker/ for GitHub Pages
}




function makeHeaderClickable(basePath) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', () => {
            window.location.href = basePath + 'index.html';
        });
    }
}

function highlightActiveLink(basePath) {
    const currentPath = window.location.pathname.replace(basePath, '');
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').replace(basePath, '');
        if (linkPath === currentPath || (linkPath === 'index.html' && currentPath === '')) {
            link.style.backgroundColor = '#63b3ed';
            link.style.color = '#2d3748';
            link.style.borderRadius = '6px';
        }
    });
}

function initSigninModal() {
    const signinButton = document.getElementById("signinButton");
    const signinPage = document.getElementById("signinPage");
    const closeIcon = document.getElementById("closeIcon");

    if (signinButton && signinPage && closeIcon) {
        signinButton.addEventListener("click", () => {
            signinPage.classList.remove("closeSignin");
            signinPage.classList.add("openSignin");
        });

        closeIcon.addEventListener("click", () => {
            signinPage.classList.remove("openSignin");
            signinPage.classList.add("closeSignin");
        });
    }
}

function fixPaths() {
    const relativePath = getRelativePath(); // calculate correct ../

    // Fix logo
    const logo = document.getElementById('logo');
    if (logo) logo.src = relativePath + 'images/logo.png';

    // Fix nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.dataset.href;
        if (!href) return;

        // Set proper href dynamically
        link.href = detectBasePath() + href;
        // Optional: handle dropdown clicks if needed
        link.addEventListener('click', (e) => {
            window.location.href = link.href;
        });
    });
}


