-- Chat History Schema for CFP Malaysia
-- Run this migration to create the chat_messages table

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata TEXT DEFAULT NULL,  -- JSON for extra data (attachments, tool calls, etc.)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (session_id) REFERENCES insurance_analysis_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_session_seq ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_session_role ON chat_messages(session_id, role);

-- Trigger to auto-delete chat history when session is deleted
-- (CASCADE should handle this, but adding for safety)
-- DROP TRIGGER IF EXISTS delete_chat_on_session_delete;
-- CREATE TRIGGER delete_chat_on_session_delete
--   AFTER DELETE ON insurance_analysis_sessions
--   FOR EACH ROW
--   BEGIN
--     DELETE FROM chat_messages WHERE session_id = OLD.id;
--   END;