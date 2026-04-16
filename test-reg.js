const http = require('http');

const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
const bodyParts = [
  `--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\ndbg3@example.com`,
  `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\nTestPass123`,
  `--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n0123456789`,
  `--${boundary}\r\nContent-Disposition: form-data; name="id_type"\r\n\r\nmykad`,
  `--${boundary}\r\nContent-Disposition: form-data; name="role"\r\n\r\nuser`,
  `--${boundary}\r\nContent-Disposition: form-data; name="extracted_data"\r\n\r\n{"fullName":"JOHN WICK","icNumber":"460619-12-5087","dob":"1946-06-19","nationality":"Malaysian"}`,
  `--${boundary}\r\nContent-Disposition: form-data; name="face_data"\r\n\r\n{}`,
  `--${boundary}--`,
].join('\r\n');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/auth/register-with-id',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(bodyParts),
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(bodyParts);
req.end();
