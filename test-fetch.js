const FormData = require('form-data');
const http = require('http');

const fd = new FormData();
fd.append('email', 'dbg4@example.com');
fd.append('password', 'TestPass123');
fd.append('phone', '0123456789');
fd.append('id_type', 'mykad');
fd.append('role', 'user');
fd.append('extracted_data', JSON.stringify({
  fullName: 'JOHN WICK',
  icNumber: '460619-12-5087',
  dob: '1946-06-19',
  nationality: 'Malaysian',
  gender: 'male',
  age: 79,
  address: 'KUALA LUMPUR',
}));
fd.append('face_data', JSON.stringify({}));

const buf = fd.getBuffer();
const req = http.request({
  hostname: 'localhost',
  port: 3003,
  path: '/api/auth/register-with-id',
  method: 'POST',
  headers: {
    ...fd.getHeaders(),
    'Content-Length': buf.length,
  }
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});
req.on('error', (e) => console.error(e));
req.write(buf);
req.end();
