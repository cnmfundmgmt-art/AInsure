const http = require('http');

const data = JSON.stringify({
  client: { age: 35, gender: 'male', income: 60000, monthlyBudget: 300 },
  query: 'test'
});

const req = http.request({
  hostname: 'localhost',
  port: 3003,
  path: '/api/insurance/recommend',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', console.error);
req.write(data);
req.end();