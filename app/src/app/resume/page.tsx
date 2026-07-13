'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Resume, ResumeExperience, ResumeEducation, ResumeSkillCategory, ResumeProject } from '@/lib/types';

const EMPTY_RESUME: Resume = {
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-colors';
const TEXTAREA = `${INPUT} resize-none`;

export default function ResumePage() {
  const [resume, setResume] = useState<Resume>(EMPTY_RESUME);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/resume')
      .then(r => r.json())
      .then(data => { if (data) setResume(data); })
      .catch(() => {});
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [resume]);

  const importPdf = useCallback(async (file: File) => {
    setImporting(true);
    setImportError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/resume/import', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResume(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, []);

  // --- Helpers ---
  const setPersonal = (key: keyof Resume['personal'], val: string) =>
    setResume(r => ({ ...r, personal: { ...r.personal, [key]: val } }));

  const addExp = () =>
    setResume(r => ({
      ...r,
      experience: [
        ...r.experience,
        { id: uuidv4(), company: '', title: '', location: '', startDate: '', endDate: '', bullets: [''] },
      ],
    }));

  const updateExp = (id: string, key: keyof ResumeExperience, val: unknown) =>
    setResume(r => ({
      ...r,
      experience: r.experience.map(e => (e.id === id ? { ...e, [key]: val } : e)),
    }));

  const removeExp = (id: string) =>
    setResume(r => ({ ...r, experience: r.experience.filter(e => e.id !== id) }));

  const addExpBullet = (id: string) =>
    setResume(r => ({
      ...r,
      experience: r.experience.map(e => (e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e)),
    }));

  const updateExpBullet = (expId: string, idx: number, val: string) =>
    setResume(r => ({
      ...r,
      experience: r.experience.map(e =>
        e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? val : b)) } : e
      ),
    }));

  const removeExpBullet = (expId: string, idx: number) =>
    setResume(r => ({
      ...r,
      experience: r.experience.map(e =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e
      ),
    }));

  const addEdu = () =>
    setResume(r => ({
      ...r,
      education: [
        ...r.education,
        { id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', notes: '' },
      ],
    }));

  const updateEdu = (id: string, key: keyof ResumeEducation, val: string) =>
    setResume(r => ({
      ...r,
      education: r.education.map(e => (e.id === id ? { ...e, [key]: val } : e)),
    }));

  const removeEdu = (id: string) =>
    setResume(r => ({ ...r, education: r.education.filter(e => e.id !== id) }));

  const addSkillCat = () =>
    setResume(r => ({
      ...r,
      skills: [...r.skills, { id: uuidv4(), name: '', items: [] }],
    }));

  const updateSkillCat = (id: string, key: keyof ResumeSkillCategory, val: unknown) =>
    setResume(r => ({
      ...r,
      skills: r.skills.map(s => (s.id === id ? { ...s, [key]: val } : s)),
    }));

  const removeSkillCat = (id: string) =>
    setResume(r => ({ ...r, skills: r.skills.filter(s => s.id !== id) }));

  const addProject = () =>
    setResume(r => ({
      ...r,
      projects: [...r.projects, { id: uuidv4(), name: '', description: '', technologies: [], url: '' }],
    }));

  const updateProject = (id: string, key: keyof ResumeProject, val: unknown) =>
    setResume(r => ({
      ...r,
      projects: r.projects.map(p => (p.id === id ? { ...p, [key]: val } : p)),
    }));

  const removeProject = (id: string) =>
    setResume(r => ({ ...r, projects: r.projects.filter(p => p.id !== id) }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Resume</h1>
          <p className="text-slate-500 mt-1 text-sm">This is your source of truth. All generated documents are tailored from this.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) importPdf(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-colors"
          >
            {importing ? (
              <>
                <svg className="animate-spin w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Parsing PDF…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import PDF
              </>
            )}
          </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </>
          ) : (
            'Save Resume'
          )}
        </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {importError}
          <button onClick={() => setImportError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="space-y-6">
        {/* Personal Info */}
        <Section title="Personal Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input className={INPUT} value={resume.personal.name} onChange={e => setPersonal('name', e.target.value)} placeholder="Jane Smith" />
            </Field>
            <Field label="Email">
              <input className={INPUT} type="email" value={resume.personal.email} onChange={e => setPersonal('email', e.target.value)} placeholder="jane@example.com" />
            </Field>
            <Field label="Phone">
              <input className={INPUT} value={resume.personal.phone} onChange={e => setPersonal('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </Field>
            <Field label="Location">
              <input className={INPUT} value={resume.personal.location} onChange={e => setPersonal('location', e.target.value)} placeholder="San Francisco, CA" />
            </Field>
            <Field label="LinkedIn URL">
              <input className={INPUT} value={resume.personal.linkedin || ''} onChange={e => setPersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/janesmith" />
            </Field>
            <Field label="GitHub URL">
              <input className={INPUT} value={resume.personal.github || ''} onChange={e => setPersonal('github', e.target.value)} placeholder="github.com/janesmith" />
            </Field>
            <Field label="Personal Website">
              <input className={INPUT} value={resume.personal.website || ''} onChange={e => setPersonal('website', e.target.value)} placeholder="janesmith.dev" />
            </Field>
          </div>
        </Section>

        {/* Summary */}
        <Section title="Professional Summary">
          <textarea
            className={`${TEXTAREA} w-full`}
            rows={4}
            value={resume.summary}
            onChange={e => setResume(r => ({ ...r, summary: e.target.value }))}
            placeholder="Write a 2–3 sentence summary of your background and what you bring to the table. This will be tailored for each application."
          />
        </Section>

        {/* Experience */}
        <Section title="Work Experience">
          <div className="space-y-6">
            {resume.experience.map((exp, idx) => (
              <div key={exp.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Position {idx + 1}</span>
                  <button onClick={() => removeExp(exp.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Job Title">
                    <input className={INPUT} value={exp.title} onChange={e => updateExp(exp.id, 'title', e.target.value)} placeholder="Software Engineer" />
                  </Field>
                  <Field label="Company">
                    <input className={INPUT} value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme Corp" />
                  </Field>
                  <Field label="Location">
                    <input className={INPUT} value={exp.location || ''} onChange={e => updateExp(exp.id, 'location', e.target.value)} placeholder="Remote / New York, NY" />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Start">
                      <input className={INPUT} value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" />
                    </Field>
                    <Field label="End">
                      <input className={INPUT} value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} placeholder="Present" />
                    </Field>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Bullet Points</label>
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bi) => (
                      <div key={bi} className="flex gap-2">
                        <span className="mt-2 text-slate-400 text-xs">•</span>
                        <textarea
                          className={`${TEXTAREA} flex-1`}
                          rows={2}
                          value={bullet}
                          onChange={e => updateExpBullet(exp.id, bi, e.target.value)}
                          placeholder="Describe an achievement with measurable impact..."
                        />
                        {exp.bullets.length > 1 && (
                          <button onClick={() => removeExpBullet(exp.id, bi)} className="mt-1 text-slate-300 hover:text-red-400 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addExpBullet(exp.id)} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                    + Add bullet
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addExp} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              + Add Position
            </button>
          </div>
        </Section>

        {/* Education */}
        <Section title="Education">
          <div className="space-y-4">
            {resume.education.map((edu, idx) => (
              <div key={edu.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Degree {idx + 1}</span>
                  <button onClick={() => removeEdu(edu.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Institution">
                    <input className={INPUT} value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="MIT" />
                  </Field>
                  <Field label="Degree">
                    <input className={INPUT} value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="B.S." />
                  </Field>
                  <Field label="Field of Study">
                    <input className={INPUT} value={edu.field || ''} onChange={e => updateEdu(edu.id, 'field', e.target.value)} placeholder="Computer Science" />
                  </Field>
                  <Field label="GPA (optional)">
                    <input className={INPUT} value={edu.gpa || ''} onChange={e => updateEdu(edu.id, 'gpa', e.target.value)} placeholder="3.9/4.0" />
                  </Field>
                  <Field label="Start Year">
                    <input className={INPUT} value={edu.startDate} onChange={e => updateEdu(edu.id, 'startDate', e.target.value)} placeholder="2018" />
                  </Field>
                  <Field label="End Year">
                    <input className={INPUT} value={edu.endDate} onChange={e => updateEdu(edu.id, 'endDate', e.target.value)} placeholder="2022" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Notes (honors, clubs, etc.)">
                      <input className={INPUT} value={edu.notes || ''} onChange={e => updateEdu(edu.id, 'notes', e.target.value)} placeholder="Magna Cum Laude, Dean's List" />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addEdu} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              + Add Education
            </button>
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div className="space-y-4">
            {resume.skills.map((cat) => (
              <div key={cat.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    className={`${INPUT} flex-1`}
                    value={cat.name}
                    onChange={e => updateSkillCat(cat.id, 'name', e.target.value)}
                    placeholder="Category (e.g. Languages, Frameworks, Tools)"
                  />
                  <button onClick={() => removeSkillCat(cat.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0">Remove</button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Skills (comma-separated)</label>
                  <input
                    className={INPUT}
                    value={cat.items.join(', ')}
                    onChange={e => updateSkillCat(cat.id, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="TypeScript, React, Node.js, PostgreSQL"
                  />
                </div>
              </div>
            ))}
            <button onClick={addSkillCat} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              + Add Skill Category
            </button>
          </div>
        </Section>

        {/* Projects */}
        <Section title="Projects">
          <div className="space-y-4">
            {resume.projects.map((proj, idx) => (
              <div key={proj.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Project {idx + 1}</span>
                  <button onClick={() => removeProject(proj.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Project Name">
                    <input className={INPUT} value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="My Project" />
                  </Field>
                  <Field label="URL (optional)">
                    <input className={INPUT} value={proj.url || ''} onChange={e => updateProject(proj.id, 'url', e.target.value)} placeholder="github.com/user/project" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Description">
                      <textarea className={`${TEXTAREA} w-full`} rows={2} value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} placeholder="What it does and what you built" />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Technologies (comma-separated)">
                      <input className={INPUT} value={proj.technologies.join(', ')} onChange={e => updateProject(proj.id, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="React, Python, AWS" />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addProject} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              + Add Project
            </button>
          </div>
        </Section>
      </div>

      {/* Bottom save button */}
      <div className="mt-8 pb-8 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Resume'}
        </button>
      </div>
    </div>
  );
}
