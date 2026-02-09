/**
 * Ли Бо — Чайный Бар  |  Main Application Logic
 * Handles navigation, menu rendering, quiz flow, detail view, and API integration.
 */

(function () {
  'use strict';

  /* ── Configuration ─────────────────────────── */
  const API_BASE = ''; // Set to admin API URL, e.g. 'https://admin.libo.bar/api'

  /* ── State ─────────────────────────────────── */
  let menuData = null;
  let quizData = null;
  let currentPage = 'home';
  let currentCategory = null;
  let quizStep = -1; // -1 = intro
  let quizAnswers = [];

  /* ── DOM refs ──────────────────────────────── */
  const pages = {};
  const navButtons = {};

  /* ── Init ──────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.page').forEach(p => {
      pages[p.id] = p;
    });
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      const target = btn.dataset.page;
      navButtons[target] = btn;
      btn.addEventListener('click', () => navigate(target));
    });

    loadData().then(() => {
      navigate('home');
    });

    registerSW();
  });

  /* ── Service Worker Registration ───────────── */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  /* ── Data Loading ──────────────────────────── */
  async function loadData() {
    if (API_BASE) {
      try {
        const [menuRes, quizRes] = await Promise.all([
          fetch(API_BASE + '/menu'),
          fetch(API_BASE + '/quiz')
        ]);
        menuData = await menuRes.json();
        quizData = await quizRes.json();
        return;
      } catch (_) {
        /* fall back to local data */
      }
    }
    menuData = MENU_DATA;
    quizData = QUIZ_DATA;
  }

  /* ── Navigation ────────────────────────────── */
  function navigate(page) {
    currentPage = page;
    Object.values(pages).forEach(p => p.classList.remove('active'));
    Object.values(navButtons).forEach(b => b.classList.remove('active'));

    if (pages[page]) pages[page].classList.add('active');
    if (navButtons[page]) navButtons[page].classList.add('active');

    if (page === 'menu') renderMenu();
    if (page === 'quiz') resetQuiz();
  }

  /* ── Menu Rendering ────────────────────────── */
  function renderMenu() {
    if (!menuData) return;
    const container = document.getElementById('menu-content');
    if (!container) return;

    if (!currentCategory) currentCategory = menuData.categories[0].id;

    let html = '<div class="category-tabs">';
    menuData.categories.forEach(cat => {
      const active = cat.id === currentCategory ? ' active' : '';
      html += `<button class="category-tab${active}" data-cat="${cat.id}">${cat.nameZh} ${cat.name}</button>`;
    });
    html += '</div><div class="menu-grid">';

    const items = menuData.items.filter(i => i.category === currentCategory);
    items.forEach(item => {
      const imgSrc = item.image || '';
      const imgTag = imgSrc
        ? `<img class="menu-item-img" src="${encodeURI(imgSrc)}" alt="${escapeHtml(item.name)}" loading="lazy">`
        : `<div class="menu-item-img" aria-hidden="true"></div>`;
      html += `
        <div class="menu-item" data-item-id="${escapeAttr(item.id)}" role="button" tabindex="0">
          ${imgTag}
          <div class="menu-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <div class="price">${escapeHtml(item.price)} &#8381;</div>
            <div class="desc">${escapeHtml(item.description)}</div>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.category-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        renderMenu();
      });
    });

    container.querySelectorAll('.menu-item[data-item-id]').forEach(el => {
      el.addEventListener('click', () => {
        const item = findItemById(el.dataset.itemId);
        if (item) showDetail(item);
      });
    });
  }

  /* ── Detail View ───────────────────────────── */
  function findItemById(id) {
    if (!menuData) return null;
    return menuData.items.find(i => i.id === id) || null;
  }

  function showDetail(item) {
    let existing = document.getElementById('detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'detail-overlay';
    overlay.className = 'detail-overlay';

    const images = item.images && item.images.length ? item.images : (item.image ? [item.image] : []);
    let gallery = '';
    images.forEach(src => {
      gallery += `<img class="detail-gallery-img" src="${encodeURI(src)}" alt="${escapeHtml(item.name)}" loading="lazy">`;
    });
    if (!gallery) {
      gallery = '<div class="detail-gallery-img detail-no-img" aria-hidden="true"></div>';
    }

    const fullDesc = item.fullDescription || item.description || '';
    const tags = item.tags || [];
    let tagsHtml = '';
    if (tags.length) {
      tagsHtml = '<div class="detail-tags">';
      tags.forEach(t => {
        tagsHtml += `<span class="detail-tag">${escapeHtml(t)}</span>`;
      });
      tagsHtml += '</div>';
    }

    overlay.innerHTML = `
      <div class="detail-content">
        <button class="detail-back" aria-label="Назад">&larr; Назад</button>
        <div class="detail-gallery">${gallery}</div>
        <div class="detail-body">
          <h2 class="detail-name">${escapeHtml(item.name)}</h2>
          <div class="detail-price">${escapeHtml(item.price)} &#8381;</div>
          <p class="detail-desc">${escapeHtml(fullDesc)}</p>
          ${tagsHtml}
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('.detail-back').addEventListener('click', () => {
      closeDetail();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetail();
    });
  }

  function closeDetail() {
    const overlay = document.getElementById('detail-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
  }

  /* ── Quiz Flow ─────────────────────────────── */
  function resetQuiz() {
    quizStep = -1;
    quizAnswers = [];
    renderQuiz();
  }

  function renderQuiz() {
    const container = document.getElementById('quiz-content');
    if (!container || !quizData) return;

    if (quizStep === -1) {
      container.innerHTML = `
        <div class="quiz-container quiz-intro">
          <h2>Подбор напитка</h2>
          <p>Ответьте на пять вопросов, и мы подберём для Вас идеальный напиток из нашего меню.</p>
          <button class="btn-primary" id="quiz-start">Начать</button>
        </div>`;
      document.getElementById('quiz-start').addEventListener('click', () => {
        quizStep = 0;
        renderQuiz();
      });
      return;
    }

    if (quizStep >= quizData.questions.length) {
      renderResults();
      return;
    }

    const q = quizData.questions[quizStep];
    let dots = '';
    for (let i = 0; i < quizData.questions.length; i++) {
      const cls = i < quizStep ? 'done' : i === quizStep ? 'current' : '';
      dots += `<div class="quiz-dot ${cls}"></div>`;
    }

    let opts = '';
    q.options.forEach(opt => {
      opts += `<button class="quiz-option" data-val="${escapeAttr(opt.value)}">${escapeHtml(opt.label)}</button>`;
    });

    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-progress">${dots}</div>
        <div class="quiz-question">${escapeHtml(q.text)}</div>
        <div class="quiz-options">${opts}</div>
      </div>`;

    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        quizAnswers.push(btn.dataset.val);
        quizStep++;
        renderQuiz();
      });
    });
  }

  function renderResults() {
    const container = document.getElementById('quiz-content');
    if (!container) return;

    const results = getRecommendations(quizAnswers, menuData.items);

    let cards = '';
    results.forEach(item => {
      const imgSrc = item.image || '';
      const imgTag = imgSrc
        ? `<img class="result-card-img" src="${encodeURI(imgSrc)}" alt="${escapeHtml(item.name)}" loading="lazy">`
        : `<div class="result-card-img" aria-hidden="true"></div>`;
      cards += `
        <div class="result-card" data-item-id="${escapeAttr(item.id)}" role="button" tabindex="0">
          ${imgTag}
          <div class="result-card-body">
            <h4>${escapeHtml(item.name)}</h4>
            <div class="reason">${escapeHtml(item.reason)}</div>
            <div class="desc">${escapeHtml(item.description)}</div>
            <div class="detail-link">Подробнее</div>
          </div>
        </div>`;
    });

    container.innerHTML = `
      <div class="results-container">
        <div class="results-title">Наши рекомендации для Вас</div>
        ${cards}
        <div style="text-align:center">
          <button class="btn-secondary" id="quiz-retry">Попробовать снова</button>
        </div>
      </div>`;

    document.getElementById('quiz-retry').addEventListener('click', resetQuiz);

    container.querySelectorAll('.result-card[data-item-id]').forEach(el => {
      el.addEventListener('click', () => {
        const item = findItemById(el.dataset.itemId);
        if (item) showDetail(item);
      });
    });
  }

  /* ── Helpers ───────────────────────────────── */
  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
