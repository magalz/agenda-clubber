ALTER TABLE events ADD COLUMN IF NOT EXISTS conflict_level text
  CHECK (conflict_level IN ('green', 'yellow', 'red'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS conflict_justification text;
