CREATE TABLE IF NOT EXISTS visit_session_codes (
  serial INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE REFERENCES visit_sessions(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS visit_session_assign_code AFTER INSERT ON visit_sessions
BEGIN
  INSERT INTO visit_session_codes (session_id) VALUES (NEW.id);
END;

INSERT INTO visit_session_codes (session_id)
SELECT visit_sessions.id
FROM visit_sessions
WHERE NOT EXISTS (
  SELECT 1 FROM visit_session_codes WHERE session_id = visit_sessions.id
)
ORDER BY visit_sessions.started_at, visit_sessions.id;
