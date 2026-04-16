with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

lines = raw.split(b'\n')

paren_depth = 0
brace_depth = 0
bracket_depth = 0

# Simple state machine for tokenizing
# We just track brackets, ignoring strings and comments
i = 0
line_num = 1

while i < len(raw):
    b = raw[i]
    c = chr(b)
    
    # Track newlines
    if c == '\n':
        line_num += 1
        i += 1
        continue
    
    # Skip escaped characters
    if c == '\\' and i + 1 < len(raw):
        i += 2
        continue
    
    # Skip string delimiters (single, double, template)
    if c in ("'", '"', '`'):
        quote = b
        i += 1
        while i < len(raw):
            if raw[i] == ord('\\') and i + 1 < len(raw):
                i += 2
                continue
            if raw[i] == quote:
                i += 1
                break
            if raw[i] == ord('\n'):
                # Unclosed string - error
                break
            i += 1
        continue
    
    # Skip // comments
    if c == '/' and i + 1 < len(raw) and raw[i + 1] == ord('/'):
        while i < len(raw) and raw[i] != ord('\n'):
            i += 1
        continue
    
    # Skip /* */ comments
    if c == '/' and i + 1 < len(raw) and raw[i + 1] == ord('*'):
        i += 2
        while i < len(raw):
            if raw[i] == ord('*') and i + 1 < len(raw) and raw[i + 1] == ord('/'):
                i += 2
                break
            i += 1
        continue
    
    # Track brackets
    if c == '(':
        paren_depth += 1
    elif c == ')':
        paren_depth -= 1
    elif c == '{':
        brace_depth += 1
    elif c == '}':
        brace_depth -= 1
    elif c == '[':
        bracket_depth += 1
    elif c == ']':
        bracket_depth -= 1
    
    # Report issues
    if paren_depth < 0 or brace_depth < 0 or bracket_depth < 0:
        print(f'Line {line_num}: NEGATIVE! p={paren_depth} b={brace_depth} br={bracket_depth}')
        print(f'  At char: {repr(raw[i-20:i+30])}')
        paren_depth = max(0, paren_depth)
        brace_depth = max(0, brace_depth)
        bracket_depth = max(0, bracket_depth)
    
    i += 1

print(f'\nFinal: p={paren_depth} b={brace_depth} br={bracket_depth}')
if paren_depth > 0 or brace_depth > 0 or bracket_depth > 0:
    print(f'WARNING: {paren_depth} unclosed (, {brace_depth} unclosed {{, {bracket_depth} unclosed [')
