with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with 'Existing Policies (optional)'
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if 'Existing Policies (optional)' in line:
        start_idx = i
    if start_idx is not None and '</div>' in line and line.strip() == '</div>':
        # This closes the inner div
        if end_idx is None:
            end_idx = i
            break

print(f'Found at lines {start_idx+1} to {end_idx+1}')
print('Lines:')
for j in range(max(0, start_idx-1), min(len(lines), end_idx+2)):
    print(f'  {j+1}: {repr(lines[j])}')

# The new table block - note: start_idx is the <div> line BEFORE the label
# Actually looking at the output, lines 1000 is <div> and 1001 is label
# start_idx = 999 (0-indexed)
# end_idx = 1004 (0-indexed) which is </div>
# But we want to replace from the <div> before the label through the second </div>
# Looking at output: lines 1000-<div>, 1001-label, 1002-input, 1003-input/>, 1004-</div>, 1005-</div>
# So lines 999-1005 (0-indexed) need replacement

# Replace lines start_idx through end_idx+1 (the inner div closing) and the trailing </div>
new_block_lines = [
    ' <div>\n',
    '  <label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>\n',
    '  {existingPolicies.length > 0 && (\n',
    '  <table className="w-full text-xs mb-2 border border-gray-200 rounded-lg overflow-hidden">\n',
    '  <thead><tr className="bg-gray-50 border-b border-gray-200">\n',
    '  <th className="text-left px-2 py-1 font-medium text-gray-600">Policy Type</th>\n',
    '  <th className="text-left px-2 py-1 font-medium text-gray-600">Sum Assured (RM)</th>\n',
    '  <th className="text-left px-2 py-1 font-medium text-gray-600">Premium (RM/mo)</th>\n',
    '  <th className="w-8"></th>\n',
    '  </tr></thead>\n',
    '  <tbody>{existingPolicies.map((p, i) => (\n',
    '  <tr key={i} className="border-b border-gray-100 last:border-0">\n',
    '  <td className="px-1 py-1">\n',
    '  <select value={p.policyType} onChange={e => { const updated = [...existingPolicies]; updated[i].policyType = e.target.value; setExistingPolicies(updated); }}\n',
    '  className="w-full border border-gray-200 rounded px-1 py-1 bg-white focus:outline-none" style={{color:"#111827"}}>\n',
    '  <option value="">Select</option>\n',
    '  <option value="Life">Life</option>\n',
    '  <option value="CI">CI</option>\n',
    '  <option value="Medical">Medical</option>\n',
    '  <option value="Savings">Savings</option>\n',
    '  <option value="Others">Others</option>\n',
    '  </select>\n',
    '  </td>\n',
    '  <td className="px-1 py-1">\n',
    '  <input type="number" value={p.sumAssured || \'\'} onChange={e => { const updated = [...existingPolicies]; updated[i].sumAssured = parseInt(e.target.value) || 0; setExistingPolicies(updated); }}\n',
    '  placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none" style={{color:"#111827"}} />\n',
    '  </td>\n',
    '  <td className="px-1 py-1">\n',
    '  <input type="number" value={p.premium || \'\'} onChange={e => { const updated = [...existingPolicies]; updated[i].premium = parseInt(e.target.value) || 0; setExistingPolicies(updated); }}\n',
    '  placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none" style={{color:"#111827"}} />\n',
    '  </td>\n',
    '  <td className="px-1 py-1 text-center">\n',
    '  <button onClick={() => setExistingPolicies(existingPolicies.filter((_, j) => j !== i))}\n',
    '  className="text-red-400 hover:text-red-600 transition text-xs">✕</button>\n',
    '  </td>\n',
    '  </tr>\n',
    '  ))}</tbody>\n',
    '  </table>\n',
    '  )}\n',
    '  <button onClick={() => setExistingPolicies([...existingPolicies, { policyType: \'\', sumAssured: 0, premium: 0 }])}\n',
    '  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">+ Add Policy</button>\n',
    ' </div>\n',
]

# Replace lines start_idx through end_idx+2 (0-indexed, inclusive)
# start_idx = inner <div>, end_idx = inner </div>
# We need to also include the trailing </div> (line end_idx+1)
print(f'\nReplacing lines {start_idx+1} to {end_idx+2}')
new_lines = lines[:start_idx] + new_block_lines + lines[end_idx+2:]
with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done.')
