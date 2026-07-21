CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL DEFAULT 'GitHub account',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github')),
  provider_subject_hash TEXT NOT NULL UNIQUE,
  provider_login TEXT NOT NULL DEFAULT '',
  provider_created_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, provider_subject_hash)
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (problem_id, user_id)
) STRICT;

CREATE TABLE IF NOT EXISTS personal_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  revoked_at TEXT
) STRICT;

ALTER TABLE problems
  ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE confirmations
  ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE evidence
  ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmations_problem_user
  ON confirmations(problem_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_problem_user
  ON evidence(problem_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_problems_user_created
  ON problems(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
  ON favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_hash_expires
  ON sessions(token_hash, expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_hash
  ON personal_tokens(token_hash)
  WHERE revoked_at IS NULL;
