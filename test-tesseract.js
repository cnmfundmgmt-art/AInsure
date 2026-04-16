const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function main() {
  console.log('Starting Tesseract worker...');
  const worker = await createWorker('msa+eng');
  console.log('Worker loaded');

  // Create a test image with some text
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(400, 100);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 400, 100);
  ctx.fillStyle = 'black';
  ctx.font = '20px monospace';
  ctx.fillText('NAMA: TAN AH MEK', 10, 30);
  ctx.fillText('900101-01-1234', 10, 60);
  ctx.fillText('ALAMAT: 1 JALAN BUDI, 50000 KUALA LUMPUR', 10, 90);
  const buf = canvas.toBuffer('image/png');

  console.log('Recognizing...');
  const { data } = await worker.recognize(buf);
  console.log('Result:', data.text.substring(0, 200));
  console.log('Confidence:', data.confidence);
  await worker.terminate();
  console.log('Done');
}

main().catch(e => console.error('Error:', e.message));
