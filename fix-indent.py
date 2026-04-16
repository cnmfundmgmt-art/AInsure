with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

# Check current state
print('Current double div:')
idx = raw.find(b'Existing Policies')
if idx >= 0:
    snippet = raw[idx-100:idx+300]
    print(repr(snippet[:200]))

# The problematic pattern - 0-space indent outer div with 2-space indent inner content
# We want to change it to 2-space indent outer div with 4-space indent inner content
old = (
    b' <div>\r\n'
    b'  <label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>\r\n'
    b'  {existingPolicies.length > 0 && (\r\n'
    b'  <table'
)
new = (
    b'  <div>\r\n'
    b'    <label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>\r\n'
    b'    {existingPolicies.length > 0 && (\r\n'
    b'    <table'
)

if old in raw:
    raw = raw.replace(old, new, 1)
    print('\nIndentation fixed!')
else:
    print('\nPattern A not found, trying pattern B...')
    # Maybe the outer div has no indent at all
    old2 = (
        b'<div>\r\n'
        b'  <label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>\r\n'
        b'  {existingPolicies.length > 0 && (\r\n'
        b'  <table'
    )
    if old2 in raw:
        raw = raw.replace(old2, new, 1)
        print('Pattern B fixed (no-space outer div)')
    else:
        print('Pattern B not found either')
        # Search for the exact bytes around "Existing Policies"
        idx = raw.find(b'Existing Policies')
        if idx >= 0:
            print('Around Existing Policies:')
            print(repr(raw[idx-80:idx+200]))

# Also fix table indentation (3 spaces to 4 spaces)
old_table = (
    b'  <table className="w-full text-xs mb-2 border border-gray-200 rounded-lg overflow-hidden">\r\n'
    b'  <thead><tr className="bg-gray-50 border-b border-gray-200">\r\n'
    b'  <th className="text-left px-2 py-1 font-medium text-gray-600">Policy Type</th>\r\n'
    b'  <th className="text-left px-2 py-1 font-medium text-gray-600">Sum Assured (RM)</th>\r\n'
    b'  <th className="text-left px-2 py-1 font-medium text-gray-600">Premium (RM/mo)</th>\r\n'
    b'  <th className="w-8"></th>\r\n'
    b'  </tr></thead>\r\n'
    b'  <tbody>{existingPolicies.map((p, i) => (\r\n'
    b'  <tr key={i} className="border-b border-gray-100 last:border-0">\r\n'
    b'  <td className="px-1 py-1">\r\n'
    b'  <select'
)
new_table = (
    b'    <table className="w-full text-xs mb-2 border border-gray-200 rounded-lg overflow-hidden">\r\n'
    b'    <thead><tr className="bg-gray-50 border-b border-gray-200">\r\n'
    b'    <th className="text-left px-2 py-1 font-medium text-gray-600">Policy Type</th>\r\n'
    b'    <th className="text-left px-2 py-1 font-medium text-gray-600">Sum Assured (RM)</th>\r\n'
    b'    <th className="text-left px-2 py-1 font-medium text-gray-600">Premium (RM/mo)</th>\r\n'
    b'    <th className="w-8"></th>\r\n'
    b'    </tr></thead>\r\n'
    b'    <tbody>{existingPolicies.map((p, i) => (\r\n'
    b'    <tr key={i} className="border-b border-gray-100 last:border-0">\r\n'
    b'    <td className="px-1 py-1">\r\n'
    b'    <select'
)
if old_table in raw:
    raw = raw.replace(old_table, new_table)
    print('Table header/body indentation fixed')
else:
    print('Table pattern not found')

# Fix the select/option/td content indentation
# Fix select closing and td/select/tbody/tr/tbody/table indentation
old_closing = b'  </select>\r\n  </td>\r\n  <td className="px-1 py-1">\r\n  <input'
new_closing = b'    </select>\r\n    </td>\r\n    <td className="px-1 py-1">\r\n    <input'
if old_closing in raw:
    raw = raw.replace(old_closing, new_closing)
    print('Select/td/input closing fixed')

old_closing2 = b'  </td>\r\n  <td className="px-1 py-1 text-center">\r\n  <button'
new_closing2 = b'    </td>\r\n    <td className="px-1 py-1 text-center">\r\n    <button'
if old_closing2 in raw:
    raw = raw.replace(old_closing2, new_closing2)
    print('Last td/button closing fixed')

old_tr = b'  </tr>\r\n  ))}\r\n  </tbody>\r\n  </table>\r\n  )}'
new_tr = b'    </tr>\r\n    ))}</tbody>\r\n    </table>\r\n    )}'
if old_tr in raw:
    raw = raw.replace(old_tr, new_tr)
    print('Table closing rows fixed')

old_btn = b'  <button onClick={() => setExistingPolicies([...existingPolicies, { policyType: \'\', sumAssured: 0, premium: 0 }])}\r\n  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">+ Add Policy</button>\r\n </div>'
new_btn = b'    <button onClick={() => setExistingPolicies([...existingPolicies, { policyType: \'\', sumAssured: 0, premium: 0 }])}\r\n    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">+ Add Policy</button>\r\n  </div>'
if old_btn in raw:
    raw = raw.replace(old_btn, new_btn)
    print('Add button fixed')

with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'wb') as f:
    f.write(raw)
print('\nFile written.')
