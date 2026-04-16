const fs = require('fs');
const c = fs.readFileSync('app/insurance/page.tsx', 'utf8');
const l = c.split('\n');

// Find switch cases and their returns
l.forEach((line, i) => {
  if (line.includes('case ') || (line.trim().startsWith('return') && line.includes('('))) {
    console.log((i+1) + ': ' + line);
  }
});