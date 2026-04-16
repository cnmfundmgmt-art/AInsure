content = open('app/insurance/SidebarContent.tsx', 'rb').read()
for i, b in enumerate(content):
    if b > 127:
        print(f'pos {i}: 0x{b:02x}')
        print(f'  context bytes: {content[max(0,i-4):i+5]}')
        if i > 5:
            try:
                snippet = content[max(0,i-4):i+20].decode('utf-8', errors='replace')
                print(f'  decoded: {repr(snippet)}')
            except:
                pass
        break