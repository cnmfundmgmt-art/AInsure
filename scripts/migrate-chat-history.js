/**
 * Chat History Migration Script
 * Run: node scripts/migrate-chat-history.js
 *
 * Adds chat_messages table to existing database
 */

const Database = require('better-sqlite3');
const path = require('path');
const { nanoid } = require('nanoid');

const DB_PATH = path.join(__dirname, '../data/cfp_local.db');

console.log('Migrating chat history...');
console.log('Database:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create chat_messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES insurance_analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chat_session_seq ON chat_messages(session_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_session_role ON chat_messages(session_id, role);
`);

// Verify
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'").get();
if (tables) {
  console.log('✅ chat_messages table created successfully');
} else {
  console.log('❌ Failed to create chat_messages table');
  process.exit(1);
}

// Check existing sessions and add sample chat history for testing
const existingSessions = db.prepare('SELECT id, client_name FROM insurance_analysis_sessions LIMIT 3').all();
console.log(`\nFound ${existingSessions.length} existing sessions`);

for (const session of existingSessions) {
  const messageId = nanoid();
  const createdAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  db.prepare(`
    INSERT OR IGNORE INTO chat_messages (id, session_id, role, content, created_at)
    VALUES (?, ?, 'assistant', ?, ?)
  `).run(messageId, session.id, `👋 Hi! I'm your AI Insurance Strategist. I can help you with coverage recommendations, product comparisons, and pitch scripts. What would you like to discuss today?`, createdAt);
}

console.log('✅ Migration complete!');
db.close();