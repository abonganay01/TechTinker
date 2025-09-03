document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ideaForm');
  const titleInput = document.getElementById('ideaTitle');
  const descInput = document.getElementById('ideaDesc');
  const tagsInput = document.getElementById('ideaTags');
  const ideaList = document.getElementById('ideaList');
  const emptyMessage = document.getElementById('emptyIdeas');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const tags = tagsInput.value.trim().split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !desc) return;

    // Create card
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

    // Reset form
    form.reset();
  });
});
