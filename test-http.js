const http = require('http');
const url = 'http://localhost:3003/insurance';
console.log('Testing:', url);
http.get(url, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Body length:', body.length);
    console.log('Has h1:', body.includes('<h1>'));
    console.log('Has Insurance CFP:', body.includes('Insurance CFP'));
    console.log('Has page loaded:', body.includes('Page loaded'));
    console.log('Content:', body.substring(0, 500));
  });
}).on('error', (e) => console.error('Error:', e.message));