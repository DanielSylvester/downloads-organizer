const toggle = document.getElementById('enabledToggle');
const statusText = document.getElementById('statusText');
const openOptions = document.getElementById('openOptions');

chrome.storage.sync.get({ enabled: true, domainRules: [], keywordRules: [] }, (data) => {
  toggle.checked = data.enabled;
  updateStatus(data.enabled, data.domainRules.length + data.keywordRules.length);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  chrome.storage.sync.get({ domainRules: [], keywordRules: [] }, (data) => {
    updateStatus(enabled, data.domainRules.length + data.keywordRules.length);
  });
});

openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function updateStatus(enabled, customRuleCount) {
  if (!enabled) {
    statusText.innerHTML = 'Organizer is <span style="color:#e53e3e">paused</span>. Downloads save normally.';
  } else {
    const extra = customRuleCount > 0
      ? ` + <span>${customRuleCount} custom rule${customRuleCount > 1 ? 's' : ''}</span>`
      : '';
    statusText.innerHTML = `Sorting into <span>Month Year / Category</span>${extra}.`;
  }
}
