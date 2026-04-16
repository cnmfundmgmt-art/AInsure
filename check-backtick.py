with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

BACKTICK = chr(96)

# Count backticks
print('Backticks:', c.count(BACKTICK))

# Find all backtick positions
positions = [i for i, ch in enumerate(c) if ch == BACKTICK]
print(f'Found {len(positions)} backtick chars')

# Check for unclosed template literals properly
in_template = False
template_start = None
i = 0
while i < len(c):
    ch = c[i]
    if ch == BACKTICK:
        if not in_template:
            in_template = True
            template_start = i
        else:
            in_template = False
            template_start = None
    elif in_template and ch == '$' and i + 1 < len(c) and c[i+1] == '{':
        # Track ${} depth inside template
        i += 1  # skip $
        i += 1  # skip {
        depth = 1
        while i < len(c) and depth > 0:
            ch2 = c[i]
            if ch2 == '{':
                depth += 1
            elif ch2 == '}':
                depth -= 1
            elif ch2 == BACKTICK:
                # This would close the template - unbalanced
                pass
            i += 1
        i -= 1  # compensate for the for loop increment
    i += 1

if in_template:
    print(f'Unclosed template literal starting at char {template_start}')
    print(f'Context: ...{c[max(0,template_start-50):template_start+100]}...')
else:
    print('All template literals are properly closed')

# Also check for issues around line 923 specifically
lines = c.split('\n')
print(f'\nLine 923: {repr(lines[922])}')
print(f'Line 924: {repr(lines[923])}')
print(f'Line 925: {repr(lines[924])}')
print(f'Line 926: {repr(lines[925])}')
