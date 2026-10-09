// ─────────────────────────────────────────────
//  IA de CODE — app.js
// ─────────────────────────────────────────────

let DATA = null;
let activeSection = null;
let activeTab = 'simple';
let searchQuery = '';
let copiedId = null;

// ── Boot ─────────────────────────────────────
async function init() {
  try {
    const res = await fetch('prompts.json');
    DATA = await res.json();
  } catch {
    // Fallback: data embedded via window.PROMPTS_DATA
    DATA = window.PROMPTS_DATA || null;
    if (!DATA) { document.getElementById('app').innerHTML = '<p style="color:#ef4444;padding:2rem">Erreur : impossible de charger prompts.json</p>'; return; }
  }
  renderSidebar();
  renderHero();
  renderMain();
  bindSearch();
  bindScroll();
  animateCounters();
}

// ── Sidebar ───────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = DATA.sections.map(s => `
    <a href="#section-${s.id}" class="nav-item" data-id="${s.id}" onclick="setActive(${s.id})">
      <span class="nav-icon">${s.icon}</span>
      <span class="nav-label">${s.title}</span>
      <span class="nav-badge">${s.prompts.length}</span>
    </a>
  `).join('');
}

function setActive(id) {
  activeSection = id;
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', +el.dataset.id === id)
  );
}

// ── Hero ──────────────────────────────────────
function renderHero() {
  document.getElementById('hero-title').textContent = DATA.title;
  document.getElementById('hero-sub').textContent = DATA.subtitle;
}

// ── Main content ──────────────────────────────
function renderMain() {
  const container = document.getElementById('sections-container');
  container.innerHTML = DATA.sections.map(renderSection).join('');
}

function renderSection(section) {
  const filtered = filterPrompts(section.prompts);
  if (searchQuery && filtered.length === 0) return '';

  return `
    <section id="section-${section.id}" class="section-block" data-section="${section.id}">
      <div class="section-header" style="--accent:${section.color}">
        <div class="section-tag">SECTION ${section.id}</div>
        <h2 class="section-title">
          <span class="section-emoji">${section.icon}</span>
          ${section.title}
        </h2>
        <div class="section-meta">
          <span class="section-range">Prompts ${section.range}</span>
          <span class="section-count">${filtered.length} prompt${filtered.length > 1 ? 's' : ''}</span>
        </div>
        <div class="section-bar" style="background:${section.color}"></div>
      </div>
      <div class="prompts-grid">
        ${filtered.map(p => renderPrompt(p, section.color)).join('')}
      </div>
    </section>
  `;
}

function renderPrompt(prompt, color) {
  return `
    <article class="prompt-card" id="prompt-${prompt.id}" style="--card-accent:${color}">
      <div class="card-header">
        <span class="prompt-num">#${String(prompt.id).padStart(2, '0')}</span>
        <h3 class="prompt-title">${prompt.title}</h3>
      </div>
      <div class="card-tabs">
        <button class="tab-btn active" data-card="${prompt.id}" data-level="simple" onclick="switchTab(this,${prompt.id})">Simple</button>
        <button class="tab-btn" data-card="${prompt.id}" data-level="premium" onclick="switchTab(this,${prompt.id})">Premium</button>
        <button class="tab-btn" data-card="${prompt.id}" data-level="expert" onclick="switchTab(this,${prompt.id})">Expert</button>
      </div>
      <div class="card-body">
        <div class="level-panel active" id="panel-${prompt.id}-simple">
          <div class="level-label simple-label">◈ Simple</div>
          <p class="level-text">${prompt.simple}</p>
        </div>
        <div class="level-panel" id="panel-${prompt.id}-premium">
          <div class="level-label premium-label">◈ Premium</div>
          <p class="level-text">${prompt.premium}</p>
        </div>
        <div class="level-panel" id="panel-${prompt.id}-expert">
          <div class="level-label expert-label">◈ Expert</div>
          <p class="level-text">${prompt.expert}</p>
        </div>
      </div>
      <div class="card-footer">
        <button class="copy-btn" onclick="copyPrompt(${prompt.id})" id="copy-${prompt.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copier
        </button>
        <span class="prompt-id-badge">${prompt.id}/100</span>
      </div>
    </article>
  `;
}

// ── Tabs ──────────────────────────────────────
function switchTab(btn, cardId) {
  const level = btn.dataset.level;
  // Deactivate all tabs in this card
  document.querySelectorAll(`[data-card="${cardId}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Switch panels
  ['simple','premium','expert'].forEach(l => {
    const panel = document.getElementById(`panel-${cardId}-${l}`);
    if (panel) panel.classList.toggle('active', l === level);
  });
}

// ── Copy ──────────────────────────────────────
function copyPrompt(id) {
  const card = document.getElementById(`prompt-${id}`);
  const activePanel = card.querySelector('.level-panel.active');
  const text = activePanel ? activePanel.querySelector('.level-text').textContent : '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${id}`);
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copié !`;
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier`;
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ── Search ────────────────────────────────────
function filterPrompts(prompts) {
  if (!searchQuery) return prompts;
  const q = searchQuery.toLowerCase();
  return prompts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.simple.toLowerCase().includes(q) ||
    p.premium.toLowerCase().includes(q) ||
    p.expert.toLowerCase().includes(q)
  );
}

function bindSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderMain();
    updateResultCount();
  });
}

function updateResultCount() {
  let total = 0;
  DATA.sections.forEach(s => { total += filterPrompts(s.prompts).length; });
  const badge = document.getElementById('result-count');
  if (badge) badge.textContent = searchQuery ? `${total} résultat${total !== 1 ? 's' : ''}` : '100 prompts · 5 thématiques';
}

// ── Scroll observer ───────────────────────────
function bindScroll() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = +entry.target.dataset.section;
        setActive(id);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.section-block').forEach(el => observer.observe(el));
}

// ── Counters ──────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ── Mobile sidebar toggle ─────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', init);
