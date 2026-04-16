import sqlite3
import os

conn = sqlite3.connect('C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db')
cur = conn.cursor()

# Check each table - columns vs data presence
print('=== LOGIN/OCR -> APPROVAL -> ADVISOR PANEL FLOW ===\n')

flow_tables = {
    'USERS (login + approval)': ['users'],
    'CLIENTS (OCR extracted data)': ['clients'],
    'ID_DOCUMENTS (IC scan + OCR)': ['id_documents'],
    'FACE_VERIFICATIONS (selfie verify)': ['face_verifications'],
    'INSURANCE_ANALYSIS_SESSIONS (advisor sessions)': ['insurance_analysis_sessions'],
    'AUDIT_LOGS (approval actions)': ['audit_logs'],
    'CLIENT_POLICIES (existing policies)': ['client_policies'],
}

for group, tables in flow_tables.items():
    print(f'\n{group}')
    print('-' * 60)
    for t in tables:
        cur.execute(f"PRAGMA table_info({t})")
        cols = [(c[1], c[2]) for c in cur.fetchall()]
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        count = cur.fetchone()[0]

        # Check which columns have data
        cur.execute(f"SELECT * FROM {t} LIMIT 3")
        rows = cur.fetchall()
        if rows:
            header = [c[1] for c in cur.description] if cur.description else []
            # For each column, check if it has non-null values
            used_cols = set()
            for row in rows:
                for i, val in enumerate(row):
                    if val is not None:
                        used_cols.add(header[i])
        else:
            used_cols = set()

        print(f'  Table: {t} | Total cols: {len(cols)} | Rows: {count}')
        print(f'  COLUMNS:')
        for cname, ctype in cols:
            status = '✓ USED' if cname in used_cols else '  empty'
            print(f'    {cname:35s} {ctype:15s} {status}')

conn.close()
