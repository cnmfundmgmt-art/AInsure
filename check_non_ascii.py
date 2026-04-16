content = open('app/insurance/SidebarContent.tsx', 'rb').read()

# Find all non-ASCII bytes
non_ascii = [(i, b) for i, b in enumerate(content) if b > 127]
print(f"Total non-ASCII bytes: {len(non_ascii)}")

# Show first 20
for i, b in non_ascii[:20]:
    ctx = content[max(0,i-5):i+8]
    decoded = ctx.decode('utf-8', errors='replace')
    print(f"pos {i}: 0x{b:02x} ctx={repr(decoded)}")