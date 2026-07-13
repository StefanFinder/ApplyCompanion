// Extracts job description and metadata from common job posting sites.

function extractJobData() {
  const hostname = window.location.hostname;

  // --- Title ---
  const titleSelectors = [
    // LinkedIn
    '.job-details-jobs-unified-top-card__job-title h1',
    '.t-24.job-details-jobs-unified-top-card__job-title',
    // Indeed
    '.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title',
    // Greenhouse
    'h1.app-title',
    // Lever
    '.posting-headline h2',
    // Workday
    '[data-automation-id="jobPostingHeader"] h2',
    // Ashby
    'h1.ashby-job-posting-heading',
    // Generic
    'h1',
  ];

  // --- Company ---
  const companySelectors = [
    // LinkedIn
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name a',
    // Indeed
    '[data-company-name]',
    '.jobsearch-InlineCompanyRating-companyHeader',
    // Greenhouse
    '.company-name',
    // Lever
    '.posting-headline .sort-by-time',
    // Workday
    '[data-automation-id="jobPostingHeader"] p',
    // Generic
    '[class*="company"]',
    '[class*="employer"]',
  ];

  // --- Description ---
  const descriptionSelectors = [
    // LinkedIn
    '.jobs-description-content__text',
    '.job-view-layout .description__text',
    '#job-details',
    // Indeed
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    // Greenhouse
    '#content .job-post',
    '.job-post-description',
    // Lever
    '.posting-description',
    '.section-wrapper',
    // Workday
    '[data-automation-id="jobPostingDescription"]',
    // Ashby
    '.ashby-job-posting-description',
    // Generic
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    'article',
    'main',
  ];

  function queryFirst(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim().length > 20) return el;
      } catch {}
    }
    return null;
  }

  function cleanText(text) {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  const titleEl = queryFirst(titleSelectors);
  const companyEl = queryFirst(companySelectors);
  const descEl = queryFirst(descriptionSelectors);

  // Fallback: look for the largest text block on the page
  let description = '';
  if (descEl) {
    description = cleanText(descEl.innerText);
  } else {
    // Grab all text blocks and find the biggest one
    const candidates = Array.from(document.querySelectorAll('div, section, article'))
      .filter(el => el.children.length < 30)
      .map(el => ({ el, len: el.innerText.trim().length }))
      .sort((a, b) => b.len - a.len);
    if (candidates.length > 0) {
      description = cleanText(candidates[0].el.innerText);
    }
  }

  return {
    title: titleEl ? titleEl.innerText.trim() : document.title,
    company: companyEl ? companyEl.innerText.trim() : '',
    description,
    url: window.location.href,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_JD') {
    try {
      const data = extractJobData();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
