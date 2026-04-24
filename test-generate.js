const http = require('http');

function request(method, path, token, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: 'localhost', port: 5001, path, method, headers }, res => {
      let rbody = '';
      res.on('data', d => rbody += d);
      res.on('end', () => {
        try { resolve(JSON.parse(rbody)); } catch(e) { resolve(rbody); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login
  const login = await request('POST', '/api/auth/login', null, {
    email: 'demo@aicontentstudio.com',
    password: 'Demo123!'
  });
  console.log('Login:', login.token ? 'OK' : 'FAILED');
  const token = login.token;

  // Create calendar item
  const item = await request('POST', '/api/calendar', token, {
    title: 'Test AI Generation',
    contentType: 'blog',
    scheduledDate: '2024-06-01',
    platform: 'website',
    topic: 'AI in marketing'
  });
  console.log('Created ID:', item.id);

  // Generate AI content
  console.log('Generating... (this takes ~10s)');
  const result = await request('POST', '/api/calendar/' + item.id + '/generate', token);
  console.log('Status:', result.status);
  console.log('Content length:', (result.content || '').length, 'chars');
  console.log('Content preview:\n', (result.content || '').substring(0, 500));
  console.log('---');
  console.log('contentBrief:', result.contentBrief ? result.contentBrief.substring(0, 100) + '...' : 'NULL');
  console.log('keyPoints:', result.keyPoints ? 'SET' : 'NULL');
  console.log('suggestedHashtags:', result.suggestedHashtags ? 'SET' : 'NULL');
}

main().catch(console.error);
