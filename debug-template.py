with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')

# Check if line 921 truly has a balanced string
line921 = lines[920]
print(f'Line 921: {repr(line921)}')
print(f'Single quotes: {line921.count(bchr(39))}')
print(f'Double quotes: {line921.count(b"\"".encode())}')

# Actually check template literal balance
in_template = False
for i, line in enumerate(lines[:925]):
    backticks = line.count(b'`')
    if not in_template and backticks > 0:
        in_template = True
        print(f'Template starts at line {i+1}, backticks={backticks}')
    elif in_template and backticks % 2 != 0:
        in_template = False

if in_template:
    print(f'WARNING: Unclosed template literal detected before line 925!')

# Let's specifically check lines around 162 more carefully
print('\nLooking for unclosed template:')
in_template2 = False
for i, line in enumerate(lines):
    bt = line.count(b'`')
    if bt > 0:
        if not in_template2:
            print(f'  Template opens at line {i+1}')
            in_template2 = True
        else:
            print(f'  Template closes at line {i+1} (found {bt} backticks)')
            in_template2 = False
    if i > 170 and i < 925:
        break
