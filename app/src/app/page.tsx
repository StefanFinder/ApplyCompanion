'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Job } from '@/lib/types';

function statusBadge(status: Job['status']) {
  const styles: Record<Job['status'], string> = {
    pending: 'bg-slate-100 text-slate-600',
    generated: 'bg-blue-50 text-blue-700',
    applied: 'bg-green-50 text-green-700',
    interviewing: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-600',
  };
  const labels: Record<Job['status'], string> = {
    pending: 'Pending',
    generated: 'Generated',
    applied: 'Applied',
    interviewing: 'Interviewing',
    rejected: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadJobs = useCallback(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then((data: Job[]) => { setJobs(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const deleteJob = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // don't navigate to the job page
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/job/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
    setDeletingId(null);
  };

  const stats = {
    total: jobs.length,
    generated: jobs.filter(j => j.status === 'generated').length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interviewing: jobs.filter(j => j.status === 'interviewing').length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your job applications and generated documents.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'text-slate-900' },
          { label: 'Generated', value: stats.generated, color: 'text-blue-700' },
          { label: 'Applied', value: stats.applied, color: 'text-green-700' },
          { label: 'Interviewing', value: stats.interviewing, color: 'text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Recent Applications</h2>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No applications yet</p>
            <p className="text-xs text-slate-400 mt-1">Use the Chrome extension to capture a job description.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="group relative flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                {/* Main link area */}
                <Link href={`/jobs/${job.id}`} className="absolute inset-0 rounded-xl" aria-label={`Open ${job.title}`} />

                {/* Company initial */}
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 relative z-10 pointer-events-none">
                  {(job.company || job.title || '?')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {job.title || 'Untitled Role'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {job.company || 'Unknown company'}
                    {job.url && <span className="mx-1.5 text-slate-300">·</span>}
                    {job.url && (() => { try { return new URL(job.url).hostname.replace('www.', ''); } catch { return ''; } })()}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                  <div className="flex flex-col items-end gap-0.5">
                    {statusBadge(job.status)}
                    {job.statusTimestamps?.[job.status] && (
                      <span className="text-[10px] text-slate-400">
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)} on{' '}
                        {new Date(job.statusTimestamps[job.status]!).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{timeAgo(job.createdAt)}</span>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={e => deleteJob(e, job.id)}
                    disabled={deletingId === job.id}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                    title="Delete application"
                  >
                    {deletingId === job.id ? (
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    )}
                  </button>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" className="group-hover:stroke-indigo-400 transition-colors pointer-events-none">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
