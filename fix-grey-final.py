with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix 1: Full Name / IC Number map inputs - these have text-xs but NO text color class
old = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"'
new = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300" style={{color:"#111827",fontWeight:500}}'
if old in c:
    c = c.replace(old, new)
    print('Fix 1: Full Name/IC inputs - FIXED')
else:
    print('Fix 1: NOT found')

# Fix 2: Age input
old2 = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="Auto/Manual"'
new2 = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300" placeholder="Auto/Manual" style={{color:"#111827",fontWeight:500}}'
if old2 in c:
    c = c.replace(old2, new2)
    print('Fix 2: Age input - FIXED')
else:
    print('Fix 2: NOT found')

# Fix 3: Gender select
old3 = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white">'
new3 = 'className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white" style={{color:"#111827",fontWeight:500}}>'
if old3 in c:
    c = c.replace(old3, new3)
    print('Fix 3: Gender select - FIXED')
else:
    print('Fix 3: NOT found')

# Fix 4: The larger income input that was already styled but with wrong pattern
old4 = 'className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition font-semibold text-gray-800" style={{color:"#111827",fontWeight:700}}'
new4 = 'className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" style={{color:"#111827",fontWeight:700}}'
if old4 in c:
    c = c.replace(old4, new4)
    print('Fix 4: Income input - FIXED (cleaned up)')
else:
    print('Fix 4: already clean or different')

print('\nVerification:')
print('style={{color occurrences:', c.count('style={{color'))

with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('File written.')
