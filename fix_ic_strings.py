content = open('app/insurance/SidebarContent.tsx', 'r', encoding='utf-8').read()

replacements = {
    'Starting OCR engine\u2026': 'Starting OCR engine...',
    'Setting up\u2026': 'Setting up...',
    '\u2026 Scan complete': '... Scan complete',
    'Setting up\u2026': 'Setting up...',
}

# Fix the garbled sequences
content = content.replace('Starting OCR engine\u00e2\u0080\u00a6', 'Starting OCR engine...')
content = content.replace('Setting up\u00e2\u0080\u00a6', 'Setting up...')
content = content.replace('\u00e2\u0080\u00a6', '...')

# Remove BOM
if content.startswith('\ufeff'):
    content = content[1:]

open('app/insurance/SidebarContent.tsx', 'w', encoding='utf-8').write(content)
print('done')