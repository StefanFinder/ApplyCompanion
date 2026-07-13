import fs from 'fs';
import path from 'path';
import type { Resume, Job } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_DIR = path.join(DATA_DIR, 'jobs');
const RESUME_FILE = path.join(DATA_DIR, 'resume.json');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
}

// --- Resume ---

export function readResume(): Resume | null {
  ensureDirs();
  if (!fs.existsSync(RESUME_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(RESUME_FILE, 'utf-8')) as Resume;
  } catch {
    return null;
  }
}

export function writeResume(resume: Resume): void {
  ensureDirs();
  fs.writeFileSync(RESUME_FILE, JSON.stringify(resume, null, 2), 'utf-8');
}

// --- Jobs ---

function jobFile(id: string) {
  return path.join(JOBS_DIR, `${id}.json`);
}

export function readJob(id: string): Job | null {
  ensureDirs();
  const file = jobFile(id);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Job;
  } catch {
    return null;
  }
}

export function writeJob(job: Job): void {
  ensureDirs();
  fs.writeFileSync(jobFile(job.id), JSON.stringify(job, null, 2), 'utf-8');
}

export function listJobs(): Job[] {
  ensureDirs();
  const files = fs.readdirSync(JOBS_DIR).filter(f => f.endsWith('.json'));
  const jobs: Job[] = [];
  for (const file of files) {
    try {
      const job = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, file), 'utf-8')) as Job;
      jobs.push(job);
    } catch {
      // skip corrupted files
    }
  }
  return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteJob(id: string): void {
  const file = jobFile(id);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
