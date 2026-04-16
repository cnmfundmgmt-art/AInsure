with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')

BACK = b'\x60'
in_template = False
template_start = None
for i, line in enumerate(lines):
    bt_count = line.count(BACK)
    for _ in range(bt_count):
        if not in_template:
            in_template = True
            template_start = i+1
        else:
            in_template = False
            template_start = None

    if in_template and i > 1040:
        print(f'Still open at line {i+1}: {repr(line[:60])}')

if in_template:
    print(f'UNCLOSED template starting at line {template_start}')
else:
    print('All template literals are properly closed!')
