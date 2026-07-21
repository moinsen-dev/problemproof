CREATE TABLE IF NOT EXISTS proof_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('yes', 'not_my_problem', 'skip')),
  source TEXT NOT NULL DEFAULT 'proof-feed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (problem_id, user_id)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_proof_reactions_problem_type
  ON proof_reactions(problem_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_proof_reactions_user_updated
  ON proof_reactions(user_id, updated_at DESC);

INSERT OR IGNORE INTO proof_reactions (problem_id, user_id, reaction_type, source, created_at, updated_at)
SELECT problem_id, user_id, 'yes', 'confirmation-backfill', created_at, created_at
FROM confirmations
WHERE user_id IS NOT NULL;
