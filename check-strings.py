with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')

# Check for unclosed template literals (backticks) before line 925
in_template = False
template_start = 0
for i, line in enumerate(lines[:925]):
    tc = line.count(b'`')
    bc = line.count(b'\\`')
    if tc > bc and not in_template:
        in_template = True
        template_start = i+1
    elif in_template and (tc - bc) % 2 != 0:
        in_template = False

if in_template:
    print(f'UNCLOSED template literal starting at line {template_start}')
else:
    print('Templates appear balanced')

# Check for unclosed strings
in_str = False
str_char = None
str_line = 0
for i, line in enumerate(lines[:925]):
    line_bytes = line
    for j, b in enumerate(line_bytes):
        c = chr(b)
        if not in_str and c in ('"', "'"):
            in_str = True
            str_char = c
            str_line = i+1
        elif in_str and c == str_char:
            # Check for escaped quote
            if j == 0 or line_bytes[j-1] != ord('\\'):
                in_str = False
                str_char = None

if in_str:
    print(f'UNCLOSED string starting at line {str_line}')
else:
    print('Strings appear balanced')

# Also show lines 921-925 raw
print('\nLines 921-925:')
for i in range(920, 925):
    print(f'{i+1}: {repr(lines[i])}')
