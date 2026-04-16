content = open('app/insurance/SidebarContent.tsx', 'r', encoding='utf-8').read()
# Replace UTF-8 smart quotes / special chars that got garbled
content = content.replace('\u201c', '"').replace('\u201d', '"')
content = content.replace('\u2018', "'").replace('\u2019', "'")
content = content.replace('\u2026', '...')
content = content.replace('\u2014', '-')
open('app/insurance/SidebarContent.tsx', 'w', encoding='utf-8').write(content)
print('done')