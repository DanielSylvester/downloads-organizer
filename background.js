const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Default rules — edit via the Options page to add custom ones
const DEFAULT_EXTENSION_RULES = {
  Scripts:     ['.py', '.gs', '.js', '.ts', '.sh', '.bat', '.ps1', '.rb', '.php', '.lua', '.r', '.m'],
  Automations: ['.zip', '.rar', '.tar', '.gz', '.7z', '.bz2', '.xz', '.tgz'],
  Creatives:   ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff', '.tif',
                '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v',
                '.psd', '.ai', '.eps', '.sketch', '.fig', '.xd'],
  Docs:        ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                '.txt', '.csv', '.odt', '.ods', '.odp', '.rtf', '.pages', '.numbers', '.key', '.md'],
};

const DEFAULT_KEYWORD_RULES = [
  { keyword: 'report',    category: 'Reports' },
  { keyword: 'invoice',   category: 'Reports' },
  { keyword: 'statement', category: 'Reports' },
  { keyword: 'receipt',   category: 'Reports' },
  { keyword: 'summary',   category: 'Reports' },
  { keyword: 'analytics', category: 'Reports' },
  { keyword: 'export',    category: 'Reports' },
];

const DEFAULT_DOMAIN_RULES = [
  { domain: 'ads.google.com',       category: 'Reports' },
  { domain: 'analytics.google.com', category: 'Reports' },
  { domain: 'business.facebook.com', category: 'Reports' },
  { domain: 'ads.facebook.com',     category: 'Reports' },
  { domain: 'adsmanager.facebook.com', category: 'Reports' },
  { domain: 'meta.com',             category: 'Reports' },
];

function getMonthYear(date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getExtension(filename) {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return '.' + parts[parts.length - 1].toLowerCase();
}

function getBasename(filepath) {
  return (filepath || '').split(/[\\/]/).pop();
}

function categorize(downloadItem, customRules) {
  const filename = getBasename(downloadItem.filename).toLowerCase();
  const url = (downloadItem.url || '').toLowerCase();
  const referrer = (downloadItem.referrer || '').toLowerCase();

  const domainRules  = [...DEFAULT_DOMAIN_RULES,  ...(customRules.domainRules  || [])];
  const keywordRules = [...DEFAULT_KEYWORD_RULES, ...(customRules.keywordRules || [])];

  // Priority 1: domain rules (check download URL and referrer)
  for (const rule of domainRules) {
    if (url.includes(rule.domain.toLowerCase()) || referrer.includes(rule.domain.toLowerCase())) {
      return rule.category;
    }
  }

  // Priority 2: keyword rules (check filename)
  for (const rule of keywordRules) {
    if (filename.includes(rule.keyword.toLowerCase())) {
      return rule.category;
    }
  }

  // Priority 3: file extension rules
  const ext = getExtension(filename);
  for (const [category, extensions] of Object.entries(DEFAULT_EXTENSION_RULES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'Others';
}

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  chrome.storage.sync.get({ domainRules: [], keywordRules: [], enabled: true }, (customRules) => {
    if (!customRules.enabled) {
      suggest(); // pass-through, no rename
      return;
    }

    const category = categorize(downloadItem, customRules);
    const date = new Date(downloadItem.startTime);
    const monthYear = getMonthYear(date);
    const basename = getBasename(downloadItem.filename);

    suggest({ filename: `${monthYear}/${category}/${basename}` });
  });

  return true; // keeps the suggest callback alive for the async storage call
});
