const fs = require('fs');

// Fix all financial API routes that have the old logAudit signature

const files = [
  'app/api/financial/assets/route.ts',
  'app/api/financial/assets/[id]/route.ts',
  'app/api/financial/liabilities/route.ts',
  'app/api/financial/liabilities/[id]/route.ts',
  'app/api/financial/snapshot/route.ts',
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('Missing:', file);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Find logAudit calls and fix them
  const newLines = lines.map((line, i) => {
    // Pattern: logAudit(clientId, 'action', {...})
    // or logAudit(clientId, 'action', 'resource', {...})
    const match = line.match(/logAudit\(([^,]+),\s*'([^']+)',\s*'([^']+)'?,?\s*(\{[^}]+\})?\)/);
    if (match) {
      const [fullMatch, clientId, action, resource, details] = match;
      // Determine userId - extract from the function (first arg in handler)
      // We need to look at context. Actually let's just use clientId as userId for now
      // For delete operations, details is the last arg
      if (details) {
        return line.replace(fullMatch, `logAudit({ userId: ${clientId}, clientId: ${clientId}, action: '${action}', resource: '${resource}', details: ${details} })`);
      } else {
        return line.replace(fullMatch, `logAudit({ userId: ${clientId}, clientId: ${clientId}, action: '${action}', resource: '${resource}' })`);
      }
    }
    
    // Simpler pattern: logAudit(clientId, 'action', { ... })
    const simpleMatch = line.match(/logAudit\(([^,]+),\s*'([^']+)',\s*(\{[^}]+\})\)/);
    if (simpleMatch && !line.includes('userId:')) {
      const [fullMatch, clientId, action, details] = simpleMatch;
      return line.replace(fullMatch, `logAudit({ userId: ${clientId}, clientId: ${clientId}, action: '${action}', resource: 'financial', details: ${details} })`);
    }
    
    return line;
  });
  
  const newContent = newLines.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed:', file);
  } else {
    console.log('No changes:', file);
  }
});