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
  const login = await request('POST', '/api/auth/login', null, {
    email: 'demo@aicontentstudio.com', password: 'Demo123!'
  });
  const token = login.token;

  // Test Plagiarism Check
  console.log('=== PLAGIARISM CHECK ===');
  const plag = await request('POST', '/api/plagiarism', token, {
    title: 'Test Plagiarism',
    content: 'Artificial intelligence is transforming how businesses operate. From automation to insights, AI provides unprecedented opportunities for growth and efficiency. Machine learning models are becoming more sophisticated every day.'
  });
  console.log('Created ID:', plag.id);
  const plagResult = await request('POST', '/api/plagiarism/' + plag.id + '/generate', token);
  console.log('Status:', plagResult.status);
  console.log('Report length:', (plagResult.analysisReport || '').length, 'chars');
  console.log('Originality:', plagResult.originalityScore);
  console.log('Preview:\n', (plagResult.analysisReport || '').substring(0, 400));

  console.log('\n=== PERFORMANCE PREDICTION ===');
  const perf = await request('POST', '/api/performance', token, {
    title: 'Test Performance',
    content: 'Transform your workflow today with AI-powered tools. Join thousands of satisfied customers.',
    contentType: 'social',
    platform: 'twitter'
  });
  console.log('Created ID:', perf.id);
  const perfResult = await request('POST', '/api/performance/' + perf.id + '/generate', token);
  console.log('Status:', perfResult.status);
  console.log('Analysis length:', (perfResult.analysisDetails || '').length, 'chars');
  console.log('Score:', perfResult.predictedScore, '/ Virality:', perfResult.viralityScore);
  console.log('Preview:\n', (perfResult.analysisDetails || '').substring(0, 400));
}

main().catch(console.error);
