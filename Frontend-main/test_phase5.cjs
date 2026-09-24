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

// Test through frontend Nginx proxy (port 3000) — NOT directly to Gateway (port 8080)
const HOST = '127.0.0.1';
const PORT = 3000;

async function login(email, password) {
  const res = await request({
    hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });
  if (res.status === 200 && res.body && res.body.token) {
    return { token: res.body.token, headers: { 'Authorization': `Bearer ${res.body.token}`, 'Content-Type': 'application/json' } };
  }
  return null;
}

async function get(path, headers) {
  return request({ hostname: HOST, port: PORT, path, method: 'GET', headers });
}

async function runTests() {
  let pass = 0, fail = 0;
  function check(name, condition) {
    if (condition) { console.log(`  ✅ ${name}`); pass++; }
    else { console.log(`  ❌ ${name}`); fail++; }
  }

  // === 1. Frontend serves HTML ===
  console.log('\n=== FRONTEND SPA ===');
  let html = await get('/', {});
  check('GET / returns 200', html.status === 200);
  check('GET / returns HTML', typeof html.body === 'string' && html.body.includes('<div id="root">'));

  let loginPage = await get('/login', {});
  check('GET /login returns 200 (SPA)', loginPage.status === 200);

  let customerDash = await get('/customer/dashboard', {});
  check('GET /customer/dashboard returns 200 (SPA)', customerDash.status === 200);

  let dealerDash = await get('/dealer/dashboard', {});
  check('GET /dealer/dashboard returns 200 (SPA)', dealerDash.status === 200);

  let adminDash = await get('/admin/dashboard', {});
  check('GET /admin/dashboard returns 200 (SPA)', adminDash.status === 200);

  // === 2. Authentication through Nginx proxy ===
  console.log('\n=== AUTHENTICATION (via port 3000 proxy) ===');
  const admin = await login('admin@bmwtechworks.com', 'Admin@123');
  check('Admin login succeeds', admin !== null);

  const customer = await login('customer1@bmwtechworks.com', 'Customer@123');
  check('Customer login succeeds', customer !== null);

  const dealer = await login('dealer1@bmwtechworks.com', 'Dealer@123');
  check('Dealer login succeeds', dealer !== null);

  let badLogin = await request({
    hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'bad@example.com', password: 'wrong' });
  check('Invalid credentials rejected', badLogin.status === 401 || badLogin.status === 400 || badLogin.status === 500);

  // === 3. API data through Nginx proxy ===
  console.log('\n=== API DATA (via port 3000 proxy) ===');
  if (admin) {
    let vehicles = await get('/api/vehicles', admin.headers);
    check('Admin GET /api/vehicles -> 200', vehicles.status === 200);
    check('Admin vehicles is array', Array.isArray(vehicles.body));

    let orders = await get('/api/v1/orders', admin.headers);
    check('Admin GET /api/v1/orders -> 200', orders.status === 200);
    check('Admin orders is array', Array.isArray(orders.body));

    let appointments = await get('/api/appointments', admin.headers);
    check('Admin GET /api/appointments -> 200', appointments.status === 200);

    let users = await get('/api/users', admin.headers);
    check('Admin GET /api/users -> 200', users.status === 200);

    let customers = await get('/api/v1/customers', admin.headers);
    check('Admin GET /api/v1/customers -> 200', customers.status === 200);

    let dealers = await get('/dealers', admin.headers);
    check('Admin GET /dealers -> 200', dealers.status === 200);
  }

  if (customer) {
    let custOrders = await get('/api/v1/orders', customer.headers);
    check('Customer GET /api/v1/orders -> 200', custOrders.status === 200);
    check('Customer orders is array', Array.isArray(custOrders.body));

    let custAppts = await get('/api/appointments', customer.headers);
    check('Customer GET /api/appointments -> 200', custAppts.status === 200);

    let custVehicles = await get('/api/vehicles', customer.headers);
    check('Customer GET /api/vehicles -> 200', custVehicles.status === 200);
  }

  if (dealer) {
    let dealerOrders = await get('/api/v1/orders', dealer.headers);
    check('Dealer GET /api/v1/orders -> 200', dealerOrders.status === 200);

    let dealerAppts = await get('/api/appointments', dealer.headers);
    check('Dealer GET /api/appointments -> 200', dealerAppts.status === 200);
  }

  // === 1. Register a new customer ===
  console.log('\n=== CUSTOMER REGISTRATION ===');
  const testEmail = `testcustomer_${Date.now()}@example.com`;
  const registerRes = await request({
    hostname: HOST, port: PORT, path: '/api/users', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: `testcustomer_${Date.now()}`,
    name: 'Test Customer',
    email: testEmail,
    password: 'Test@12345',
    role: 'ADMIN' // Malicious request trying to be ADMIN
  });
  check('Registration succeeds', registerRes.status === 201);
  check('Registration returns correct email', registerRes.body && registerRes.body.email === testEmail);
  
  // Login with new customer
  const newCustomer = await login(testEmail, 'Test@12345');
  check('Login succeeds for new customer', newCustomer !== null);

  // Check role is CUSTOMER, not ADMIN
  let me = await get('/api/users/me', newCustomer.headers);
  check('GET /api/users/me succeeds', me.status === 200);
  check('Security: Role was forced to CUSTOMER', me.body && me.body.role === 'CUSTOMER');

  // Verify dashboard data is real
  console.log('\n=== DASHBOARD & CATALOG ===');
  let vehicles = await get('/api/vehicles', newCustomer.headers);
  check('Dashboard GET /api/vehicles succeeds', vehicles.status === 200);
  check('Dashboard vehicles is array', Array.isArray(vehicles.body) || Array.isArray(vehicles.body?.content));

  let dealers = await get('/dealers', newCustomer.headers);
  check('Dashboard GET /dealers succeeds', dealers.status === 200);
  check('Dealers list contains 5 records', (Array.isArray(dealers.body) ? dealers.body : dealers.body?.content).length === 5);

  // Order Creation
  console.log('\n=== ORDER CREATION ===');
  let vehicleId = Array.isArray(vehicles.body) ? vehicles.body[0].vehicleId : vehicles.body.content[0].vehicleId;
  let dealerId = Array.isArray(dealers.body) ? dealers.body[0].dealerId : dealers.body.content[0].dealerId;
  
  let orderRes = await request({
    hostname: HOST, port: PORT, path: '/api/v1/orders', method: 'POST',
    headers: newCustomer.headers
  }, {
    customerId: me.body.id,
    vehicleId: vehicleId,
    dealerId: dealerId,
    status: 'PENDING',
    totalAmount: 50000
  });
  check('Order creation succeeds', orderRes.status === 201);

  let orders = await get('/api/v1/orders', newCustomer.headers);
  check('Order appears in My Orders', orders.status === 200 && Array.isArray(orders.body) && orders.body.length > 0);

  // Profile verification
  console.log('\n=== PROFILE VERIFICATION ===');
  let profile = await get('/api/v1/customers/me', newCustomer.headers);
  check('GET /api/v1/customers/me succeeds', profile.status === 200);
  
  if (profile.status === 200 && profile.body) {
    let putProfile = await request({
      hostname: HOST, port: PORT, path: `/api/v1/customers/${profile.body.id}`, method: 'PUT',
      headers: newCustomer.headers
    }, {
      name: 'Test Customer Updated',
      phone: '1234567890',
      email: testEmail
    });
    check('PUT /api/v1/customers/{id} succeeds', putProfile.status === 200 || putProfile.status === 204 || putProfile.status === 201);

    // Verify it changed
    let updatedProfile = await get('/api/v1/customers/me', newCustomer.headers);
    check('Profile was updated', updatedProfile.body && updatedProfile.body.phone === '1234567890');
  }

  // === Summary ===
  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(err => { console.error(err); process.exit(1); });
