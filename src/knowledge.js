let faqData = null
let searchQuery = ''
let activeCategory = null

const categoryIcons = {
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>',
  zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  battery: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>',
  network: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>',
  wrench: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  dollar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  truck: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
}

function getIcon(name) { return categoryIcons[name] || categoryIcons.sun }

export function initKnowledge(data, domain) {
  faqData = data
  searchQuery = ''
  activeCategory = null
  renderKnowledge(domain)
}

export function renderKnowledge(domain) {
  const container = document.getElementById('knowledgeContainer')
  if (!container || !faqData) return

  const domainCategories = faqData.categories.filter(c => c.domain.includes(domain))
  const domainEntries = faqData.entries.filter(e => e.domain.includes(domain))

  let filtered = domainEntries
  if (activeCategory) filtered = filtered.filter(e => e.category === activeCategory)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(e =>
      e.question.toLowerCase().includes(q) ||
      e.answer.toLowerCase().includes(q) ||
      (e.keywords && e.keywords.some(k => k.toLowerCase().includes(q)))
    )
  }

  let html = `<div class="section-intro">
        <h2>Knowledge Base</h2>
        <p>Frequently asked questions and expert guidance. Search or browse by category.</p>
    </div>
    <div class="knowledge-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="knowledgeSearch" placeholder="Search topics..." value="${searchQuery}" />
    </div>
    <div class="knowledge-categories">
        <button class="category-btn ${!activeCategory ? 'active' : ''}" data-cat="">All</button>
        ${domainCategories.map(c => `
            <button class="category-btn ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
                ${getIcon(c.icon)} ${c.label}
            </button>
        `).join('')}
    </div>
    <div class="knowledge-results">
        ${filtered.length === 0 ? '<p class="knowledge-empty">No matching entries found.</p>' :
      filtered.map(e => `
            <div class="faq-item" data-id="${e.id}">
                <div class="faq-question">
                    <span>${e.question}</span>
                    <svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div class="faq-answer">${e.answer}</div>
            </div>
        `).join('')}
    </div>`

  container.innerHTML = html

  const searchInput = container.querySelector('#knowledgeSearch')
  if (searchInput) {
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderKnowledge(domain) })
    if (searchQuery) { searchInput.focus(); searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length) }
  }
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat || null
      renderKnowledge(domain)
    })
  })
  container.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => item.classList.toggle('open'))
  })
}
