# CLAUDE.md

## Project Mission

Build **ResumePilot**, a local-first Chrome extension and Next.js companion application that reads a job description from the current browser page and creates truthful, one-page, role-specific application materials from a verified candidate profile.

Read `SPEC.md` before planning or implementing any feature.

## Mandatory Product Rules

1. Never fabricate:
   - Employers
   - Titles
   - Dates
   - Projects
   - Skills
   - Metrics
   - Responsibilities
   - Education
   - Production AI experience

2. Allowed without confirmation:
   - Rewrite existing content without changing meaning
   - Reorder bullets and skills
   - Condense content
   - Remove irrelevant content
   - Adjust emphasis based on the JD

3. Require confirmation before:
   - Adding a new factual claim
   - Adding an inferred technology
   - Adding a metric
   - Expanding ownership or scope
   - Using a sensitive personal story

4. Tailored resumes must target one page by default.

5. Job-page extraction must run only after an explicit user action.

6. Do not implement:
   - Automatic job submission
   - LinkedIn automation
   - Bulk scraping
   - Background crawling
   - Auto-sending messages

7. Claude API keys must never be exposed to the extension or browser client.

8. MVP data is local-first.

## Working Style

For every task:

1. Inspect relevant files.
2. State the implementation goal in one sentence.
3. Identify affected packages.
4. Make the smallest coherent change.
5. Add or update tests.
6. Run formatting, type checking, and relevant tests.
7. Report:
   - What changed
   - Files changed
   - Tests run
   - Remaining risks

Do not rewrite unrelated files.

Ask before making architecture changes that conflict with `SPEC.md`.

Do not add a dependency without explaining why existing dependencies are insufficient.

## Expected Monorepo

```text
apps/
  web/
  extension/

packages/
  shared/
  schemas/
  prompts/
  resume-engine/
  document-export/

prisma/
fixtures/
docs/
```

### `apps/web`
Responsibilities:

- Resume upload and parsing
- Candidate profile verification
- Application workspace
- Claude API calls
- PostgreSQL access
- Resume preview
- DOCX/PDF export
- Local extension API

### `apps/extension`
Responsibilities:

- User-triggered JD extraction
- Site-specific adapters
- Editable preview
- Local app pairing
- Sending confirmed JD to local app

The extension must not contain:

- Claude API key
- Database credentials
- Full resume history
- Document generation logic

### `packages/schemas`
Shared Zod schemas.

### `packages/prompts`
Versioned Claude prompts and output schemas.

### `packages/resume-engine`
Pure business logic:

- Claim matching
- Resume planning
- Relevance ranking
- One-page prioritization
- Unsupported-claim detection

Avoid framework-specific code here.

### `packages/document-export`
DOCX and PDF generation.

## Preferred Stack

- TypeScript strict mode
- pnpm workspaces
- Next.js App Router
- React
- PostgreSQL
- Prisma
- Zod
- Tailwind CSS
- Chrome Manifest V3
- Playwright
- Vitest
- Anthropic Claude API

Use server-only modules for:

- Claude API
- Database
- File system
- Document export
- Secrets

## TypeScript Standards

- No `any` unless justified in a comment.
- Validate all external input with Zod.
- Use discriminated unions for workflow states.
- Prefer pure functions in the resume engine.
- Never trust DOM extraction or model output.

Example:

```ts
type ResumeChange =
  | {
      type: "safe_rewrite";
      originalText: string;
      proposedText: string;
      reason: string;
      supportedByClaimIds: string[];
      requiresConfirmation: false;
    }
  | {
      type: "new_claim";
      originalText?: string;
      proposedText: string;
      reason: string;
      supportedByClaimIds: string[];
      requiresConfirmation: true;
    };
```

## Privacy and Data Rules

1. Store user files outside public directories.
2. Store only metadata and structured content in PostgreSQL where practical.
3. Do not log:
   - Full resume text
   - Phone numbers
   - Email addresses
   - API keys
   - Full prompts containing personal data
4. Redact sensitive values from errors.
5. Show the user what content will be sent to Claude.
6. Send only relevant claims and JD text.
7. Never send the original resume file to Claude unless explicitly required and approved.
8. Use environment variables for secrets.
9. Never commit user data or generated resumes.

Required `.gitignore`:

```gitignore
.env
.env.*
!.env.example
data/
uploads/
exports/
*.local
```

## Chrome Extension Rules

### Permissions

- Prefer `activeTab` and `scripting`.
- Avoid broad host permissions unless needed for a documented adapter.
- Do not crawl linked pages.
- Do not automate job forms.

### Extraction

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

Extraction order:

1. Site-specific adapter
2. Generic semantic extractor
3. User-selected text fallback
4. Editable preview

Keep site adapters isolated and test them with saved HTML fixtures.

### Local Communication

- Use `http://127.0.0.1:3210` by default.
- Require a local pairing token.
- Restrict CORS to the extension origin.
- Never put the token in URLs.
- Never expose Claude credentials.

## Resume Parsing Rules

Supported MVP formats:

- PDF
- DOCX

Pipeline:

1. Save the original file locally.
2. Extract raw text.
3. Normalize whitespace and bullet markers.
4. Parse sections deterministically.
5. Use Claude for structured extraction only when needed.
6. Validate output with Zod.
7. Present parsed content for user review.
8. Store verified claims separately from raw text.

Never assume parsed content is correct without user review.

## Verified Claim Model

```ts
type VerifiedClaim = {
  id: string;
  category:
    | "employment"
    | "project"
    | "skill"
    | "metric"
    | "education"
    | "personal_story"
    | "preference";
  text: string;
  sourceResumeId?: string;
  sourceLocation?: string;
  verificationStatus: "verified" | "unverified" | "rejected";
  notes?: string;
};
```

Final resume content must trace to verified or explicitly approved claims.

## Claude API Rules

### General

- All calls are server-side.
- Use focused prompts, not one giant prompt.
- Prefer structured JSON output.
- Validate every response.
- Retry malformed output at most twice.
- Fail visibly instead of inventing defaults.
- Store prompt version and model name with generated artifacts.

### Prompt Pipeline

1. `parse-job-description`
2. `match-candidate-to-job`
3. `plan-tailored-resume`
4. `generate-tailored-resume`
5. `verify-grounding`
6. `generate-cover-letter`
7. `generate-hiring-manager-message`
8. `generate-why-company`

### Prompt Inputs

Include only:

- Normalized JD
- Relevant verified claims
- User preferences
- Approved resume content
- Required output schema

### Grounding Output

Every generated resume bullet must include:

```ts
{
  text: string;
  supportedByClaimIds: string[];
  transformationType:
    | "unchanged"
    | "rewrite"
    | "reorder"
    | "condense"
    | "new_claim";
  requiresConfirmation: boolean;
}
```

### Writing Style

- Direct and natural
- Concrete details
- No generic corporate praise
- Avoid repeated use of:
  - scalable
  - robust
  - passionate
  - leverage
  - cutting-edge
  - exciting opportunity
- “Why this company?” should use a verified narrative when available.
- Never claim perfect alignment.

## One-Page Resume Engine

The one-page requirement is a content-selection problem first and a formatting problem second.

### Ranking Inputs

- Required skills
- Responsibilities
- Recency
- Professional experience over personal projects
- Domain match
- Differentiation value
- Keyword coverage
- User preferences

### Content Priority

1. Contact header
2. Summary
3. Relevant skills
4. Current role
5. Previous role
6. Most relevant project
7. Education

### Compression Order

1. Remove irrelevant project bullets
2. Condense older experience
3. Shorten summary
4. Remove repeated skills from prose
5. Reduce bullet count
6. Tighten spacing
7. Never reduce font below the safe minimum

### Validation

- Render PDF.
- Count pages.
- If over one page:
  1. Apply deterministic compression.
  2. Regenerate only overflowing sections.
  3. Show what was removed or condensed.
- Never silently delete approved content.

## Document Export Rules

### DOCX

- ATS-friendly
- Avoid complex tables
- Consistent typography
- Selectable contact text
- Bold keywords sparingly

### PDF

- Render controlled HTML with Playwright
- US Letter by default
- Verify one page
- Verify PDF text extraction

### File Naming

```text
First_Last_Company_Role_Resume.docx
First_Last_Company_Role_Resume.pdf
```

Sanitize file names.

## UI Rules

1. Show captured JD before analysis.
2. Show side-by-side resume diffs.
3. Mark changes as:
   - Safe
   - Removed
   - Requires confirmation
4. Let users edit generated text.
5. Autosave application state.
6. Bulk approval is allowed only for safe rewrites.
7. Unsupported claims require explicit confirmation.
8. Errors must be actionable.

Application tabs:

- Job
- Match
- Resume Changes
- Resume
- Cover Letter
- Hiring Manager Message
- Why Company
- Export

## Database Rules

- Use Prisma migrations.
- Use UUIDs.
- Add created/updated timestamps.
- Preserve historical generated artifacts.
- JSON columns are acceptable for versioned model output, not as a substitute for all domain modeling.

## Testing Requirements

### Unit

- Zod schemas
- Extractors
- Claim matching
- Relevance scoring
- One-page prioritization
- File-name sanitization
- Unsupported-claim detection

### Integration

- Resume upload and parse
- Extension capture endpoint
- Claude structured-output parsing
- Resume generation
- DOCX/PDF export

### E2E

Use Playwright for:

1. Onboarding
2. Resume verification
3. Job capture
4. Resume approval
5. DOCX/PDF export
6. One-page PDF assertion

### AI Evaluation Fixtures

Maintain fixtures for:

- FinTech backend JD
- General backend JD
- AI application JD
- Missing required skill
- Unsupported metric temptation
- Personal project vs professional experience
- Sensitive personal story requiring opt-in

Do not use live Claude calls in normal unit tests.

## Suggested Commands

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter ./apps/* dev",
    "dev:web": "pnpm --filter web dev",
    "dev:extension": "pnpm --filter extension dev",
    "db:up": "docker compose up -d postgres",
    "db:migrate": "prisma migrate dev",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "test:e2e": "playwright test",
    "format": "prettier --write ."
  }
}
```

Adjust only when the repository structure requires it.

## Implementation Order

1. Monorepo and local environment
2. Web app shell and database
3. Extension shell and local pairing
4. Resume upload and parsing
5. Candidate verification
6. JD extraction and preview
7. JD analysis
8. Candidate/JD matching
9. Tailored resume planning
10. Change approval
11. One-page preview
12. DOCX/PDF export
13. Cover letter
14. Hiring-manager message
15. Why-company response
16. Security hardening and packaging

Do not begin with polished AI generation before verified claims and grounding exist.

## Definition of Done

A task is done only when:

- Functionality works
- Types pass
- Relevant tests pass
- Error states are handled
- No secrets or user files are committed
- Behavior matches `SPEC.md`
- Documentation is updated

For AI features:

- Output is schema-validated
- Claims are traceable
- Unsupported additions are blocked or marked for confirmation
- Prompt version is recorded

## First Task for Claude Code

When starting from an empty repository:

1. Read `SPEC.md` and `CLAUDE.md`.
2. Propose a concise Phase 0 plan.
3. Create the pnpm monorepo.
4. Scaffold:
   - `apps/web`
   - `apps/extension`
   - shared packages
5. Add Docker Compose PostgreSQL.
6. Add Prisma.
7. Add shared Zod schemas.
8. Add `.env.example` and `.gitignore`.
9. Add lint, formatting, typecheck, and test configuration.
10. Stop and report before implementing resume parsing or Claude calls.

Do not generate the entire product in one pass.
