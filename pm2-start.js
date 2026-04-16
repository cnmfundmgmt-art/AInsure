// pm2-start.js - PM2 wrapper for CFP Malaysia Next.js dev server
// Note: Must run from project directory so __dirname resolves correctly
const path = require('path');
const { spawn } = require('child_process');

// Force cwd to project root
const PROJECT_ROOT = path.join(__dirname);
process.chdir(PROJECT_ROOT);

// Build environment with Tesseract OCR path
const tesseractDir = 'C:\\Program Files\\Tesseract-OCR';
const env = {
  ...process.env,
  PATH: `${tesseractDir};${process.env.PATH}`,
  TESSDATA_PREFIX: tesseractDir,
};

const script = path.join(PROJECT_ROOT, 'node_modules/next/dist/bin/next');
const args = ['dev', '-p', '3003'];
const opts = { cwd: PROJECT_ROOT, stdio: 'inherit', shell: false, env };

const child = spawn('node', [script, ...args], opts);

child.on('error', (err) => {
  console.error('[PM2] CFP Malaysia failed to start:', err.message);
  process.exit(1);
});
child.on('exit', (code) => process.exit(code || 0));
