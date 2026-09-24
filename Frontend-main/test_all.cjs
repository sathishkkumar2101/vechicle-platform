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
const customer2Id = '27aee71f-5655-40c5-a7e8-1bf2ec5752bc';
const dealer1 = { email: 'dealer1@bmwtechworks.com', password: 'Dealer@123', id: '00f89c8f-34e1-4dad-bbb4-8857ddd155e1' };
const admin = { email: 'admin@bmwtechworks.com', password: 'Admin@123', id: 'f0da20b4-bcd6-4947-96ff-fa2070bfd33c' };

async function login(user) {
  const res = await request({
    hostname: 'localhost', port: 8080, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: user.email, password: user.password });
  if (res.status === 200 && res.body.token) {
    user.token = res.body.token;
    user.headers = { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' };
  } else {
    console.error('Failed to login', user.email, res);
  }
}

async function runTests() {
  await login(customer1);
  await login(dealer1);
  await login(admin);

  console.log('\n--- VEHICLES ---');
  let vC = await request({ hostname: 'localhost', port: 8080, path: '/api/vehicles', method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER GET /api/vehicles ->', vC.status);
  let vD = await request({ hostname: 'localhost', port: 8080, path: '/api/vehicles', method: 'GET', headers: dealer1.headers });
  console.log('DEALER   GET /api/vehicles ->', vD.status);
  let vA = await request({ hostname: 'localhost', port: 8080, path: '/api/vehicles', method: 'GET', headers: admin.headers });
  console.log('ADMIN    GET /api/vehicles ->', vA.status);

  console.log('\n--- CUSTOMER ORDERS ---');
  let oC1 = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/orders/customers/${customer1.id}`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER A GET /api/v1/orders/customers/A ->', oC1.status);
  let oC2 = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/orders/customers/${customer2Id}`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER A GET /api/v1/orders/customers/B ->', oC2.status);
  let oA = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/orders/customers/${customer1.id}`, method: 'GET', headers: admin.headers });
  console.log('ADMIN GET /api/v1/orders/customers/A      ->', oA.status);

  console.log('\n--- CUSTOMER APPOINTMENTS ---');
  let aC1 = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/customers/${customer1.id}`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER A GET /api/appointments/customers/A ->', aC1.status);
  let aC2 = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/customers/${customer2Id}`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER A GET /api/appointments/customers/B ->', aC2.status);
  let aA = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/customers/${customer1.id}`, method: 'GET', headers: admin.headers });
  console.log('ADMIN GET /api/appointments/customers/A      ->', aA.status);

  console.log('\n--- DEALER APPOINTMENTS ---');
  let adD1 = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/dealers/${dealer1.id}`, method: 'GET', headers: dealer1.headers });
  console.log('DEALER A GET /api/appointments/dealers/A ->', adD1.status);
  let fakeDealer = '00c22be3-7bdf-4bb7-ab4a-0fb77d2fe83f'; // admin dealer id? actually it's just some UUID
  let adD2 = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/dealers/${fakeDealer}`, method: 'GET', headers: dealer1.headers });
  console.log('DEALER A GET /api/appointments/dealers/B ->', adD2.status);
  let adA = await request({ hostname: 'localhost', port: 8080, path: `/api/appointments/dealers/${dealer1.id}`, method: 'GET', headers: admin.headers });
  console.log('ADMIN GET /api/appointments/dealers/A    ->', adA.status);

  console.log('\n--- CUSTOMER LIST ---');
  let clA = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/customers`, method: 'GET', headers: admin.headers });
  console.log('ADMIN  GET /api/v1/customers ->', clA.status);
  let clD = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/customers`, method: 'GET', headers: dealer1.headers });
  console.log('DEALER GET /api/v1/customers ->', clD.status);
  let clC = await request({ hostname: 'localhost', port: 8080, path: `/api/v1/customers`, method: 'GET', headers: customer1.headers });
  console.log('CUSTOMER GET /api/v1/customers ->', clC.status);
}

runTests();
