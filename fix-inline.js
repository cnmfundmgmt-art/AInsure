const fs = require('fs');
const lines = fs.readFileSync('app/insurance/page.tsx', 'utf8').split('\n');

// Change line 925 to put <div on the same line as the (
lines[924] = ' const getLeftSidebar = () => (<div className="space-y-3">);';

fs.writeFileSync('app/insurance/page.tsx', lines.join('\n'));
console.log('Done');