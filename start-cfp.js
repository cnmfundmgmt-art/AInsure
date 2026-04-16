// start-cfp.js - PM2 wrapper to start Next.js dev server on port 3003
const { spawn } = require('child_process');
const path = require('path');

const child = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3003'], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: false,
  shell: false,
});

child.on('error', (err) => {
  console.error('[PM2] Failed to start Next.js:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
