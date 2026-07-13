chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_APP') {
    chrome.tabs.create({ url: `http://localhost:3000/jobs/${message.jobId}` });
  }
  return true;
});
