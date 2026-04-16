import sqlite3
conn = sqlite3.connect('C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db')
cur = conn.cursor()

# Get all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]

print('=== ALL TABLES ===')
total_cols = 0
for tname in tables:
    cur.execute(f"PRAGMA table_info({tname})")
    cols = cur.fetchall()
    total_cols += len(cols)
    print(f'\n{tname} ({len(cols)} columns):')
    for c in cols:
        print(f'  {c[1]} ({c[2]})')

print(f'\n=== TOTAL: {len(tables)} tables, {total_cols} columns ===')
conn.close()
