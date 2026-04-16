with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Change state type from string to array
old_state = 'const [existingPolicies, setExistingPolicies] = useState<string>(\'\');'
new_state = 'const [existingPolicies, setExistingPolicies] = useState<Array<{ policyType: string; sumAssured: number; premium: number }>>([]);'
c = c.replace(old_state, new_state)
print('1. State type: FIXED' if old_state not in c else '1. State type: NOT FOUND')

# 2. Replace API payload
old_payload = 'existingPolicies: existingPolicies ? [{ policyName: existingPolicies, lifeCover: 0, ciCover: 0, medicalCover: 0 }] : [],'
new_payload = 'existingPolicies: existingPolicies.length > 0 ? existingPolicies.map(p => ({ policyType: p.policyType, sumAssured: p.sumAssured || 0, premium: p.premium || 0 })) : [],'
c = c.replace(old_payload, new_payload)
print('2. API payload: FIXED' if old_payload not in c else '2. API payload: NOT FOUND')

# 3. Replace the useEffect dependency
old_dep = 'clientGoals, existingPolicies, sessionId]);'
new_dep = 'clientGoals, existingPolicies, sessionId]);'
# No change needed for deps array

# 4. Replace the single input with a table
old_input = '''<div>
<label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>
<input type="text" placeholder="e.g. AIA Life, Great Eastern CI"
value={existingPolicies} onChange={e => setExistingPolicies(e.target.value)}
className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white font-medium text-gray-800" style={{color:"#111827",fontWeight:600}} />
</div>'''

new_table = '''<div>
<label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>
{existingPolicies.length > 0 && (
<table className="w-full text-xs mb-2 border border-gray-200 rounded-lg overflow-hidden">
<thead><tr className="bg-gray-50 border-b border-gray-200">
<th className="text-left px-2 py-1 font-medium text-gray-600">Policy Type</th>
<th className="text-left px-2 py-1 font-medium text-gray-600">Sum Assured (RM)</th>
<th className="text-left px-2 py-1 font-medium text-gray-600">Premium (RM/mo)</th>
<th className="w-8"></th>
</tr></thead>
<tbody>{existingPolicies.map((p, i) => (
<tr key={i} className="border-b border-gray-100 last:border-0">
<td className="px-1 py-1">
<select value={p.policyType} onChange={e => { const updated = [...existingPolicies]; updated[i].policyType = e.target.value; setExistingPolicies(updated); }}
className="w-full border border-gray-200 rounded px-1 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-100" style={{color:"#111827"}}>
<option value="">Select</option>
<option value="Life">Life</option>
<option value="CI">CI</option>
<option value="Medical">Medical</option>
<option value="Savings">Savings</option>
<option value="Others">Others</option>
</select>
</td>
<td className="px-1 py-1">
<input type="number" value={p.sumAssured || ''} onChange={e => { const updated = [...existingPolicies]; updated[i].sumAssured = parseInt(e.target.value) || 0; setExistingPolicies(updated); }}
placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-100" style={{color:"#111827"}} />
</td>
<td className="px-1 py-1">
<input type="number" value={p.premium || ''} onChange={e => { const updated = [...existingPolicies]; updated[i].premium = parseInt(e.target.value) || 0; setExistingPolicies(updated); }}
placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-100" style={{color:"#111827"}} />
</td>
<td className="px-1 py-1 text-center">
<button onClick={() => setExistingPolicies(existingPolicies.filter((_, j) => j !== i))}
className="text-red-400 hover:text-red-600 transition text-xs">✕</button>
</td>
</tr>
))}</tbody>
</table>
)}
<button onClick={() => setExistingPolicies([...existingPolicies, { policyType: '', sumAssured: 0, premium: 0 }])}
className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">+ Add Policy</button>
</div>'''

if old_input in c:
    c = c.replace(old_input, new_table)
    print('3. Table UI: FIXED')
else:
    print('3. Table UI: NOT FOUND - searching...')
    idx = c.find('Existing Policies (optional)')
    if idx > 0:
        print('Found at', idx, ':', repr(c[idx:idx+300]))

with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('\nDone.')
