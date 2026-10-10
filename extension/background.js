chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_APP') {
    const targetUrl = `http://localhost:3000/jobs/${message.jobId}`;
    chrome.tabs.query({}, (tabs) => {
      const appTab = tabs.find(t => t.url && t.url.startsWith('http://localhost:3000'));
      if (appTab && appTab.id != null) {
        chrome.tabs.update(appTab.id, { url: targetUrl, active: true });
        chrome.windows.update(appTab.windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: targetUrl });
      }
    });
  }
  return true;
});
