with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'rb') as f:
    raw = f.read()

data = raw.decode('utf-8', errors='replace')

# --- STEP 1: Fix the existingPolicies state type (was string, needs array) ---
old_state = "const [existingPolicies, setExistingPolicies] = useState<string>('');"
new_state = "const [existingPolicies, setExistingPolicies] = useState<Array<{ policyType: string; sumAssured: number; premium: number }>>([]);"
data = data.replace(old_state, new_state, 1)

# --- STEP 2: Fix the API payload to use the new array format ---
old_payload = "existingPolicies: existingPolicies ? [{ policyName: existingPolicies, lifeCover: 0, ciCover: 0, medicalCover: 0 }] : [],"
new_payload = "existingPolicies: existingPolicies.length > 0 ? existingPolicies.map(p => ({ policyType: p.policyType, sumAssured: p.sumAssured || 0, premium: p.premium || 0 })) : [],"
data = data.replace(old_payload, new_payload)

# --- STEP 3: Find and replace the existingPolicies input with the new table ---
# The input to find (exact text from the file):
old_input = """          <div>
            <label className="text-xs text-gray-600 mb-1 block">Existing Policies (optional)</label>
            <input type="text" placeholder="e.g. AIA Life, Great Eastern CI"
              value={existingPolicies} onChange={e => setExistingPolicies(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white font-medium text-gray-800" style={{color:"#111827",fontWeight:600}} />
          </div>"""

new_table = """          <div>
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
              <tr key={i} className="border-b border-gray-100">
                <td className="px-1 py-1">
                  <select value={p.policyType} onChange={e => { const updated = [...existingPolicies]; updated[i].policyType = e.target.value; setExistingPolicies(updated); }} className="w-full border border-gray-200 rounded px-1 py-1 bg-white focus:outline-none" style={{color:"#111827"}}>
                    <option value="">Select</option>
                    <option value="Life">Life</option>
                    <option value="CI">CI</option>
                    <option value="Medical">Medical</option>
                    <option value="Savings">Savings</option>
                    <option value="Others">Others</option>
                  </select>
                </td>
                <td className="px-1 py-1">
                  <input type="number" value={p.sumAssured || ""} onChange={e => { const updated = [...existingPolicies]; updated[i].sumAssured = parseInt(e.target.value) || 0; setExistingPolicies(updated); }} placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none" style={{color:"#111827"}} />
                </td>
                <td className="px-1 py-1">
                  <input type="number" value={p.premium || ""} onChange={e => { const updated = [...existingPolicies]; updated[i].premium = parseInt(e.target.value) || 0; setExistingPolicies(updated); }} placeholder="0" className="w-full border border-gray-200 rounded px-1 py-1 focus:outline-none" style={{color:"#111827"}} />
                </td>
                <td className="px-1 py-1 text-center">
                  <button onClick={() => setExistingPolicies(existingPolicies.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">X</button>
                </td>
              </tr>
            ))}</tbody>
            </table>
            )}
            <button onClick={() => setExistingPolicies([...existingPolicies, { policyType: "", sumAssured: 0, premium: 0 }])} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add Policy</button>
          </div>"""

if old_input in data:
    data = data.replace(old_input, new_table)
    print("Table UI: REPLACED")
else:
    print("Table UI: NOT FOUND - searching...")
    idx = data.find('Existing Policies (optional)')
    if idx >= 0:
        print(f"Found at char {idx}: {repr(data[idx-50:idx+400])}")
    else:
        print("Text NOT FOUND at all")

# Count template literals to check balance
backticks = data.count('`')
print(f"Backticks in file: {backticks} (should be even)")

with open('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'w', encoding='utf-8') as f:
    f.write(data)

print("Done.")
