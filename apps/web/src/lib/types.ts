export const ORIGINS = ['firsthand', 'hypothesis'] as const;
export const SOURCES = ['web', 'skill', 'api'] as const;
export const HAPPENED_OPTIONS = ['7-days', '30-days', '90-days', 'older'] as const;
export const FREQUENCIES = ['once', 'monthly', 'weekly', 'daily'] as const;

export type Origin = (typeof ORIGINS)[number];
export type Source = (typeof SOURCES)[number];
export type Happened = (typeof HAPPENED_OPTIONS)[number];
export type Frequency = (typeof FREQUENCIES)[number];

export interface ProblemRow {
  id: number;
  slug: string;
  statement: string;
  origin: Origin;
  target_group: string;
  region: string;
  category: string;
  consequence: string;
  source: Source;
  proof_status: 'needs-proof' | 'strong';
  created_at: string;
  confirmations_count: number;
  incidents_count: number;
  average_severity: number | null;
  workarounds: string | null;
}

export interface FeedFilters {
  mode: 'needs-proof' | 'new' | 'strong';
  search: string;
  region: string;
  targetGroup: string;
  category: string;
  origin: Origin | '';
}

export interface ProblemInput {
  statement: string;
  origin: Origin;
  targetGroup: string;
  region: string;
  category: string;
  consequence: string;
  participantId: string;
  source: Source;
}

export interface EvidenceInput {
  happened: Happened;
  frequency: Frequency;
  severity: number;
  story: string;
  workaround: string;
  region: string;
  participantId: string;
  ownExperience: boolean;
}
