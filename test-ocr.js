const http = require('http');
const fs = require('fs');
const path = require('path');

// Generate a test PNG with text using sharp
const sharp = require('sharp');

async function createTestImage() {
  // Create a simple colored image as placeholder test
  const buf = await sharp({
    create: {
      width: 400,
      height: 200,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .png()
  .toBuffer();
  return buf;
}

function req(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(`http://localhost:3003${path}`);
    const h = { Host: 'localhost:3003', ...headers };
    if (body) {
      h['Content-Length'] = Buffer.byteLength(body);
    }
    const r = http.request({ hostname: 'localhost', port: 3003, path: url.pathname, method, headers: h }, (res) => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const imgBuf = await createTestImage();
  const boundary = '----test' + Date.now();

  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.jpg"\r\nContent-Type: image/png\r\n\r\n`,
    imgBuf,
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="id_type"\r\n\r\nmykad\r\n`,
    `--${boundary}--\r\n`,
  ];

  const body = parts.join('');
  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Host': 'localhost:3003',
    'Content-Length': Buffer.byteLength(body),
  };

  const r = await new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3003, path: '/api/verification/ocr', method: 'POST', headers }, (res) => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body); req.end();
  });

  console.log('OCR Status:', r.status);
  console.log('Response:', r.body.substring(0, 400));
}

main().catch(console.error);
