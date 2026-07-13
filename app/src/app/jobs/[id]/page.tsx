'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Job, JobDocuments } from '@/lib/types';

type DocKey = keyof JobDocuments;
type TabKey = DocKey | 'notes';

const DOCS: { key: DocKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'resume',
    label: 'Tailored Resume',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    key: 'coverLetter',
    label: 'Cover Letter',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    key: 'hiringManagerMessage',
    label: 'HM Message',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'whyCompany',
    label: 'Why Company',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

const NOTES_TAB = {
  key: 'notes' as TabKey,
  label: 'Notes',
  icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

const STATUS_OPTIONS: Job['status'][] = ['pending', 'generated', 'applied', 'interviewing', 'rejected'];

const STATUS_STYLES: Record<Job['status'], string> = {
  pending: 'bg-slate-100 text-slate-600',
  generated: 'bg-blue-50 text-blue-700',
  applied: 'bg-green-50 text-green-700',
  interviewing: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-600',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function ExportMenu({ jobId, docKey, disabled }: { jobId: string; docKey: DocKey; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-32">
            {[
              { fmt: 'docx', label: 'Download DOCX' },
              { fmt: 'pdf', label: 'Download PDF' },
            ].map(({ fmt, label }) => (
              <a
                key={fmt}
                href={`/api/export/${fmt}/${jobId}?doc=${docKey}`}
                download
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('resume');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [editedDocs, setEditedDocs] = useState<JobDocuments>({});
  const [saving, setSaving] = useState(false);
  const [saveTick, setSaveTick] = useState(false);
  const [jdExpanded, setJdExpanded] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/job/${id}`)
      .then(r => r.json())
      .then(data => {
        setJob(data);
        setEditedDocs(data.documents || {});
        setNotes(data.notes || '');
      })
      .catch(() => router.push('/'));
  }, [id, router]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/job/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }, 800);
  };

  const generate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch(`/api/generate/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setJob(prev => prev ? { ...prev, status: 'generated', documents: data.documents } : prev);
      setEditedDocs(data.documents);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [id]);

  const saveEdits = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/job/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: editedDocs }),
      });
      const data = await res.json();
      setJob(data);
      setSaveTick(true);
      setTimeout(() => setSaveTick(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [id, editedDocs]);

  const updateStatus = async (status: Job['status']) => {
    const res = await fetch(`/api/job/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setJob(data);
  };

  const deleteJob = async () => {
    if (!confirm('Delete this application?')) return;
    await fetch(`/api/job/${id}`, { method: 'DELETE' });
    router.push('/');
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Refresh iframe when tab changes while preview is open
  useEffect(() => {
    if (previewOpen && iframeRef.current) {
      iframeRef.current.src = `/api/preview/${id}?doc=${activeTab}&t=${Date.now()}`;
    }
  }, [activeTab, previewOpen, id]);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const hasDocuments = Object.values(job.documents).some(Boolean);
  const activeContent = activeTab !== 'notes' ? (editedDocs[activeTab as DocKey] || '') : '';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Dashboard</a>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs text-slate-500 truncate">{job.company || 'Application'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 truncate">{job.title || 'Untitled Role'}</h1>
            {job.company && <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Status selector + timestamp */}
            <div className="flex flex-col items-end gap-0.5">
              <select
                value={job.status}
                onChange={e => updateStatus(e.target.value as Job['status'])}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 ${STATUS_STYLES[job.status]}`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {job.statusTimestamps?.[job.status] && (
                <span className="text-[10px] text-slate-400">
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)} on{' '}
                  {new Date(job.statusTimestamps[job.status]!).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
            </div>

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View posting
              </a>
            )}

            <button onClick={deleteJob} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Job Description + Notes */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          {/* JD section */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Description</h2>
            <button
              onClick={() => setJdExpanded(e => !e)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {jdExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

        </div>

        {/* Right: Documents */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Generate bar */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating with Claude…
                </>
              ) : hasDocuments ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                  </svg>
                  Regenerate All
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Generate All Documents
                </>
              )}
            </button>

            {genError && (
              <p className="text-xs text-red-500 flex-1 truncate">{genError}</p>
            )}

            {hasDocuments && !generating && (
              <button
                onClick={saveEdits}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-60 ml-auto"
              >
                {saveTick ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : saving ? 'Saving…' : 'Save Edits'}
              </button>
            )}
          </div>

          {!hasDocuments && !generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">Ready to generate</p>
                <p className="text-xs text-slate-400 mt-1">Click "Generate All Documents" to create your tailored application materials.</p>
              </div>
            </div>
          ) : generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin w-7 h-7 text-indigo-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">Generating with Claude…</p>
                <p className="text-xs text-slate-400 mt-1">Tailoring all 4 documents in parallel. This takes ~15–30 seconds.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-white px-6">
                {DOCS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {icon}
                    {label}
                    {editedDocs[key] && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-0.5" />
                    )}
                  </button>
                ))}
                {/* Notes tab */}
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'notes'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {NOTES_TAB.icon}
                  Notes
                  {notes.trim() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                  )}
                </button>
              </div>

              {activeTab === 'notes' ? (
                /* Notes panel */
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">Personal notes — never exported</p>
                    {notesSaved && (
                      <span className="text-[10px] text-green-500 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Saved
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder="Add notes about this role — interview prep, contacts, follow-up dates, compensation details, questions to ask…"
                    className="flex-1 w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors"
                    spellCheck
                  />
                </div>
              ) : (
                /* Document editor */
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">
                      {activeContent ? `${activeContent.split(/\s+/).filter(Boolean).length} words` : 'No content'}
                    </p>
                    <div className="flex items-center gap-2">
                      {activeContent && <CopyButton text={activeContent} />}
                      {activeContent && (
                        <button
                          onClick={() => setPreviewOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Preview
                        </button>
                      )}
                      <ExportMenu jobId={id} docKey={activeTab as DocKey} disabled={!activeContent} />
                    </div>
                  </div>

                  <textarea
                    className="flex-1 w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors font-mono"
                    value={activeContent}
                    onChange={e => setEditedDocs(prev => ({ ...prev, [activeTab]: e.target.value }))}
                    placeholder="Document will appear here after generation…"
                    spellCheck
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Preview modal ─────────────────────────────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreviewOpen(false)}
          />

          {/* Panel — slides in from right */}
          <div className="relative ml-auto w-[780px] max-w-full h-full bg-white shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-800">
                  {DOCS.find(d => d.key === activeTab)?.label ?? 'Preview'}
                </span>
                {/* Tab switcher inside preview */}
                <div className="flex gap-1">
                  {DOCS.filter(d => editedDocs[d.key]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        activeTab === key
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/export/pdf/${id}?doc=${activeTab}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                </a>
                <a
                  href={`/api/export/docx/${id}?doc=${activeTab}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download DOCX
                </a>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 overflow-hidden bg-slate-100 p-4">
              <div className="h-full bg-white shadow-md rounded overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={`/api/preview/${id}?doc=${activeTab}`}
                  className="w-full h-full border-0"
                  title="Document preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
