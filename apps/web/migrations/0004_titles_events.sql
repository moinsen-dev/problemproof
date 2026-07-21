ALTER TABLE problems
  ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled problem';

UPDATE problems
SET title = CASE
  WHEN id = 1 THEN 'Repo-Reflex vor Problemklärung'
  WHEN id = 2 THEN 'Erlebnisideen zerfallen in Notizen'
  ELSE substr(statement, 1, 80)
END
WHERE title = 'Untitled problem';

CREATE TABLE IF NOT EXISTS problem_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'share')),
  source TEXT NOT NULL DEFAULT 'unknown',
  referrer TEXT NOT NULL DEFAULT '',
  event_day TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE INDEX IF NOT EXISTS idx_problem_events_problem_type_day
  ON problem_events(problem_id, event_type, event_day DESC);

CREATE INDEX IF NOT EXISTS idx_problem_events_user_created
  ON problem_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
