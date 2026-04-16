# Fix remaining non-ASCII bytes in SidebarContent.tsx
content = open('app/insurance/SidebarContent.tsx', 'rb').read()

# Common UTF-8 multi-byte sequences that got mis-decoded:
# 0xC2 0xA6 -> U+00A6 ¦ (should be ... ellipsis but garbled)
# 0xC5 0x93 -> U+0193 (Latin E with flourish)
# 0xC5 0xB8 -> U+0178 (Y with diaeresis)
# 0xC2 0xB2 -> U+00B2 (superscript 2)
# 0xC2 0xBC -> U+00BC (1/4)
# 0xE2 0x80 0xA6 -> U+2026 ... (ellipsis) - actual correct UTF-8

# Replace known bad sequences with ASCII equivalents
replacements = {
    b'\xc2\xa6': b'...',     # garbled ellipsis
    b'\xc2\xb2': b'2',        # superscript 2
    b'\xc2\xbc': b'1/4',     # 1/4
    b'\xc5\x93': b'',         # garbled char
    b'\xc5\xb8': b'',         # garbled char
    b'\xe2\x80\x94': b'--',   # em dash
    b'\xe2\x80\x93': b'-',    # en dash
    b'\xe2\x80\x98': b"'",
    b'\xe2\x80\x99': b"'",
    b'\xe2\x80\x9c': b'"',
    b'\xe2\x80\x9d': b'"',
    b'\xe2\x80\xa6': b'...',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Remove any remaining non-ASCII bytes (replace with space)
result = bytearray()
for b in content:
    if b > 127:
        result.append(0x20)  # space
    else:
        result.append(b)
content = bytes(result)

open('app/insurance/SidebarContent.tsx', 'wb').write(content)
print('done')