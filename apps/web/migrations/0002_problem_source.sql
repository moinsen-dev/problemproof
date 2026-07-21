ALTER TABLE problems
  ADD COLUMN source TEXT NOT NULL DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_problems_source_created
  ON problems(source, created_at DESC);
