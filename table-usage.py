import sqlite3
import os

conn = sqlite3.connect('C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db')
cur = conn.cursor()

# Check sample data in key tables
key_tables = ['users', 'clients', 'id_documents', 'face_verifications',
              'insurance_analysis_sessions', 'audit_logs']

print('=== KEY TABLE USAGE (with sample data) ===\n')
for t in key_tables:
    cur.execute(f"PRAGMA table_info({t})")
    cols = [c[1] for c in cur.fetchall()]
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    count = cur.fetchone()[0]
    print(f'{t}: {len(cols)} columns, {count} rows')
    if count > 0:
        cur.execute(f"SELECT * FROM {t} LIMIT 1")
        row = cur.fetchone()
        # Show non-null values
        vals = {cols[i]: row[i] for i in range(len(cols)) if row[i] is not None}
        print(f'  Sample: {vals}')
    print()

conn.close()
