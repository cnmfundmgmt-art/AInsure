with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

lines = raw.split(b'\n')

# Track depth carefully - show every line where depth CHANGES
paren_depth = 0
brace_depth = 0
bracket_depth = 0
in_string = False
string_char = None
in_line_comment = False
in_block_comment = False

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Skip lines for depth tracking if inside block comment
    if in_block_comment:
        if b'*/' in line:
            in_block_comment = False
        continue
    
    # Check for line comment
    if not in_string:
        if b'//' in line:
            # Only if not inside a string
            pass
    
    j = 0
    while j < len(line):
        c = chr(line[j])
        
        # Handle escape
        prev = chr(line[j-1]) if j > 0 else None
        if c == '\\' and prev != '\\':
            j += 2
            continue
        
        # Handle strings
        if not in_string:
            if c == '"' or c == "'":
                in_string = True
                string_char = c
            elif c == '/' and j+1 < len(line) and chr(line[j+1]) == '/':
                # Line comment
                break
            elif c == '/' and j+1 < len(line) and chr(line[j+1]) == '*':
                in_block_comment = True
                break
        elif in_string:
            if c == string_char and prev != '\\':
                in_string = False
                string_char = None
        
        # Track brackets only when NOT in a string or comment
        if not in_string and not in_block_comment:
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
        
        j += 1
    
    if line_num >= 885 and line_num <= 925:
        print(f'Line {line_num}: p={paren_depth} b={brace_depth} br={bracket_depth}: {repr(line[:60])}')
    if line_num == 925:
        print(f'Line {line_num}: p={paren_depth} b={brace_depth} br={bracket_depth}: {repr(line[:60])}')
    if line_num == 930:
        break
