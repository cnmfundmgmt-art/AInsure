with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Find the exact content
idx = c.find('Existing Policies (optional)')
if idx > 0:
    start = max(0, idx - 200)
    end = min(len(c), idx + 350)
    chunk = c[start:end]
    print('Chars before label:', repr(chunk[:50]))
    print('---')
    print('Block:')
    print(repr(chunk))
    print('---')
    # Try to find the div before the label
    div_idx = chunk.rfind('<div>')
    print('Nearest <div> before:', repr(chunk[div_idx-5:div_idx+20]) if div_idx >= 0 else 'NOT FOUND')
