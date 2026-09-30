# SPEC.md

## 1. Product Overview

### Working Name
**ResumePilot**

### Product Goal
Build a Chrome extension plus a local-first companion application that reads a job description from the current job-posting page, compares it with a verified master resume, and generates:

- A one-page tailored resume
- A cover letter
- A hiring-manager message
- A “Why this company?” response
- DOCX and PDF exports

The user should not need to copy and paste the JD manually. The Chrome extension will expose a user-triggered button that reads the visible job description, lets the user review it, and sends it to the local application.

## 2. Product Principles

1. **Truth first**
   - Never invent employers, titles, dates, projects, technologies, responsibilities, or metrics.
   - Every generated resume claim must be supported by the uploaded resume or explicitly confirmed by the user.

2. **User confirmation for new content**
   - The system may rewrite, reorder, condense, and emphasize existing experience.
   - Any new factual claim, inferred responsibility, metric, or technology must be shown to the user for confirmation.

3. **One-page resume by default**
   - Preserve readability.
   - Remove or condense low-value content before shrinking fonts.

4. **JD-driven positioning**
   - Do not force a permanent FinTech, Tech, or AI resume.
   - Infer the best positioning from the JD.

5. **Human-sounding writing**
   - Avoid generic AI-style phrases.
   - “Why this company?” should use a real story when relevant.

6. **Local-first privacy**
   - MVP stores resumes, JDs, and generated content locally.
   - Cloud accounts and sync are deferred.

7. **User-triggered extraction only**
   - No bulk scraping, background crawling, automatic applications, or auto-sending messages.

## 3. MVP Scope

### Included

#### Chrome Extension
- Button: **Read Job Description**
- Extract title, company, location, URL, and description
- Editable preview before submission
- Send confirmed JD to local app
- Open the local application workspace

#### Local Companion Application
- Upload PDF and DOCX resumes
- Parse resume into structured data
- Let user review and verify claims
- Analyze JD with Claude API
- Generate the four requested artifacts
- Show resume changes with reasons and supporting facts
- Require confirmation for unsupported additions
- Export DOCX and one-page PDF
- Save application history locally

### Excluded from MVP
- Automatic application submission
- LinkedIn account automation
- Bulk scraping
- Cloud sync
- Team features
- Email sending
- Job recommendations
- Full interview-prep generation

## 4. Primary User Flow

### 4.1 Initial Setup

1. Install Chrome extension.
2. Start local Next.js app.
3. Upload master resume as PDF or DOCX.
4. Parse resume into:
   - Contact information
   - Summary
   - Skills
   - Employment
   - Projects
   - Education
5. Review and verify parsed claims.
6. Pair the extension with the local app using a local token.

### 4.2 Capture a Job Description

1. Open a job posting in Chrome.
2. Click the extension.
3. Click **Read Job Description**.
4. Extension extracts job information.
5. User reviews and edits the extracted text.
6. User clicks **Analyze with ResumePilot**.
7. The extension sends the JD to the local application.

### 4.3 Analyze and Tailor

The system extracts:

- Role title and seniority
- Company and location
- Required and preferred skills
- Core responsibilities
- Domain
- Onsite/remote expectations
- Sponsorship language
- Behavioral traits
- Important keywords
- Suggested resume positioning

The system then:

1. Matches JD requirements to verified claims.
2. Plans which summary, skills, bullets, and projects to keep.
3. Produces proposed changes.
4. Shows a side-by-side diff.
5. Requests confirmation for any new or inferred claim.
6. Generates a one-page resume.
7. Generates supporting application content.

## 5. Job Description Extraction

Use this fallback order:

1. Site-specific adapters:
   - LinkedIn
   - Greenhouse
   - Lever
   - Workday
   - Ashby
2. Generic semantic DOM extraction
3. User-selected text fallback
4. Manual edit fallback

Each extractor returns:

```ts
type ExtractedJob = {
  title?: string;
  company?: string;
  location?: string;
  url: string;
  description: string;
  source: "linkedin" | "greenhouse" | "lever" | "workday" | "ashby" | "generic";
  confidence: number;
};
```

Constraints:

- Extraction runs only after a user click.
- Do not bypass access controls.
- Do not crawl other pages.
- Do not submit forms.
- DOM selectors must be isolated by site adapter because job sites may change.

## 6. Resume Tailoring Rules

### Safe Automatic Changes

- Reorder bullets
- Reorder skills
- Rewrite wording without changing meaning
- Condense low-value bullets
- Remove irrelevant content
- Adjust summary emphasis
- Select the most relevant project

### Changes Requiring Confirmation

- Adding an unverified technology
- Adding a new responsibility
- Adding or changing a metric
- Claiming architecture ownership not supported by evidence
- Claiming production AI experience based only on a personal project
- Changing dates, employers, titles, or education
- Using sensitive personal stories

### Change Review

For every proposed change, show:

- Original text
- Proposed text
- Reason
- Supporting claim IDs
- Change type
- Whether confirmation is required

Example:

```json
{
  "text": "Built an event-driven trade reconciliation workflow...",
  "supportedByClaimIds": ["claim-123"],
  "transformationType": "rewrite",
  "requiresConfirmation": false
}
```

## 7. One-Page Resume Strategy

Priority order:

1. Header/contact
2. Concise summary
3. Relevant skills
4. Current role
5. Previous role
6. Most relevant project
7. Education

Compression order:

1. Remove irrelevant project bullets
2. Condense older experience
3. Shorten summary
4. Remove repeated keywords
5. Reduce bullet count
6. Tighten spacing within readable limits
7. Never reduce body font below the configured minimum

Default format:

- US Letter
- Body font: 10–11 pt
- Margins: 0.45–0.65 in
- Summary: maximum 3 lines
- Current role: 3–5 bullets
- Previous role: 1–3 bullets
- Projects: 1–2 projects
- ATS-friendly layout

## 8. Generated Artifacts

### Tailored Resume
- One page by default
- Based only on verified/approved claims
- JD-specific ordering and emphasis
- DOCX and PDF export

### Cover Letter
- 250–400 words by default
- Specific to the role
- Connects verified experience to responsibilities
- Does not repeat the resume line by line

### Hiring-Manager Message
- Concise and direct
- Mentions the specific role
- Highlights the strongest 1–2 matches
- Ends with a polite call to action

### Why This Company?
Use this hierarchy:

1. Personal connection or real story, if available
2. Professional experience connected to the company’s problem
3. Mission/product connection
4. Technical reasons

The user may maintain an optional story bank. Sensitive personal details must be opt-in.

## 9. Technical Architecture

```text
Chrome Extension
  ├── Popup UI
  ├── Content scripts
  ├── Site-specific extractors
  └── Generic extractor
          │
          │ Local authenticated HTTP request
          ▼
Local Next.js Application
  ├── UI
  ├── API routes / server actions
  ├── Resume parser
  ├── JD analysis service
  ├── Claude API service
  ├── Resume engine
  └── Export service
          │
          ▼
Local PostgreSQL
```

### Why a Companion App Is Needed
The extension should not store:

- Claude API secrets
- Database credentials
- Resume parsing logic
- Full application history
- DOCX/PDF generation logic

The extension is the capture layer. The local app is the secure processing layer.

## 10. Suggested Stack

### Extension
- Chrome Manifest V3
- TypeScript
- React
- Vite or Plasmo
- `chrome.scripting`
- `chrome.storage.local`

### Local App
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod
- Prisma
- PostgreSQL in Docker Compose

### AI
- Anthropic Claude API
- Server-side calls only
- Structured outputs validated with Zod
- Prompt versioning

### Parsing
- DOCX: `mammoth`
- PDF: `pdf-parse`

### Export
- DOCX: `docx` npm package
- PDF: controlled HTML rendered with Playwright
- Automated PDF page-count validation

## 11. Local Extension-to-App Communication

Default endpoint:

```text
http://127.0.0.1:3210
```

Security:

- Generate a local pairing token
- Store token in extension local storage
- Send token in authorization header
- Restrict requests to localhost
- Restrict CORS to extension origin
- Never expose the Claude key to the extension

Primary endpoint:

```http
POST /api/capture-job
```

Request:

```json
{
  "title": "Software Engineer II",
  "company": "Example Company",
  "location": "Boston, MA",
  "url": "https://example.com/job",
  "description": "...",
  "capturedAt": "2026-07-11T18:00:00Z"
}
```

Response:

```json
{
  "applicationId": "uuid",
  "reviewUrl": "http://127.0.0.1:3210/applications/uuid"
}
```

## 12. Data Model

### CandidateProfile
- id
- fullName
- preferredName
- phone
- email
- location
- linkedIn
- portfolio
- createdAt
- updatedAt

### ResumeSource
- id
- candidateProfileId
- fileName
- fileType
- localPath
- rawText
- parsedJson
- isMaster
- createdAt

### VerifiedClaim
- id
- candidateProfileId
- category
- claimText
- sourceResumeId
- sourceLocation
- verificationStatus
- userNotes
- createdAt
- updatedAt

Categories:

- employment
- project
- skill
- metric
- education
- personal_story
- preference

### JobApplication
- id
- company
- roleTitle
- location
- url
- rawDescription
- normalizedDescription
- analysisJson
- status
- createdAt
- updatedAt

### GeneratedArtifact
- id
- applicationId
- artifactType
- content
- structuredContentJson
- promptVersion
- model
- approvalStatus
- createdAt
- updatedAt

### ResumeChange
- id
- applicationId
- section
- originalText
- proposedText
- reason
- sourceClaimIds
- riskLevel
- approvalStatus
- createdAt

## 13. AI Pipeline

Use focused stages instead of one large prompt:

1. Parse JD
2. Match candidate claims
3. Plan tailored resume
4. Generate draft
5. Verify grounding
6. Enforce one-page constraints
7. Generate cover letter
8. Generate hiring-manager message
9. Generate why-company response

Every Claude response must be schema-validated.

## 14. AI Safety Rules

The model must:

- Use verified claims only for final resume content
- Label inferred content
- Ask for confirmation before unsupported additions
- Never create fake metrics
- Distinguish professional experience from personal projects
- Preserve titles and dates
- Avoid keyword stuffing
- Explain each resume change
- Treat personal stories as opt-in

## 15. UI Screens

### Onboarding
- Start local setup
- Upload resume
- Parse resume
- Verify profile
- Pair extension

### Profile
- Contact information
- Resume sources
- Verified claims
- Skills
- Experience
- Projects
- Story bank
- Formatting preferences

### Extension Popup
- Read JD
- Extraction status
- Preview/edit
- Analyze button

### Application Workspace Tabs

1. Job
2. Match
3. Resume Changes
4. Tailored Resume
5. Cover Letter
6. Hiring Manager Message
7. Why Company
8. Export

## 16. Non-Functional Requirements

### Privacy
- Local storage by default
- No user files in public directories
- Environment variables for secrets
- No full resume text in logs
- Disclose what is sent to Claude

### Reliability
- Autosave user edits
- Preserve generated versions
- AI failures must not lose JD data
- Export failures must be retryable

### Performance Targets
- JD extraction preview: under 2 seconds
- Initial analysis: under 30 seconds
- Export: under 15 seconds

## 17. Testing

### Unit Tests
- Extractors
- Zod schemas
- Resume normalization
- Claim verification
- Relevance scoring
- One-page prioritization
- Unsupported-claim detection

### Integration Tests
- Extension → local app
- Resume upload → parsed profile
- JD analysis → match plan
- Approved claims → resume
- DOCX/PDF export

### E2E Tests

1. Upload resume
2. Verify claims
3. Capture sample JD
4. Generate tailored resume
5. Approve changes
6. Export DOCX/PDF
7. Assert one-page PDF

## 18. Repository Structure

```text
resume-pilot/
├── apps/
│   ├── web/
│   └── extension/
├── packages/
│   ├── shared/
│   ├── schemas/
│   ├── prompts/
│   ├── resume-engine/
│   └── document-export/
├── prisma/
├── fixtures/
├── docs/
├── SPEC.md
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## 19. Development Phases

### Phase 0: Foundation
- Monorepo
- Next.js shell
- Extension shell
- PostgreSQL
- Prisma
- Shared schemas
- Local pairing

### Phase 1: Resume Profile
- PDF/DOCX upload
- Parsing
- Verification UI
- Master profile

### Phase 2: JD Capture
- Generic extractor
- LinkedIn adapter
- Greenhouse/Lever adapters
- Preview/edit
- Send to local app

### Phase 3: JD Analysis
- Claude service
- Structured JD parsing
- Candidate matching

### Phase 4: Tailored Resume
- Resume plan
- Proposed changes
- Evidence mapping
- Approval workflow
- One-page preview

### Phase 5: Export
- DOCX
- PDF
- Page validation
- Version storage

### Phase 6: Additional Artifacts
- Cover letter
- Hiring-manager message
- Why-company response
- Story bank

### Phase 7: Hardening
- E2E tests
- AI evaluation fixtures
- Security review
- Packaging documentation

## 20. MVP Acceptance Criteria

The MVP is complete when the user can:

1. Start the local app.
2. Upload a PDF or DOCX resume.
3. Verify parsed claims.
4. Open a supported job page.
5. Click a button to extract the JD.
6. Review and send it to the local app.
7. View JD analysis and match results.
8. Review proposed resume changes and supporting evidence.
9. Confirm any new or inferred content.
10. Export a one-page DOCX and PDF resume.
11. Generate a cover letter, hiring-manager message, and why-company answer.
12. Reopen the saved application locally.
