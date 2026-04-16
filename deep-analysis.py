with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

# Track all bracket types
paren_depth = 0
brace_depth = 0
bracket_depth = 0

# Track string literals
in_single = False
in_double = False
in_template = False
template_depth = 0
line_start = 1
col = 0

issues = []
i = 0
while i < len(raw):
    b = raw[i]
    c = chr(b)
    
    # Handle escape sequences
    if i > 0 and raw[i-1] == ord('\\'):
        i += 1
        continue
    
    # Handle strings
    if not in_single and not in_double and not in_template:
        if c == "'":
            in_single = True
        elif c == '"':
            in_double = True
        elif c == '`':
            in_template = True
            template_depth = 1
        elif c == '/' and i+1 < len(raw) and raw[i+1] == ord('/'):
            # Line comment - skip to end of line
            while i < len(raw) and raw[i] != ord('\n'):
                i += 1
            continue
        elif c == '/' and i+1 < len(raw) and raw[i+1] == ord('*'):
            # Block comment - skip
            i += 2
            while i < len(raw):
                if raw[i] == ord('*') and i+1 < len(raw) and raw[i+1] == ord('/'):
                    i += 2
                    break
                i += 1
            continue
    elif in_single and c == "'":
        in_single = False
    elif in_double and c == '"':
        in_double = False
    elif in_template:
        if c == '`' and (i == 0 or raw[i-1] != ord('\\')):
            in_template = False
        elif c == '$' and i+1 < len(raw) and raw[i+1] == ord('{'):
            template_depth += 1
        elif c == '}':
            template_depth -= 1
    else:
        # Inside a string, skip
        pass
    
    # Track brackets only outside strings
    if not in_single and not in_double and not in_template:
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
        
        if c == '\n':
            line_start += 1
            col = 0
        else:
            col += 1
        
        if paren_depth < 0:
            issues.append(f'Line {line_start}: paren depth negative: {paren_depth}')
            paren_depth = 0
        if brace_depth < 0:
            issues.append(f'Line {line_start}: brace depth NEGATIVE: {brace_depth} (extra closing brace!)')
            brace_depth = 0
        if bracket_depth < 0:
            issues.append(f'Line {line_start}: bracket depth negative: {bracket_depth}')
            bracket_depth = 0
    
    i += 1

if issues:
    print('ISSUES FOUND:')
    for issue in issues[:20]:
        print(' ', issue)
else:
    print('No structural issues found in bracket counting')

print(f'\nFinal depth - paren: {paren_depth}, brace: {brace_depth}, bracket: {bracket_depth}')
print(f'Still in strings: single={in_single}, double={in_double}, template={in_template}')
