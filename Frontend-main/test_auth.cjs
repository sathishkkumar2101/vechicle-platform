const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin(email, password) {
  console.log(`Testing login for ${email}...`);
  const loginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });
  
  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error(`Login failed for ${email}:`, loginRes);
    return;
  }
  
  const token = loginRes.body.token;
  console.log(`Token received for ${email}.`);
  
  const meRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log(`User Profile for ${email}:`, meRes.status, meRes.body);
  console.log('---');
}

async function run() {
  await testLogin('admin@bmwtechworks.com', 'Admin@123');
  await testLogin('dealer1@bmwtechworks.com', 'Dealer@123');
  await testLogin('customer1@bmwtechworks.com', 'Customer@123');
}

run();
