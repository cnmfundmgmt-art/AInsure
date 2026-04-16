with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')

# Check template literal balance properly
# A template literal opens with a backtick and closes with a backtick
# Track running state through the file
in_template = False
template_start_line = None
for i, line in enumerate(lines):
    backticks = line.count(b'`')
    for _ in range(backticks):
        in_template = not in_template
        if not in_template:
            pass  # closed
        else:
            template_start_line = i+1  # opened
    if i > 1000 and in_template:
        print(f'Still in template at line {i+1}')
        break

if in_template:
    print(f'UNCLOSED template literal starting at line {template_start_line}')
    # Show lines around the start
    start = template_start_line - 1
    for j in range(start, min(start+5, len(lines))):
        print(f'  {j+1}: {repr(lines[j][:80])}')
else:
    print('Template literals are balanced')

# Also check for unclosed double-quoted strings
# (this is trickier but let's try)
print('\n--- String balance check ---')
# Check for double-quote strings before line 925
in_dq_string = False
dq_start = 0
for i, line in enumerate(lines[:925]):
    dq_count = line.count(b'"')
    # Remove escaped quotes
    raw = line
    # Count: if odd, opens/closes; if even, all pairs
    if not in_dq_string and dq_count % 2 == 1:
        in_dq_string = True
        dq_start = i+1
    elif in_dq_string and dq_count % 2 == 1:
        in_dq_string = False

if in_dq_string:
    print(f'WARNING: Unclosed double-quoted string starting at line {dq_start}')
else:
    print('Double-quoted strings appear balanced')
