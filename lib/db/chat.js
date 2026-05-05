/**
 * Chat History Database Module
 * CFP Malaysia - Insurance Analysis Sessions
 *
 * Uses the shared getDb() from lib/db/client.ts
 * Works with local SQLite (dev) and Turso (production)
 */

const { getDb } = require('./client');

/**
 * Add a message to a chat session
 * @param {string} sessionId - The session ID
 * @param {string} role - 'user' | 'assistant' | 'system'
 * @param {string} content - The message content (supports 3KB+ with emojis/markdown)
 * @param {object} [metadata] - Optional metadata
 * @returns {Promise<string>} The message ID
 */
async function addMessage(sessionId, role, content, metadata = null) {
  const db = getDb();
  const id = require('nanoid')();
  const createdAt = Math.floor(Date.now() / 1000);

  await db.execute({
    sql: `INSERT INTO chat_messages (id, session_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, sessionId, role, content, metadata ? JSON.stringify(metadata) : null, createdAt],
  });

  return id;
}

/**
 * Get full conversation history for a session
 * @param {string} sessionId - The session ID
 * @param {object} [options] - Optional filters
 * @param {number} [options.limit] - Max messages to return
 * @param {string} [options.role] - Filter by role
 * @returns {Promise<Array>}
 */
async function getConversation(sessionId, options = {}) {
  const db = getDb();
  const { limit = 1000, role = null } = options;

  let sql = `SELECT id, role, content, metadata, created_at FROM chat_messages WHERE session_id = ?`;
  const args = [sessionId];

  if (role) {
    sql += ` AND role = ?`;
    args.push(role);
  }

  sql += ` ORDER BY created_at ASC LIMIT ?`;
  args.push(limit);

  const result = await db.execute({ sql, args });
  return (result.rows || []).map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    created_at: row.created_at,
  }));
}

/**
 * Get messages in OpenAI format (role + content only)
 * Ready to send directly to OpenAI/DeepSeek API
 * @param {string} sessionId - The session ID
 * @param {object} [options] - Optional filters
 * @param {number} [options.limit] - Max messages to return
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getMessagesForAPI(sessionId, options = {}) {
  const db = getDb();
  const { limit = 1000 } = options;

  const result = await db.execute({
    sql: `SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?`,
    args: [sessionId, limit],
  });

  return (result.rows || []).map(row => ({
    role: row.role,
    content: row.content,
  }));
}

/**
 * Delete all messages for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<number>} Number of messages deleted
 */
async function deleteSessionMessages(sessionId) {
  const db = getDb();
  const result = await db.execute({
    sql: `DELETE FROM chat_messages WHERE session_id = ?`,
    args: [sessionId],
  });
  return result.rowsAffected || 0;
}

/**
 * Initialize database with required tables/indexes
 */
async function initialize() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata TEXT DEFAULT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (session_id) REFERENCES insurance_analysis_sessions(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_session_seq ON chat_messages(session_id, created_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_session_role ON chat_messages(session_id, role)`);

  console.log('[ChatDB] Initialized successfully');
}

module.exports = {
  addMessage,
  getConversation,
  getMessagesForAPI,
  deleteSessionMessages,
  initialize,
};