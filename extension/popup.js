const APP_URL = 'http://localhost:3000';

let currentJobId = null;

// --- View management ---
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  showView('view-error');
}

// --- Scan ---
async function scan() {
  showView('view-loading');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JD' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script might not be injected yet; try scripting.executeScript
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ['content.js'] },
        () => {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JD' }, (res) => {
            if (chrome.runtime.lastError || !res) {
              showError('Could not read this page. Try refreshing and scanning again.');
              return;
            }
            populateReview(res.data, tab.url);
          });
        }
      );
      return;
    }

    if (!response || !response.success) {
      showError(response?.error || 'Failed to extract job description.');
      return;
    }

    populateReview(response.data, tab.url);
  });
}

function populateReview(data, tabUrl) {
  document.getElementById('field-company').value = data.company || '';
  document.getElementById('field-title').value = data.title || '';
  document.getElementById('field-desc').value = data.description || '';
  document.getElementById('field-url').value = data.url || tabUrl || '';
  showView('view-review');
}

// --- Send to app ---
async function sendToApp() {
  const company = document.getElementById('field-company').value.trim();
  const title = document.getElementById('field-title').value.trim();
  const description = document.getElementById('field-desc').value.trim();
  const url = document.getElementById('field-url').value.trim();

  if (!description) {
    showError('Job description is empty. Try scanning again.');
    return;
  }

  showView('view-sending');

  try {
    const res = await fetch(`${APP_URL}/api/job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, title, description, url }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`App returned ${res.status}: ${text}`);
    }

    const json = await res.json();
    currentJobId = json.id;

    document.getElementById('success-company').textContent =
      `${title || 'Role'}${company ? ' at ' + company : ''}`;
    showView('view-success');
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showError('Cannot reach the companion app. Make sure it\'s running at localhost:3000.');
    } else {
      showError(err.message);
    }
  }
}

// --- Event listeners ---
document.getElementById('btn-scan').addEventListener('click', scan);
document.getElementById('btn-rescan').addEventListener('click', scan);
document.getElementById('btn-send').addEventListener('click', sendToApp);

document.getElementById('btn-open-app').addEventListener('click', () => {
  if (currentJobId) {
    chrome.runtime.sendMessage({ type: 'OPEN_APP', jobId: currentJobId });
  } else {
    chrome.tabs.create({ url: APP_URL });
  }
});

document.getElementById('btn-new').addEventListener('click', () => {
  currentJobId = null;
  showView('view-idle');
});

document.getElementById('btn-retry').addEventListener('click', () => {
  showView('view-idle');
});
