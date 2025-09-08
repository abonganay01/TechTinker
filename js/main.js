// =========================
// MAIN.JS OPTIMIZED
// =========================

document.addEventListener('DOMContentLoaded', () => {
    let lastScrollTop = 0;
    const header = document.querySelector('header');

    // =========================
    // PATHS
    // =========================
    const basePath = detectBasePath();
    const relativePath = getRelativePath();
    fixPaths();

    // =========================
    // DYNAMIC COMPONENTS
    // =========================
    // Header first (important for UX)
    loadComponent(basePath + 'htmldesign/header.html', 'header-placeholder', () => {
        makeHeaderClickable(basePath);
        initSigninModal();
    });

    // Hero and footer load async (non-critical)
    ['hero', 'footer'].forEach(id => {
        loadComponent(`${basePath}htmldesign/${id}.html`, `${id}-placeholder`);
    });

    // =========================
    // PARALLAX (throttled)
    // =========================
    let parallaxX = 0, parallaxY = 0;
    document.addEventListener("mousemove", (event) => {
        parallaxX = event.clientX / window.innerWidth - 0.5;
        parallaxY = event.clientY / window.innerHeight - 0.5;
    });

    function updateParallax() {
        document.querySelectorAll(".parallax").forEach(el => {
            const speed = el.getAttribute("data-speed");
            el.style.transform = `translate(${parallaxX * speed * 20}px, ${parallaxY * speed * 20}px)`;
        });
        requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);

    // =========================
    // HIGHLIGHT NAV LINKS
    // =========================
    highlightActiveLink(basePath);

    // =========================
    // HEADER SCROLL TOGGLE (throttled)
    // =========================
    if (header) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (scrollTop > lastScrollTop) header.classList.add('header-hidden');
                    else header.classList.remove('header-hidden');
                    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // =========================
    // FORUM (lazy init)
    // =========================
    if (document.getElementById('commentsList')) initForum();

    // =========================
    // INCUBATOR (lazy init)
    // =========================
    if (document.getElementById('ideaForm')) initIncubator();

    // =========================
    // OHM QUIZ
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
    // RFID QUIZ
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
// HELPERS
// =========================
function loadComponent(file, placeholderId, callback = null) {
    // Component caching for speed
    const cached = sessionStorage.getItem(file);
    if (cached) {
        document.getElementById(placeholderId).innerHTML = cached;
        if (callback) callback();
        return;
    }

    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(placeholderId).innerHTML = data;
            sessionStorage.setItem(file, data);
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
    return detectBasePath();
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
    document.querySelectorAll('nav a').forEach(link => {
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
    const relativePath = getRelativePath();
    const logo = document.getElementById('logo');
    if (logo) logo.src = relativePath + 'images/logo.png';

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.dataset.href;
        if (!href) return;
        link.href = detectBasePath() + href;
        link.addEventListener('click', () => {
            window.location.href = link.href;
        });
    });
}

// =========================
// DEVICE CLASS
// =========================
function applyDeviceClass() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add("mobile-view");
        document.body.classList.remove("desktop-view");
        document.documentElement.style.fontSize = "15px";
    } else {
        document.body.classList.add("desktop-view");
        document.body.classList.remove("mobile-view");
        document.documentElement.style.fontSize = "16px";
    }
}
window.addEventListener("load", applyDeviceClass);
window.addEventListener("resize", applyDeviceClass);

// =========================
// FORUM INIT FUNCTION
// =========================
function initForum() {
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

// =========================
// INCUBATOR INIT FUNCTION
// =========================
function initIncubator() {
    const ideaForm = document.getElementById('ideaForm');
    const ideaList = document.getElementById('ideaList');
    const emptyMessage = document.getElementById('emptyIdeas');

    ideaForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('ideaTitle').value.trim();
        const desc = document.getElementById('ideaDesc').value.trim();
        const tags = document.getElementById('ideaTags').value.trim().split(',').map(t => t.trim()).filter(Boolean);
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
}
