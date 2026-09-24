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

const customer1 = { email: 'customer1@bmwtechworks.com', password: 'Customer@123', id: '6683e0c9-cf0e-4963-acae-12020540b8ba' };
const customer2Id = '27aee71f-5655-40c5-a7e8-1bf2ec5752bc'; // Fake customer
const dealer1 = { email: 'dealer1@bmwtechworks.com', password: 'Dealer@123', id: '00f89c8f-34e1-4dad-bbb4-8857ddd155e1' };
const admin = { email: 'admin@bmwtechworks.com', password: 'Admin@123', id: 'f0da20b4-bcd6-4947-96ff-fa2070bfd33c' };

async function login(user) {
  const res = await request({
    hostname: '127.0.0.1', port: 8080, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: user.email, password: user.password });
  if (res.status === 200 && res.body.token) {
    user.token = res.body.token;
    user.headers = { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' };
  } else {
    console.error('Failed to login', user.email, res.status, res.body);
  }
}

async function runTests() {
  await login(customer1);
  await login(dealer1);
  await login(admin);

  console.log('\n--- 1. Order IDOR ---');
  let dummyOrderId = '10111111-1111-4111-8111-111111111111';
  let oIDOR_C1 = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/v1/orders/${dummyOrderId}`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER A GET Order IDOR ->', oIDOR_C1.status); 

  console.log('\n--- 2. Implicit Order Filtering (Frontend calls /api/v1/orders) ---');
  let iC = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/v1/orders`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER GET /api/v1/orders ->', iC.status, Array.isArray(iC.body) ? 'Array' : 'Not Array');
  
  let iD = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/v1/orders`, method: 'GET', headers: dealer1.headers });
  console.log('DEALER   GET /api/v1/orders ->', iD.status, Array.isArray(iD.body) ? 'Array' : 'Not Array');

  let iA = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/v1/orders`, method: 'GET', headers: admin.headers });
  console.log('ADMIN    GET /api/v1/orders ->', iA.status, Array.isArray(iA.body) ? 'Array' : 'Not Array');

  console.log('\n--- 3. Implicit Appointment Filtering (Frontend calls /api/appointments) ---');
  let aC = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/appointments`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER GET /api/appointments ->', aC.status, Array.isArray(aC.body) ? 'Array' : 'Not Array');
  
  let aD = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/appointments`, method: 'GET', headers: dealer1.headers });
  console.log('DEALER   GET /api/appointments ->', aD.status, Array.isArray(aD.body) ? 'Array' : 'Not Array');

  let aA = await request({ hostname: '127.0.0.1', port: 8080, path: `/api/appointments`, method: 'GET', headers: admin.headers });
  console.log('ADMIN    GET /api/appointments ->', aA.status, Array.isArray(aA.body) ? 'Array' : 'Not Array');
}

runTests();
