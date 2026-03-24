/* ============================================================
   MAIN.JS — Core Logic Engine
   Personal Portfolio & Blog (ML Engineer)
   Data Flow: JSON → localStorage → DOM
   SRS v2 Compliance: §6.1-6.3
   ============================================================ */

/* --- Constants --- */
const KEYS = {
  profile: 'portfolio_profile',
  posts: 'portfolio_posts',
  research: 'portfolio_research',
  cv_experience: 'portfolio_cv_experience',
  cv_education: 'portfolio_cv_education',
  cv_skills: 'portfolio_cv_skills',
  cv_projects: 'portfolio_cv_projects',
  cv_achievements: 'portfolio_cv_achievements'
};

const POSTS_PER_PAGE = 9;

/* --- Utility Functions --- */
function getPathPrefix() {
  const path = window.location.pathname;
  if (path.includes('/pages/') || path.includes('/admin/')) {
    return '../';
  }
  return '';
}

function load(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return null;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* --- SVG Icons --- */
const ICONS = {
  github: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  doi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
};

/* ============================================================
   DATA INITIALIZATION (SRS §6.1)
   ============================================================ */
async function initData() {
  const prefix = getPathPrefix();

  // Check if localStorage needs seeding
  if (!load(KEYS.profile)) {
    try {
      const [profileRes, postsRes, researchRes, cvRes] = await Promise.all([
        fetch(`${prefix}content/profile.json`),
        fetch(`${prefix}content/posts.json`),
        fetch(`${prefix}content/research.json`),
        fetch(`${prefix}content/cv.json`)
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        save(KEYS.profile, profile);
      }

      if (postsRes.ok) {
        const posts = await postsRes.json();
        save(KEYS.posts, posts);
      }

      if (researchRes.ok) {
        const research = await researchRes.json();
        save(KEYS.research, research);
      }

      if (cvRes.ok) {
        const cv = await cvRes.json();
        save(KEYS.cv_experience, cv.experience || []);
        save(KEYS.cv_education, cv.education || []);
        save(KEYS.cv_skills, cv.skills || []);
        save(KEYS.cv_projects, cv.projects || []);
        save(KEYS.cv_achievements, cv.achievements || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  // Route to correct renderer
  route();
}

/* ============================================================
   ROUTING (SRS §6.3)
   ============================================================ */
function route() {
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('/index.html') || path.endsWith('/') || path === '') {
    // Check if it's admin
    if (path.includes('/admin')) return;
    renderHome();
  } else if (path.includes('blog-detail')) {
    renderBlogDetail();
  } else if (path.includes('blog')) {
    renderBlogList();
  } else if (path.includes('research')) {
    renderResearch();
  } else if (path.includes('cv')) {
    renderCV();
  } else if (path.includes('contact')) {
    renderContact();
  }

  // Shared: render nav profile & footer
  renderNav();
  renderFooter();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function renderNav() {
  const profile = load(KEYS.profile);
  if (!profile) return;

  const logoEl = document.getElementById('navLogo');
  if (logoEl) {
    logoEl.textContent = profile.name || 'Portfolio';
  }

  // Hamburger toggle
  const hamburger = document.getElementById('navHamburger');
  const overlay = document.getElementById('navMobileOverlay');
  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      overlay.classList.toggle('open');
      document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
    });

    overlay.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ============================================================
   FOOTER
   ============================================================ */
function renderFooter() {
  const profile = load(KEYS.profile);
  if (!profile || !profile.social) return;

  const socialContainer = document.getElementById('footerSocial');
  if (!socialContainer) return;

  const socials = [
    { key: 'github', icon: ICONS.github, url: profile.social.github },
    { key: 'linkedin', icon: ICONS.linkedin, url: profile.social.linkedin },
    { key: 'twitter', icon: ICONS.twitter, url: profile.social.twitter }
  ];

  socialContainer.innerHTML = socials
    .filter(s => s.url)
    .map(s => `
      <a href="${escapeHtml(s.url)}" class="footer__social-link" 
         target="_blank" rel="noopener noreferrer" 
         aria-label="${s.key}">
        ${s.icon}
      </a>
    `).join('');
}

/* ============================================================
   HOME PAGE (SRS §2.1)
   ============================================================ */
function renderHome() {
  const profile = load(KEYS.profile);
  const posts = load(KEYS.posts) || [];

  if (profile) {
    // Avatar
    const avatarEl = document.getElementById('heroAvatar');
    if (avatarEl) {
      avatarEl.src = profile.avatar_url || '';
      avatarEl.alt = `${profile.name} avatar`;
      avatarEl.onerror = function() {
        this.style.background = '#F0F0F0';
        this.alt = 'Avatar';
      };
    }

    // Greeting
    const greetingEl = document.getElementById('heroGreeting');
    if (greetingEl) greetingEl.textContent = profile.greeting || '';

    // Title
    const titleEl = document.getElementById('heroTitle');
    if (titleEl) titleEl.textContent = profile.title || '';

    // Bio
    const bioEl = document.getElementById('heroBio');
    if (bioEl) bioEl.textContent = profile.bio || '';

    // Skills
    const skillsEl = document.getElementById('skillsList');
    if (skillsEl && profile.skills) {
      skillsEl.innerHTML = profile.skills
        .map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join('');
    }
  }

  // Latest 6 published articles
  const publishedPosts = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const gridEl = document.getElementById('homeArticlesGrid');
  if (gridEl) {
    gridEl.innerHTML = publishedPosts.map((post, idx) => createArticleCard(post, idx)).join('');
    attachCardListeners(gridEl);
  }
}

/* ============================================================
   CONTACT SECTION SETUP
   ============================================================ */
function setupContactSection() {
  const profile = load(KEYS.profile);
  
  // Render contact links
  if (profile && profile.social) {
    const contactLinksEl = document.getElementById('contactLinks');
    if (contactLinksEl) {
      const socialLinks = [];
      if (profile.social.email) {
        socialLinks.push(`<a href="mailto:${escapeHtml(profile.social.email)}" style="color:var(--text-secondary);display:flex;align-items:center;gap:6px;text-decoration:none;"><span style="width:20px;">${ICONS.email}</span> Email</a>`);
      }
      if (profile.social.github) {
        socialLinks.push(`<a href="${escapeHtml(profile.social.github)}" target="_blank" style="color:var(--text-secondary);display:flex;align-items:center;gap:6px;text-decoration:none;"><span style="width:20px;fill:currentColor;">${ICONS.github}</span> GitHub</a>`);
      }
      if (profile.social.linkedin) {
        socialLinks.push(`<a href="${escapeHtml(profile.social.linkedin)}" target="_blank" style="color:var(--text-secondary);display:flex;align-items:center;gap:6px;text-decoration:none;"><span style="width:20px;fill:currentColor;">${ICONS.linkedin}</span> LinkedIn</a>`);
      }
      contactLinksEl.innerHTML = socialLinks.join('');
    }
  }

  // Setup Message Form
  const msgForm = document.getElementById('messageForm');
  if (msgForm) {
    msgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const messages = load('portfolio_messages') || [];
      const newMsg = {
        id: 'msg-' + Date.now(),
        name: document.getElementById('msgName').value.trim(),
        email: document.getElementById('msgEmail').value.trim(),
        title: document.getElementById('msgTitle').value.trim(),
        content: document.getElementById('msgContent').value.trim(),
        date: new Date().toISOString()
      };
      messages.unshift(newMsg); // newest first
      save('portfolio_messages', messages);
      
      document.getElementById('messageSuccess').style.display = 'block';
      msgForm.reset();
      
      setTimeout(() => {
        document.getElementById('messageSuccess').style.display = 'none';
      }, 5000);
    });
  }
}

function renderContact() {
  setupContactSection();
}

/* ============================================================
   ARTICLE CARD COMPONENT
   ============================================================ */
function createArticleCard(post, index = 0) {
  const prefix = getPathPrefix();
  const detailUrl = `${prefix}pages/blog-detail.html?id=${encodeURIComponent(post.id)}`;
  const delay = index * 80;

  return `
    <article class="card fade-in-up" data-url="${detailUrl}" style="animation-delay: ${delay}ms">
      <img class="card__thumbnail" 
           src="${escapeHtml(post.thumbnail || '')}" 
           alt="${escapeHtml(post.title)}"
           loading="lazy"
           onerror="this.style.background='#F0F0F0'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'">
      <div class="card__body">
        <div class="card__tags">
          ${(post.tags || []).slice(0, 3).map(tag => 
            `<span class="card__tag">${escapeHtml(tag)}</span>`
          ).join('')}
        </div>
        <h3 class="card__title">${escapeHtml(post.title)}</h3>
        <p class="card__excerpt">${escapeHtml(post.excerpt || '')}</p>
        <div class="card__meta">
          <span class="card__meta--date">${formatDate(post.date)}</span>
          <span>${post.read_time || 0} min read</span>
        </div>
      </div>
    </article>
  `;
}

function attachCardListeners(container) {
  container.querySelectorAll('.card[data-url]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.dataset.url;
    });
  });
}

/* ============================================================
   BLOG LIST PAGE (SRS §2.2)
   ============================================================ */
let fuseInstance = null;
let currentPage = 1;
let activeTag = null;
let filteredPosts = [];

function renderBlogList() {
  const posts = load(KEYS.posts) || [];
  const publishedPosts = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  filteredPosts = publishedPosts;

  // Init Fuse.js for search
  if (typeof Fuse !== 'undefined') {
    fuseInstance = new Fuse(publishedPosts, {
      keys: ['title', 'tags'],
      threshold: 0.3,
      includeScore: true
    });
  }

  // Render tags filter
  renderTagFilter(publishedPosts);

  // Search input
  const searchInput = document.getElementById('blogSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query && fuseInstance) {
        const results = fuseInstance.search(query);
        filteredPosts = results.map(r => r.item);
      } else {
        filteredPosts = activeTag
          ? publishedPosts.filter(p => p.tags && p.tags.includes(activeTag))
          : publishedPosts;
      }
      currentPage = 1;
      renderBlogGrid();
      renderPagination();
    });
  }

  // Initial render
  renderBlogGrid();
  renderPagination();
}

function renderTagFilter(posts) {
  const tagSet = new Set();
  posts.forEach(p => {
    if (p.tags) p.tags.forEach(t => tagSet.add(t));
  });

  const container = document.getElementById('tagFilter');
  if (!container) return;

  const allBtn = `<button class="tag-filter__btn tag-filter__btn--active" data-tag="">All</button>`;
  const tagBtns = Array.from(tagSet).sort().map(tag =>
    `<button class="tag-filter__btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
  ).join('');

  container.innerHTML = allBtn + tagBtns;

  container.querySelectorAll('.tag-filter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      activeTag = tag || null;

      container.querySelectorAll('.tag-filter__btn').forEach(b => b.classList.remove('tag-filter__btn--active'));
      btn.classList.add('tag-filter__btn--active');

      const allPosts = (load(KEYS.posts) || []).filter(p => p.status === 'published');
      filteredPosts = activeTag
        ? allPosts.filter(p => p.tags && p.tags.includes(activeTag))
        : allPosts;

      // Clear search
      const searchInput = document.getElementById('blogSearch');
      if (searchInput) searchInput.value = '';

      currentPage = 1;
      renderBlogGrid();
      renderPagination();
    });
  });
}

function renderBlogGrid() {
  const gridEl = document.getElementById('blogGrid');
  if (!gridEl) return;

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

  if (pagePosts.length === 0) {
    gridEl.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);grid-column:1/-1;padding:3rem 0;">No articles found.</p>';
    return;
  }

  gridEl.innerHTML = pagePosts.map((post, idx) => createArticleCard(post, idx)).join('');
  attachCardListeners(gridEl);
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next →</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.pagination__btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderBlogGrid();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   BLOG DETAIL PAGE (SRS §2.3)
   ============================================================ */
function renderBlogDetail() {
  const postId = getUrlParam('id');
  const posts = load(KEYS.posts) || [];
  const post = posts.find(p => p.id === postId);

  const container = document.getElementById('articleDetail');
  if (!container) return;

  if (!post) {
    container.innerHTML = `
      <div class="not-found">
        <h1 class="not-found__title">Bài viết không tồn tại</h1>
        <p>The article you're looking for doesn't exist or has been removed.</p>
        <a href="../pages/blog.html" class="not-found__btn">← Back to Blog</a>
      </div>
    `;
    return;
  }

  // Render with Marked.js
  let htmlContent = '';
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      highlight: function(code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
      },
      breaks: true
    });
    htmlContent = marked.parse(post.content || '');
  } else {
    htmlContent = `<p>${escapeHtml(post.content || '')}</p>`;
  }

  container.innerHTML = `
    <a href="../pages/blog.html" class="article-detail__back">
      ${ICONS.arrow}
      <span>Back to Blog</span>
    </a>
    <h1 class="article-detail__title">${escapeHtml(post.title)}</h1>
    <div class="article-detail__meta">
      <span>${formatDate(post.date)}</span>
      <span>${post.read_time || 0} min read</span>
      <div class="article-detail__tags">
        ${(post.tags || []).map(tag => 
          `<span class="card__tag">${escapeHtml(tag)}</span>`
        ).join('')}
      </div>
    </div>
    <div class="article-detail__content">
      ${htmlContent}
    </div>
  `;

  // Update page title
  document.title = `${post.title} — Portfolio`;
}

/* ============================================================
   RESEARCH PAGE (SRS §2.4)
   ============================================================ */
function renderResearch() {
  const research = load(KEYS.research) || [];
  const container = document.getElementById('researchTimeline');
  if (!container) return;

  // Group by year, sort desc
  const grouped = {};
  research.forEach(item => {
    const year = item.year || 'Unknown';
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(item);
  });

  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  let html = '';
  sortedYears.forEach(year => {
    html += `<h2 class="timeline__year">${escapeHtml(String(year))}</h2>`;
    grouped[year].forEach(item => {
      html += `
        <div class="timeline__item fade-in-up">
          <h3 class="timeline__paper">${escapeHtml(item.paper_title || '')}</h3>
          <p class="timeline__authors">${escapeHtml(item.authors || '')}</p>
          <p class="timeline__journal">${escapeHtml(item.journal || '')}</p>
          <div class="timeline__links">
            ${item.doi_url ? `<a href="${escapeHtml(item.doi_url)}" class="timeline__link" target="_blank" rel="noopener noreferrer">${ICONS.doi} DOI</a>` : ''}
            ${item.pdf_url ? `<a href="${escapeHtml(item.pdf_url)}" class="timeline__link" target="_blank" rel="noopener noreferrer">${ICONS.pdf} PDF</a>` : ''}
          </div>
        </div>
      `;
    });
  });

  container.innerHTML = html;
}

/* ============================================================
   CV PAGE (SRS §2.5)
   ============================================================ */
function renderCV() {
  renderCVExperience();
  renderCVProjects();
  renderCVPublications();
  renderCVSkills();
  renderCVEducation();
  renderCVAchievements();
}

function renderCVExperience() {
  const data = load(KEYS.cv_experience) || [];
  const container = document.getElementById('cvExperience');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="cv-item fade-in-up">
      <div class="cv-item__header">
        <div>
          <h3 class="cv-item__role">${escapeHtml(item.role || '')}</h3>
          <p class="cv-item__company">${escapeHtml(item.company || '')}</p>
        </div>
        <span class="cv-item__period">${escapeHtml(item.period || '')}</span>
      </div>
      <p class="cv-item__description">${escapeHtml(item.description || '')}</p>
    </div>
  `).join('');
}

function renderCVEducation() {
  const data = load(KEYS.cv_education) || [];
  const container = document.getElementById('cvEducation');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="cv-item fade-in-up">
      <div class="cv-item__header">
        <div>
          <h3 class="cv-item__role">${escapeHtml(item.degree || '')}</h3>
          <p class="cv-item__company">${escapeHtml(item.school || '')}</p>
        </div>
        <span class="cv-item__period">${escapeHtml(item.period || '')}</span>
      </div>
      ${item.gpa ? `<p class="cv-item__gpa">GPA: ${escapeHtml(item.gpa)}</p>` : ''}
    </div>
  `).join('');
}

function renderCVSkills() {
  const data = load(KEYS.cv_skills) || [];
  const container = document.getElementById('cvSkills');
  if (!container) return;

  container.innerHTML = data.map(cat => `
    <div class="cv-skill-category">
      <h4 class="cv-skill-category__title">${escapeHtml(cat.category || '')}</h4>
      <div class="cv-skill-category__items">
        ${(cat.items || []).map(item => 
          `<span class="skill-tag">${escapeHtml(item)}</span>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

function renderCVProjects() {
  const data = load(KEYS.cv_projects) || [];
  const container = document.getElementById('cvProjects');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="cv-item fade-in-up">
      <h3 class="cv-item__role">${escapeHtml(item.name || '')}</h3>
      <p class="cv-item__description">${escapeHtml(item.description || '')}</p>
      <div class="cv-project__tech">
        ${(item.tech || []).map(t => 
          `<span class="skill-tag">${escapeHtml(t)}</span>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

function renderCVPublications() {
  const data = load(KEYS.research) || [];
  const container = document.getElementById('cvPublications');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="cv-item fade-in-up">
      <h3 class="cv-item__role">${escapeHtml(item.paper_title || '')}</h3>
      <p class="cv-item__company">${escapeHtml(item.authors || '')}</p>
      <p class="cv-item__description">${escapeHtml(item.journal || '')} — ${escapeHtml(String(item.year || ''))}</p>
    </div>
  `).join('');
}

function renderCVAchievements() {
  const data = load(KEYS.cv_achievements) || [];
  const container = document.getElementById('cvAchievements');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = '<p class="cv-item__description" style="color:var(--text-tertiary);font-style:italic;">Đang cập nhật...</p>';
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="cv-item fade-in-up">
      <h3 class="cv-item__role">${escapeHtml(item.title || '')}</h3>
      <p class="cv-item__company">${escapeHtml(item.organization || '')}</p>
      <p class="cv-item__description">${escapeHtml(item.description || '')}</p>
    </div>
  `).join('');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initData);
