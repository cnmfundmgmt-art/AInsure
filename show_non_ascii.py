content = open('app/insurance/SidebarContent.tsx', 'rb').read()
non_ascii = [(i, b) for i, b in enumerate(content) if b > 127]
print(f"Total: {len(non_ascii)}")
for i, b in non_ascii[:20]:
    ctx = content[max(0,i-5):i+8]
    try:
        decoded = ctx.decode('utf-8', errors='replace')
    except:
        decoded = ctx.decode('latin-1', errors='replace')
    print(f"pos {i}: 0x{b:02x} ctx={repr(decoded)}")