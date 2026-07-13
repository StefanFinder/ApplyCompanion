# ApplyCompanion

A Chrome extension + local companion app that reads job descriptions and generates tailored application documents.

## What it does

1. Browse a job posting — click the extension button to capture the job description
2. Review the JD in the extension popup, then send it to the companion app
3. In the companion app, click **Generate** to produce:
   - Tailored one-page resume
   - Cover letter
   - Hiring-manager message
   - "Why this company?" response
4. Edit any document inline, then export to **DOCX** or **PDF**

---

## Setup

### 1. Companion App

```bash
cd app
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

**First run:** Go to `http://localhost:3000/resume` and enter your master resume. This is the source of truth for all generation.

### 2. Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo

The extension icon will appear in your toolbar.

---

## Usage

1. Navigate to any job posting (LinkedIn, Indeed, Greenhouse, Lever, Workday, etc.)
2. Click the **ApplyCompanion** extension icon
3. Click **Scan Job Description** — the extension reads the visible page content
4. Review the detected company, title, and description
5. Click **Send to App** — the companion app opens with a new job entry
6. Click **Generate All Documents** in the app
7. Edit, then export

---

## Requirements

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- Google Chrome (or any Chromium browser)
