/* ============================================================
   ADMIN.JS — Admin CMS Logic
   Personal Portfolio & Blog (ML Engineer)
   SRS v2 §2.6 & §6.4
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
  cv_achievements: 'portfolio_cv_achievements',
  messages: 'portfolio_messages'
};

/* --- Utility Functions --- */
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

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateId() {
  return 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function showBanner() {
  const banner = document.getElementById('saveBanner');
  if (banner) {
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 8000);
  }
}

/* ============================================================
   AUTHENTICATION (SRS §2.6 — SHA-256)
   ============================================================ */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
  const passwordInput = document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');
  const password = passwordInput.value;

  if (!password) return;

  const hash = await hashPassword(password);

  if (hash === ADMIN_PASSWORD_HASH) {
    sessionStorage.setItem('adminAuth', 'true');
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').classList.add('active');
    initDashboard();
  } else {
    errorEl.style.display = 'block';
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function checkAuth() {
  if (sessionStorage.getItem('adminAuth') === 'true') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').classList.add('active');
    initDashboard();
  }
}

function logout() {
  sessionStorage.removeItem('adminAuth');
  location.reload();
}

/* ============================================================
   DATA INITIALIZATION
   ============================================================ */
async function seedDataIfNeeded() {
  if (!load(KEYS.profile)) {
    try {
      const [profileRes, postsRes, researchRes, cvRes] = await Promise.all([
        fetch('../content/profile.json'),
        fetch('../content/posts.json'),
        fetch('../content/research.json'),
        fetch('../content/cv.json')
      ]);

      if (profileRes.ok) save(KEYS.profile, await profileRes.json());
      if (postsRes.ok) save(KEYS.posts, await postsRes.json());
      if (researchRes.ok) save(KEYS.research, await researchRes.json());
      if (cvRes.ok) {
        const cv = await cvRes.json();
        save(KEYS.cv_experience, cv.experience || []);
        save(KEYS.cv_education, cv.education || []);
        save(KEYS.cv_skills, cv.skills || []);
        save(KEYS.cv_projects, cv.projects || []);
        save(KEYS.cv_achievements, cv.achievements || []);
      }
    } catch (err) {
      console.error('Error seeding data:', err);
    }
  }
}

/* ============================================================
   DASHBOARD INITIALIZATION
   ============================================================ */
function initDashboard() {
  initSidebar();
  initProfile();
  initBlog();
  initResearch();
  initCV();
  initMessages();
  initTools();
  initMobileSidebar();
}

/* --- Sidebar Navigation --- */
function initSidebar() {
  const links = document.querySelectorAll('.admin-sidebar__link[data-panel]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const panel = link.dataset.panel;

      // Update active link
      links.forEach(l => l.classList.remove('admin-sidebar__link--active'));
      link.classList.add('admin-sidebar__link--active');

      // Show panel
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(`panel${panel.charAt(0).toUpperCase() + panel.slice(1)}`);
      if (targetPanel) targetPanel.classList.add('active');

      // Close mobile sidebar
      const sidebar = document.getElementById('adminSidebar');
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function initMobileSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

/* ============================================================
   PROFILE MANAGEMENT
   ============================================================ */
function initProfile() {
  const profile = load(KEYS.profile) || {};

  document.getElementById('profileName').value = profile.name || '';
  document.getElementById('profileTitle').value = profile.title || '';
  document.getElementById('profileGreeting').value = profile.greeting || '';
  document.getElementById('profileBio').value = profile.bio || '';
  document.getElementById('profileLocation').value = profile.location || '';
  document.getElementById('profileAvatar').value = profile.avatar_url || '';
  document.getElementById('profileSkills').value = (profile.skills || []).join(', ');
  document.getElementById('profileEmail').value = (profile.social && profile.social.email) || '';
  document.getElementById('profileGithub').value = (profile.social && profile.social.github) || '';
  document.getElementById('profileLinkedin').value = (profile.social && profile.social.linkedin) || '';
  document.getElementById('profileTwitter').value = (profile.social && profile.social.twitter) || '';

  document.getElementById('saveProfile').addEventListener('click', () => {
    const updatedProfile = {
      name: document.getElementById('profileName').value,
      title: document.getElementById('profileTitle').value,
      greeting: document.getElementById('profileGreeting').value,
      bio: document.getElementById('profileBio').value,
      location: document.getElementById('profileLocation').value,
      avatar_url: document.getElementById('profileAvatar').value,
      skills: document.getElementById('profileSkills').value.split(',').map(s => s.trim()).filter(Boolean),
      social: {
        email: document.getElementById('profileEmail').value,
        github: document.getElementById('profileGithub').value,
        linkedin: document.getElementById('profileLinkedin').value,
        twitter: document.getElementById('profileTwitter').value
      }
    };
    save(KEYS.profile, updatedProfile);
    showBanner();
  });
}

/* ============================================================
   BLOG MANAGEMENT (CRUD + Markdown Editor)
   ============================================================ */
let editingPostId = null;

function initBlog() {
  renderBlogTable();

  // New Post
  document.getElementById('newPostBtn').addEventListener('click', () => {
    editingPostId = null;
    clearPostForm();
    document.getElementById('blogEditTitle').textContent = 'New Post';
    document.getElementById('blogListView').style.display = 'none';
    document.getElementById('blogEditView').style.display = 'block';
    document.getElementById('postDate').value = new Date().toISOString().split('T')[0];
  });

  // Cancel
  document.getElementById('cancelPostBtn').addEventListener('click', () => {
    document.getElementById('blogEditView').style.display = 'none';
    document.getElementById('blogListView').style.display = 'block';
    editingPostId = null;
  });

  // Save Post
  document.getElementById('savePostBtn').addEventListener('click', savePost);

  // Live Preview
  const contentTextarea = document.getElementById('postContent');
  if (contentTextarea) {
    contentTextarea.addEventListener('input', updatePreview);
  }

  // Auto-generate slug from title
  const titleInput = document.getElementById('postTitle');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (!editingPostId) {
        document.getElementById('postSlug').value = slugify(titleInput.value);
      }
    });
  }

  // Mobile editor toggle
  initEditorToggle();
}

function renderBlogTable() {
  const posts = load(KEYS.posts) || [];
  const tbody = document.getElementById('blogTableBody');
  if (!tbody) return;

  tbody.innerHTML = posts.map(post => `
    <tr>
      <td style="font-weight:600;color:var(--text-primary);max-width:300px;">${escapeHtml(post.title)}</td>
      <td>${escapeHtml(post.date || '')}</td>
      <td>
        <span class="admin-table__status admin-table__status--${post.status}">
          ${post.status === 'published' ? '● Published' : '○ Draft'}
        </span>
      </td>
      <td>
        <div class="admin-table__actions">
          <button class="admin-btn" onclick="editPost('${post.id}')">Edit</button>
          <button class="admin-btn admin-btn--danger" onclick="deletePost('${post.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function clearPostForm() {
  document.getElementById('postTitle').value = '';
  document.getElementById('postSlug').value = '';
  document.getElementById('postDate').value = '';
  document.getElementById('postStatus').value = 'draft';
  document.getElementById('postReadTime').value = '5';
  document.getElementById('postTags').value = '';
  document.getElementById('postThumbnail').value = '';
  document.getElementById('postExcerpt').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postPreview').innerHTML = '';
}

function editPost(id) {
  const posts = load(KEYS.posts) || [];
  const post = posts.find(p => p.id === id);
  if (!post) return;

  editingPostId = id;
  document.getElementById('blogEditTitle').textContent = 'Edit Post';
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postSlug').value = post.slug || '';
  document.getElementById('postDate').value = post.date || '';
  document.getElementById('postStatus').value = post.status || 'draft';
  document.getElementById('postReadTime').value = post.read_time || 5;
  document.getElementById('postTags').value = (post.tags || []).join(', ');
  document.getElementById('postThumbnail').value = post.thumbnail || '';
  document.getElementById('postExcerpt').value = post.excerpt || '';
  document.getElementById('postContent').value = post.content || '';

  updatePreview();

  document.getElementById('blogListView').style.display = 'none';
  document.getElementById('blogEditView').style.display = 'block';
}

function savePost() {
  const posts = load(KEYS.posts) || [];
  const title = document.getElementById('postTitle').value.trim();
  if (!title) {
    alert('Title is required.');
    return;
  }

  const postData = {
    id: editingPostId || generateId(),
    title: title,
    slug: document.getElementById('postSlug').value.trim() || slugify(title),
    date: document.getElementById('postDate').value,
    read_time: parseInt(document.getElementById('postReadTime').value) || 5,
    tags: document.getElementById('postTags').value.split(',').map(s => s.trim()).filter(Boolean),
    thumbnail: document.getElementById('postThumbnail').value.trim(),
    excerpt: document.getElementById('postExcerpt').value.trim(),
    status: document.getElementById('postStatus').value,
    content: document.getElementById('postContent').value
  };

  if (editingPostId) {
    const idx = posts.findIndex(p => p.id === editingPostId);
    if (idx !== -1) posts[idx] = postData;
  } else {
    posts.unshift(postData);
  }

  save(KEYS.posts, posts);
  renderBlogTable();
  
  document.getElementById('blogEditView').style.display = 'none';
  document.getElementById('blogListView').style.display = 'block';
  editingPostId = null;
  showBanner();
}

function deletePost(id) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  let posts = load(KEYS.posts) || [];
  posts = posts.filter(p => p.id !== id);
  save(KEYS.posts, posts);
  renderBlogTable();
  showBanner();
}

function updatePreview() {
  const content = document.getElementById('postContent').value;
  const previewEl = document.getElementById('postPreview');
  if (!previewEl) return;

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
    previewEl.innerHTML = marked.parse(content || '');
  } else {
    previewEl.textContent = content;
  }
}

function initEditorToggle() {
  const editBtn = document.getElementById('toggleEdit');
  const previewBtn = document.getElementById('togglePreview');
  const editPane = document.querySelector('.admin-editor__pane--edit');
  const previewPane = document.querySelector('.admin-editor__pane--preview');

  if (editBtn && previewBtn) {
    editBtn.addEventListener('click', () => {
      editBtn.classList.add('admin-editor-toggle__btn--active');
      previewBtn.classList.remove('admin-editor-toggle__btn--active');
      editPane.classList.remove('hide');
      previewPane.classList.remove('show');
    });

    previewBtn.addEventListener('click', () => {
      previewBtn.classList.add('admin-editor-toggle__btn--active');
      editBtn.classList.remove('admin-editor-toggle__btn--active');
      editPane.classList.add('hide');
      previewPane.classList.add('show');
      updatePreview();
    });
  }
}

/* ============================================================
   RESEARCH MANAGEMENT
   ============================================================ */
let editingResearchIdx = -1;

function initResearch() {
  renderResearchTable();

  document.getElementById('addResearchBtn').addEventListener('click', () => {
    editingResearchIdx = -1;
    clearResearchForm();
    document.getElementById('researchFormTitle').textContent = 'Add Publication';
    document.getElementById('researchFormContainer').style.display = 'block';
  });

  document.getElementById('saveResearchBtn').addEventListener('click', saveResearch);
  document.getElementById('cancelResearchBtn').addEventListener('click', () => {
    document.getElementById('researchFormContainer').style.display = 'none';
    editingResearchIdx = -1;
  });
}

function renderResearchTable() {
  const research = load(KEYS.research) || [];
  const tbody = document.getElementById('researchTableBody');
  if (!tbody) return;

  tbody.innerHTML = research.map((item, idx) => `
    <tr>
      <td style="font-weight:600;color:var(--text-primary);max-width:300px;">${escapeHtml(item.paper_title)}</td>
      <td>${item.year || ''}</td>
      <td style="color:var(--text-tertiary);font-style:italic;">${escapeHtml(item.journal || '')}</td>
      <td>
        <div class="admin-table__actions">
          <button class="admin-btn" onclick="editResearch(${idx})">Edit</button>
          <button class="admin-btn admin-btn--danger" onclick="deleteResearch(${idx})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function clearResearchForm() {
  document.getElementById('resPaperTitle').value = '';
  document.getElementById('resAuthors').value = '';
  document.getElementById('resJournal').value = '';
  document.getElementById('resYear').value = new Date().getFullYear();
  document.getElementById('resDoi').value = '';
  document.getElementById('resPdf').value = '';
}

function editResearch(idx) {
  const research = load(KEYS.research) || [];
  const item = research[idx];
  if (!item) return;

  editingResearchIdx = idx;
  document.getElementById('researchFormTitle').textContent = 'Edit Publication';
  document.getElementById('resPaperTitle').value = item.paper_title || '';
  document.getElementById('resAuthors').value = item.authors || '';
  document.getElementById('resJournal').value = item.journal || '';
  document.getElementById('resYear').value = item.year || '';
  document.getElementById('resDoi').value = item.doi_url || '';
  document.getElementById('resPdf').value = item.pdf_url || '';
  document.getElementById('researchFormContainer').style.display = 'block';
}

function saveResearch() {
  const research = load(KEYS.research) || [];
  const entry = {
    paper_title: document.getElementById('resPaperTitle').value.trim(),
    authors: document.getElementById('resAuthors').value.trim(),
    journal: document.getElementById('resJournal').value.trim(),
    year: parseInt(document.getElementById('resYear').value) || new Date().getFullYear(),
    doi_url: document.getElementById('resDoi').value.trim(),
    pdf_url: document.getElementById('resPdf').value.trim()
  };

  if (!entry.paper_title) {
    alert('Paper title is required.');
    return;
  }

  if (editingResearchIdx >= 0) {
    research[editingResearchIdx] = entry;
  } else {
    research.unshift(entry);
  }

  save(KEYS.research, research);
  renderResearchTable();
  document.getElementById('researchFormContainer').style.display = 'none';
  editingResearchIdx = -1;
  showBanner();
}

function deleteResearch(idx) {
  if (!confirm('Delete this publication?')) return;
  const research = load(KEYS.research) || [];
  research.splice(idx, 1);
  save(KEYS.research, research);
  renderResearchTable();
  showBanner();
}

/* ============================================================
   CV MANAGEMENT (4 sub-sections)
   ============================================================ */
let currentCvTab = 'experience';

function initCV() {
  // Tab switching
  document.querySelectorAll('[data-cvtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-cvtab]').forEach(b => b.classList.remove('admin-editor-toggle__btn--active'));
      btn.classList.add('admin-editor-toggle__btn--active');
      currentCvTab = btn.dataset.cvtab;
      renderCvAdmin();
    });
  });

  renderCvAdmin();
}

function renderCvAdmin() {
  const container = document.getElementById('cvAdminContent');
  if (!container) return;

  switch (currentCvTab) {
    case 'experience': renderCvExperienceAdmin(container); break;
    case 'education': renderCvEducationAdmin(container); break;
    case 'skills': renderCvSkillsAdmin(container); break;
    case 'projects': renderCvProjectsAdmin(container); break;
    case 'achievements': renderCvAchievementsAdmin(container); break;
  }
}

function renderCvExperienceAdmin(container) {
  const data = load(KEYS.cv_experience) || [];
  container.innerHTML = `
    <button class="admin-btn admin-btn--primary" onclick="addCvExperience()" style="margin-bottom:var(--space-lg);">+ Add Experience</button>
    ${data.map((item, idx) => `
      <div class="cv-item" style="border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-lg);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:var(--space-sm);">
          <div>
            <strong>${escapeHtml(item.role)}</strong><br>
            <span style="color:var(--text-secondary)">${escapeHtml(item.company)}</span>
            <span style="color:var(--text-tertiary);font-size:0.85rem;margin-left:8px;">${escapeHtml(item.period)}</span>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="admin-btn" onclick="editCvExperience(${idx})">Edit</button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCvItem('${KEYS.cv_experience}', ${idx})">Delete</button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-tertiary)">${escapeHtml(item.description)}</p>
      </div>
    `).join('')}
  `;
}

function addCvExperience() {
  const role = prompt('Role / Position:');
  if (!role) return;
  const company = prompt('Company:') || '';
  const period = prompt('Period (e.g. 2023 — Present):') || '';
  const description = prompt('Description:') || '';

  const data = load(KEYS.cv_experience) || [];
  data.push({ role, company, period, description });
  save(KEYS.cv_experience, data);
  renderCvAdmin();
  showBanner();
}

function editCvExperience(idx) {
  const data = load(KEYS.cv_experience) || [];
  const item = data[idx];
  if (!item) return;

  const role = prompt('Role:', item.role);
  if (role === null) return;
  const company = prompt('Company:', item.company);
  const period = prompt('Period:', item.period);
  const description = prompt('Description:', item.description);

  data[idx] = { role: role || item.role, company: company || '', period: period || '', description: description || '' };
  save(KEYS.cv_experience, data);
  renderCvAdmin();
  showBanner();
}

function renderCvEducationAdmin(container) {
  const data = load(KEYS.cv_education) || [];
  container.innerHTML = `
    <button class="admin-btn admin-btn--primary" onclick="addCvEducation()" style="margin-bottom:var(--space-lg);">+ Add Education</button>
    ${data.map((item, idx) => `
      <div class="cv-item" style="border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-lg);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <strong>${escapeHtml(item.degree)}</strong><br>
            <span style="color:var(--text-secondary)">${escapeHtml(item.school)}</span>
            <span style="color:var(--text-tertiary);font-size:0.85rem;margin-left:8px;">${escapeHtml(item.period)}</span>
            ${item.gpa ? `<br><span style="font-size:0.85rem;color:var(--text-tertiary)">GPA: ${escapeHtml(item.gpa)}</span>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="admin-btn" onclick="editCvEducation(${idx})">Edit</button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCvItem('${KEYS.cv_education}', ${idx})">Delete</button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

function addCvEducation() {
  const degree = prompt('Degree:');
  if (!degree) return;
  const school = prompt('School:') || '';
  const period = prompt('Period:') || '';
  const gpa = prompt('GPA (optional):') || '';

  const data = load(KEYS.cv_education) || [];
  data.push({ degree, school, period, gpa });
  save(KEYS.cv_education, data);
  renderCvAdmin();
  showBanner();
}

function editCvEducation(idx) {
  const data = load(KEYS.cv_education) || [];
  const item = data[idx];
  if (!item) return;

  const degree = prompt('Degree:', item.degree);
  if (degree === null) return;
  const school = prompt('School:', item.school);
  const period = prompt('Period:', item.period);
  const gpa = prompt('GPA:', item.gpa);

  data[idx] = { degree: degree || item.degree, school: school || '', period: period || '', gpa: gpa || '' };
  save(KEYS.cv_education, data);
  renderCvAdmin();
  showBanner();
}

function renderCvSkillsAdmin(container) {
  const data = load(KEYS.cv_skills) || [];
  container.innerHTML = `
    <button class="admin-btn admin-btn--primary" onclick="addCvSkillCategory()" style="margin-bottom:var(--space-lg);">+ Add Skill Category</button>
    ${data.map((cat, idx) => `
      <div style="border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-lg);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);">
          <strong>${escapeHtml(cat.category)}</strong>
          <div style="display:flex;gap:4px;">
            <button class="admin-btn" onclick="editCvSkillCategory(${idx})">Edit</button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCvItem('${KEYS.cv_skills}', ${idx})">Delete</button>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(cat.items || []).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function addCvSkillCategory() {
  const category = prompt('Category name:');
  if (!category) return;
  const items = prompt('Skills (comma-separated):') || '';

  const data = load(KEYS.cv_skills) || [];
  data.push({ category, items: items.split(',').map(s => s.trim()).filter(Boolean) });
  save(KEYS.cv_skills, data);
  renderCvAdmin();
  showBanner();
}

function editCvSkillCategory(idx) {
  const data = load(KEYS.cv_skills) || [];
  const cat = data[idx];
  if (!cat) return;

  const category = prompt('Category:', cat.category);
  if (category === null) return;
  const items = prompt('Skills (comma-separated):', (cat.items || []).join(', '));

  data[idx] = {
    category: category || cat.category,
    items: (items || '').split(',').map(s => s.trim()).filter(Boolean)
  };
  save(KEYS.cv_skills, data);
  renderCvAdmin();
  showBanner();
}

function renderCvProjectsAdmin(container) {
  const data = load(KEYS.cv_projects) || [];
  container.innerHTML = `
    <button class="admin-btn admin-btn--primary" onclick="addCvProject()" style="margin-bottom:var(--space-lg);">+ Add Project</button>
    ${data.map((item, idx) => `
      <div class="cv-item" style="border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-lg);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:var(--space-sm);">
          <strong>${escapeHtml(item.name)}</strong>
          <div style="display:flex;gap:4px;">
            <button class="admin-btn" onclick="editCvProject(${idx})">Edit</button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCvItem('${KEYS.cv_projects}', ${idx})">Delete</button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:var(--space-sm);">${escapeHtml(item.description)}</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${(item.tech || []).map(t => `<span class="skill-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function addCvProject() {
  const name = prompt('Project name:');
  if (!name) return;
  const description = prompt('Description:') || '';
  const tech = prompt('Technologies (comma-separated):') || '';

  const data = load(KEYS.cv_projects) || [];
  data.push({ name, description, tech: tech.split(',').map(s => s.trim()).filter(Boolean) });
  save(KEYS.cv_projects, data);
  renderCvAdmin();
  showBanner();
}

function editCvProject(idx) {
  const data = load(KEYS.cv_projects) || [];
  const item = data[idx];
  if (!item) return;

  const name = prompt('Project name:', item.name);
  if (name === null) return;
  const description = prompt('Description:', item.description);
  const tech = prompt('Technologies:', (item.tech || []).join(', '));

  data[idx] = {
    name: name || item.name,
    description: description || '',
    tech: (tech || '').split(',').map(s => s.trim()).filter(Boolean)
  };
  save(KEYS.cv_projects, data);
  renderCvAdmin();
  showBanner();
}

function deleteCvItem(key, idx) {
  if (!confirm('Delete this entry?')) return;
  const data = load(key) || [];
  data.splice(idx, 1);
  save(key, data);
  renderCvAdmin();
  showBanner();
}

function renderCvAchievementsAdmin(container) {
  const data = load(KEYS.cv_achievements) || [];
  container.innerHTML = `
    <button class="admin-btn admin-btn--primary" onclick="addCvAchievement()" style="margin-bottom:var(--space-lg);">+ Add Achievement</button>
    ${data.map((item, idx) => `
      <div class="cv-item" style="border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-lg);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:var(--space-sm);">
          <strong>${escapeHtml(item.title)}</strong>
          <div style="display:flex;gap:4px;">
            <button class="admin-btn" onclick="editCvAchievement(${idx})">Edit</button>
            <button class="admin-btn admin-btn--danger" onclick="deleteCvItem('${KEYS.cv_achievements}', ${idx})">Delete</button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-sm);">${escapeHtml(item.organization)}</p>
        <p style="font-size:0.85rem;color:var(--text-tertiary);">${escapeHtml(item.description)}</p>
      </div>
    `).join('')}
  `;
}

function addCvAchievement() {
  const title = prompt('Achievement Title:');
  if (!title) return;
  const organization = prompt('Organization / Issuer:') || '';
  const description = prompt('Description:') || '';

  const data = load(KEYS.cv_achievements) || [];
  data.push({ title, organization, description });
  save(KEYS.cv_achievements, data);
  renderCvAdmin();
  showBanner();
}

function editCvAchievement(idx) {
  const data = load(KEYS.cv_achievements) || [];
  const item = data[idx];
  if (!item) return;

  const title = prompt('Achievement Title:', item.title);
  if (title === null) return;
  const organization = prompt('Organization:', item.organization);
  const description = prompt('Description:', item.description);

  data[idx] = { title: title || item.title, organization: organization || '', description: description || '' };
  save(KEYS.cv_achievements, data);
  renderCvAdmin();
  showBanner();
}

/* ============================================================
   MESSAGES MANAGEMENT
   ============================================================ */
function initMessages() {
  renderMessagesTable();

  const closeBtn = document.getElementById('closeMessageBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('messageDetailView').style.display = 'none';
      document.querySelector('#panelMessages .admin-table').style.display = 'table';
    });
  }
}

function renderMessagesTable() {
  const messages = load(KEYS.messages) || [];
  const tbody = document.getElementById('messagesTableBody');
  if (!tbody) return;

  if (messages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-tertiary);padding:var(--space-md);">No messages yet.</td></tr>';
    return;
  }

  const sorted = messages.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(msg => `
    <tr>
      <td style="font-size:0.85em;color:var(--text-tertiary);">${escapeHtml(new Date(msg.date).toLocaleDateString())}</td>
      <td style="font-weight:600;color:var(--text-primary);">${escapeHtml(msg.name)}<br><span style="font-size:0.8em;font-weight:normal;color:var(--text-secondary);">${escapeHtml(msg.email)}</span></td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(msg.title)}</td>
      <td>
        <div class="admin-table__actions">
          <button class="admin-btn" onclick="viewMessage('${msg.id}')">View</button>
          <button class="admin-btn admin-btn--danger" onclick="deleteMessage('${msg.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function viewMessage(id) {
  const messages = load(KEYS.messages) || [];
  const msg = messages.find(m => m.id === id);
  if (!msg) return;

  document.getElementById('msgViewTitle').textContent = msg.title;
  document.getElementById('msgViewFrom').textContent = msg.name + ' <' + msg.email + '>';
  document.getElementById('msgViewContent').textContent = msg.content;
  
  document.querySelector('#panelMessages .admin-table').style.display = 'none';
  document.getElementById('messageDetailView').style.display = 'block';
}

function deleteMessage(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  const messages = load(KEYS.messages) || [];
  const filtered = messages.filter(m => m.id !== id);
  save(KEYS.messages, filtered);
  renderMessagesTable();
  
  document.getElementById('messageDetailView').style.display = 'none';
  document.querySelector('#panelMessages .admin-table').style.display = 'table';
  showBanner();
}

/* ============================================================
   EXPORT & RESET (SRS §2.6)
   ============================================================ */
function initTools() {
  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('resetDataBtn').addEventListener('click', resetData);
}

function exportJson() {
  const profile = load(KEYS.profile) || {};
  const posts = load(KEYS.posts) || [];
  const research = load(KEYS.research) || [];
  const cv = {
    experience: load(KEYS.cv_experience) || [],
    education: load(KEYS.cv_education) || [],
    skills: load(KEYS.cv_skills) || [],
    projects: load(KEYS.cv_projects) || [],
    achievements: load(KEYS.cv_achievements) || []
  };
  const messages = load(KEYS.messages) || [];

  // Download as individual files
  downloadJson('profile.json', profile);
  downloadJson('posts.json', posts);
  downloadJson('research.json', research);
  downloadJson('cv.json', cv);
  
  if (messages.length > 0) {
    downloadJson('messages.json', messages);
    alert('✅ JSON files downloaded (including messages)! Replace files in /content/ folder and commit to GitHub.');
  } else {
    alert('✅ 4 JSON files downloaded! Replace files in /content/ folder and commit to GitHub.');
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function resetData() {
  if (!confirm('⚠ This will reset ALL data from localStorage and reload from the original JSON files. Any unsaved changes will be lost!\n\nAre you sure?')) {
    return;
  }

  // Clear all portfolio keys
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));

  // Re-fetch from source
  try {
    const [profileRes, postsRes, researchRes, cvRes] = await Promise.all([
      fetch('../content/profile.json'),
      fetch('../content/posts.json'),
      fetch('../content/research.json'),
      fetch('../content/cv.json')
    ]);

    if (profileRes.ok) save(KEYS.profile, await profileRes.json());
    if (postsRes.ok) save(KEYS.posts, await postsRes.json());
    if (researchRes.ok) save(KEYS.research, await researchRes.json());
    if (cvRes.ok) {
      const cv = await cvRes.json();
      save(KEYS.cv_experience, cv.experience || []);
      save(KEYS.cv_education, cv.education || []);
      save(KEYS.cv_skills, cv.skills || []);
      save(KEYS.cv_projects, cv.projects || []);
      save(KEYS.cv_achievements, cv.achievements || []);
    }

    alert('✅ Data has been reset from source files. The page will reload.');
    location.reload();
  } catch (err) {
    alert('Error resetting data: ' + err.message);
  }
}

/* ============================================================
   INIT
   ============================================================ */
/* ============================================================
   EXPOSE FUNCTIONS TO WINDOW (for onclick in dynamic HTML)
   ============================================================ */
window.editPost = editPost;
window.deletePost = deletePost;
window.editResearch = editResearch;
window.deleteResearch = deleteResearch;
window.addCvExperience = addCvExperience;
window.editCvExperience = editCvExperience;
window.addCvEducation = addCvEducation;
window.editCvEducation = editCvEducation;
window.addCvSkillCategory = addCvSkillCategory;
window.editCvSkillCategory = editCvSkillCategory;
window.addCvProject = addCvProject;
window.editCvProject = editCvProject;
window.deleteCvItem = deleteCvItem;
window.addCvAchievement = addCvAchievement;
window.editCvAchievement = editCvAchievement;
window.viewMessage = viewMessage;
window.deleteMessage = deleteMessage;

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await seedDataIfNeeded();
  checkAuth();

  // Login button
  document.getElementById('loginBtn').addEventListener('click', handleLogin);

  // Enter key on password
  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});
