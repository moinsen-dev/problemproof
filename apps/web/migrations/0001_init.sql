PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  statement TEXT NOT NULL CHECK (length(statement) BETWEEN 20 AND 280),
  origin TEXT NOT NULL CHECK (origin IN ('firsthand', 'hypothesis')),
  target_group TEXT NOT NULL,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  consequence TEXT NOT NULL,
  author_id TEXT NOT NULL,
  proof_status TEXT NOT NULL DEFAULT 'needs-proof' CHECK (proof_status IN ('needs-proof', 'strong')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (problem_id, participant_id)
) STRICT;

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  happened TEXT NOT NULL CHECK (happened IN ('7-days', '30-days', '90-days', 'older')),
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'monthly', 'weekly', 'daily')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  story TEXT NOT NULL CHECK (length(story) BETWEEN 20 AND 1200),
  workaround TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (problem_id, participant_id)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_problems_status_created
  ON problems(proof_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_filters
  ON problems(region, target_group, category, origin);
CREATE INDEX IF NOT EXISTS idx_confirmations_problem
  ON confirmations(problem_id);
CREATE INDEX IF NOT EXISTS idx_evidence_problem
  ON evidence(problem_id);
