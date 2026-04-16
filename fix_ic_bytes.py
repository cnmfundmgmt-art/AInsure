import re

# Read as bytes
content = open('app/insurance/SidebarContent.tsx', 'rb').read()

# Fix specific byte sequences that are UTF-8 decoded as cp1252
fixes = {
    b'\xe2\x9c\x93': b'v',        # ✓ checkmark
    b'\xe2\x80\x94': b'-',         # em dash
    b'\xe2\x80\x93': b'-',         # en dash
    b'\xe2\x80\x98': b"'",         # left single quote
    b'\xe2\x80\x99': b"'",         # right single quote
    b'\xe2\x80\x9c': b'"',         # left double quote
    b'\xe2\x80\x9d': b'"',         # right double quote
    b'\xe2\x80\xa6': b'...',       # ellipsis
    b'\xc3\xa2': b'a',             # â (garbled from double-byte sequences)
    b'\xe2\x82\xac': b'',          # euro sign (shouldn't appear)
}

for old_bytes, new_bytes in fixes.items():
    content = content.replace(old_bytes, new_bytes)

# Remove BOM
if content.startswith(b'\xef\xbb\xbf'):
    content = content[3:]

open('app/insurance/SidebarContent.tsx', 'wb').write(content)
print('done')