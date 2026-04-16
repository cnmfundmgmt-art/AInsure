content = open(r'C:\Users\000\.openclaw\workspace\cfp-malaysia\app\insurance\SidebarContent.tsx', 'r', encoding='utf-8').read()
# Fix encoding garble from cp1252 misinterpretation of UTF-8 smart quotes
garbled = [
    ('\u201c', '\u201d'),  # " " RIGHT DOUBLE QUOTATION MARK
    # These appear as latin-1 bytes after UTF-8 was decoded as cp1252
]
# Replace the garbled sequences we see in the file
content = content.replace('\ufffd', '')
content = content.replace('â€"', '"').replace('â€', '"').replace('â€"', '"')
content = content.replace('â€', "'").replace('â€"', "'")
content = content.replace('â€"', '…').replace('â€', '–').replace('â€" ', '"')
count = content.count('')
print(f'Remaining replacement chars: {count}')
open(r'C:\Users\000\.openclaw\workspace\cfp-malaysia\app\insurance\SidebarContent.tsx', 'w', encoding='utf-8').write(content)
print('done')