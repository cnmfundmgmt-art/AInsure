const https = require('https');
const body = JSON.stringify({
  model: 'MiniMax-M2.7',
  max_tokens: 500,
  system: 'You are a CFP advisor. When given a client profile, respond ONLY with a JSON object with this structure: {"summary":"...","recommendations":[],"concerns":[],"nextSteps":[]}. No text outside the JSON. Be concise.',
  messages: [{role: 'user', content: 'Client: 45 year old male, RM60000/year income, 2 dependents, monthly budget RM500, goal: family protection. Give ONLY JSON.'}]
});
const options = {
  hostname: 'api.minimax.io', port: 443, path: '/anthropic/v1/messages', method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-cp-XIWeMurDRfZA2SXgt7CwptnpLMdnIle-snXdR-gT_QWRq1acFTIvJnK-ufIlseUe4T72cwx6Q4yUYcOeKHsPysDO9AELA0Qtj-t-BhIIewLD16p-KYeBeFk',
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-UX': 'true',
    'Content-Length': Buffer.byteLength(body)
  }
};
const req = https.request(options, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => {
    const parsed = JSON.parse(d);
    console.log('Response:', JSON.stringify(parsed, null, 2).substring(0, 2000));
  });
});
req.on('error', e => console.error(e.message));
req.write(body); req.end();