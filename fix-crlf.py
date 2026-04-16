with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

# Check for double CR
print(f'File size: {len(raw)}')
print(f'Single CR: {raw.count(b"\r")}')
print(f'Single LF: {raw.count(b"\n")}')
print(f'Double CR+LF: {raw.count(b"\r\r\n")}')

# Replace \r\r\n with \r\n (double CRLF → single CRLF)
# This happens when Windows line endings get duplicated
clean = raw.replace(b'\r\r\n', b'\r\n')

# Also replace any standalone \r\r with \r (in case of edge cases)
clean = clean.replace(b'\r\r', b'\r')

print(f'After clean - single CR: {clean.count(b"\r")}')

# Verify balanced
print(f'CR count: {clean.count(b"\r")}, LF count: {clean.count(b"\n")}')

with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'wb') as f:
    f.write(clean)

print('Line endings normalized!')
