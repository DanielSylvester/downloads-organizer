let customKeywordRules = [];
let customDomainRules  = [];

const BADGE_CLASS = {
  Scripts:     'badge-scripts',
  Automations: 'badge-automations',
  Creatives:   'badge-creatives',
  Docs:        'badge-docs',
  Reports:     'badge-reports',
  Others:      'badge-others',
};

chrome.storage.sync.get({ keywordRules: [], domainRules: [] }, (data) => {
  customKeywordRules = data.keywordRules;
  customDomainRules  = data.domainRules;
  renderKeywords();
  renderDomains();
});

document.getElementById('addKeyword').addEventListener('click', () => {
  const kw  = document.getElementById('keywordInput').value.trim().toLowerCase();
  const cat = document.getElementById('keywordCategory').value;
  if (!kw) return;
  if (customKeywordRules.some(r => r.keyword === kw)) return alert(`Keyword "${kw}" already exists.`);
  customKeywordRules.push({ keyword: kw, category: cat });
  document.getElementById('keywordInput').value = '';
  save();
  renderKeywords();
});

function renderKeywords() {
  const list = document.getElementById('keywordList');
  if (customKeywordRules.length === 0) {
    list.innerHTML = '<p class="empty">No custom keyword rules yet.</p>';
    return;
  }
  list.innerHTML = customKeywordRules.map((r, i) => `
    <div class="custom-item">
      <span class="item-label">Filename contains <strong>"${r.keyword}"</strong> → <span class="badge ${BADGE_CLASS[r.category] || 'badge-others'}">${r.category}</span></span>
      <button class="btn-delete" data-type="keyword" data-index="${i}" title="Remove">×</button>
    </div>
  `).join('');
}

document.getElementById('addDomain').addEventListener('click', () => {
  const domain = document.getElementById('domainInput').value.trim().toLowerCase().replace(/^https?:\/\//, '');
  const cat    = document.getElementById('domainCategory').value;
  if (!domain) return;
  if (customDomainRules.some(r => r.domain === domain)) return alert(`Domain "${domain}" already exists.`);
  customDomainRules.push({ domain, category: cat });
  document.getElementById('domainInput').value = '';
  save();
  renderDomains();
});

function renderDomains() {
  const list = document.getElementById('domainList');
  if (customDomainRules.length === 0) {
    list.innerHTML = '<p class="empty">No custom domain rules yet.</p>';
    return;
  }
  list.innerHTML = customDomainRules.map((r, i) => `
    <div class="custom-item">
      <span class="item-label">Downloads from <strong>${r.domain}</strong> → <span class="badge ${BADGE_CLASS[r.category] || 'badge-others'}">${r.category}</span></span>
      <button class="btn-delete" data-type="domain" data-index="${i}" title="Remove">×</button>
    </div>
  `).join('');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;
  const type  = btn.dataset.type;
  const index = parseInt(btn.dataset.index, 10);
  if (type === 'keyword') { customKeywordRules.splice(index, 1); renderKeywords(); }
  else if (type === 'domain') { customDomainRules.splice(index, 1); renderDomains(); }
  save();
});

function save() {
  chrome.storage.sync.set({ keywordRules: customKeywordRules, domainRules: customDomainRules }, showBanner);
}

function showBanner() {
  const banner = document.getElementById('saveBanner');
  banner.style.display = 'block';
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { banner.style.display = 'none'; }, 1800);
}

document.getElementById('keywordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addKeyword').click();
});
document.getElementById('domainInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addDomain').click();
});
