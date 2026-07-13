export interface ResumePersonal {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  notes?: string;
}

export interface ResumeSkillCategory {
  id: string;
  name: string;
  items: string[];
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface Resume {
  personal: ResumePersonal;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkillCategory[];
  projects: ResumeProject[];
}

export type JobStatus = 'pending' | 'generated' | 'applied' | 'rejected' | 'interviewing';

export interface JobDocuments {
  resume?: string;
  coverLetter?: string;
  hiringManagerMessage?: string;
  whyCompany?: string;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  url: string;
  description: string;
  createdAt: string;
  status: JobStatus;
  statusTimestamps: Partial<Record<JobStatus, string>>; // ISO date per status
  notes: string;
  documents: JobDocuments;
}
