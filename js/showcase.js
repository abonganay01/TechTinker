// User project submissions
const form = document.querySelector('.submit-section form');
const fileInput = document.getElementById('project-file');
const urlInput = document.getElementById('project-url');

let userSection = document.querySelector('.user-submissions');
if (!userSection) {
  userSection = document.createElement('section');
  userSection.classList.add('project-category', 'user-submissions');
  userSection.innerHTML = `
    <h3>🛠 User Submitted Projects</h3>
    <div class="project-grid"></div>
  `;
  const showcaseMain = document.querySelector('.center-container');
  showcaseMain.insertBefore(userSection, document.querySelector('.submit-section'));
}

const userGrid = userSection.querySelector('.project-grid');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!fileInput.files.length && !urlInput.value.trim()) {
    alert('Please upload a file OR provide a project URL.');
    return;
  }
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const file = fileInput.files[0];
  const projectUrl = urlInput.value.trim();

  const card = document.createElement('div');
  card.classList.add('card');

  let mediaContent = '';
  if (file) {
    if (file.type.startsWith('image/')) {
      mediaContent = `<img src="${URL.createObjectURL(file)}" alt="${title}" style="border-radius:10px;">`;
    } else {
      mediaContent = `<a href="${URL.createObjectURL(file)}" download="${file.name}">${file.name}</a>`;
    }
  }

  let linkContent = '';
  if (projectUrl) {
    linkContent = `<a href="${projectUrl}" target="_blank" class="btn">View Project</a>`;
  }

  card.innerHTML = `
    ${mediaContent}
    <h4>${title}</h4>
    <p>${description}</p>
    ${linkContent}
  `;

  userGrid.appendChild(card);
  form.reset();
});
