# Fix the remaining encoding issues in SidebarContent.tsx
content = open('app/insurance/SidebarContent.tsx', 'r', encoding='utf-8').read()

# Fix the known bad strings we've identified
content = content.replace('Starting OCR enginea...', 'Starting OCR engine...')
content = content.replace('Setting upa...', 'Setting up...')
content = content.replace('" Scan complete', ' Scan complete')
content = content.replace('a" ${', ' ${')
content = content.replace('a- }', '- }')

# Remove BOM if present
if content.startswith('\ufeff'):
    content = content[1:]

open('app/insurance/SidebarContent.tsx', 'w', encoding='utf-8').write(content)
print('done')

# Verify
check = open('app/insurance/SidebarContent.tsx', 'r', encoding='utf-8').read()
print('BOM:', check.startswith('\ufeff'))
print('Contains engine...:', 'engine...' in check)
print('Contains Setting up...:', 'Setting up...' in check)
print('Contains Scan complete:', 'Scan complete' in check)