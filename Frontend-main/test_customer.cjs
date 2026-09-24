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

async function runCustomerTest() {
  console.log('--- CUSTOMER WORKFLOW ---');
  const loginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'customer1@bmwtechworks.com', password: 'Customer@123' });
  
  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('Login failed', loginRes);
    return;
  }
  const token = loginRes.body.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  // 1. Dashboard: /api/v1/orders
  let ordersRes = await request({ hostname: 'localhost', port: 8080, path: '/api/v1/orders', method: 'GET', headers });
  console.log('1. /api/v1/orders:', ordersRes.status, typeof ordersRes.body, Array.isArray(ordersRes.body) ? ordersRes.body.length + ' items' : '');
  
  // 1b. Dashboard: /api/appointments
  let apptRes = await request({ hostname: 'localhost', port: 8080, path: '/api/appointments', method: 'GET', headers });
  console.log('1b. /api/appointments:', apptRes.status, typeof apptRes.body, Array.isArray(apptRes.body) ? apptRes.body.length + ' items' : '');

  // 2. Vehicles: /api/vehicles
  let vehiclesRes = await request({ hostname: 'localhost', port: 8080, path: '/api/vehicles', method: 'GET', headers });
  console.log('2. /api/vehicles:', vehiclesRes.status, Array.isArray(vehiclesRes.body) ? vehiclesRes.body.length + ' vehicles' : vehiclesRes.body);
  
  let firstVehicle = Array.isArray(vehiclesRes.body) ? vehiclesRes.body[0] : null;
  if (firstVehicle) {
    // 3. Vehicle Details
    let vDetailRes = await request({ hostname: 'localhost', port: 8080, path: `/api/vehicles/${firstVehicle.id}`, method: 'GET', headers });
    console.log(`3. /api/vehicles/${firstVehicle.id}:`, vDetailRes.status, vDetailRes.body.id);
  }

  // 4. Create Order
  if (firstVehicle) {
    let newOrder = {
       customerId: '6683e0c9-cf0e-4963-acae-12020540b8ba', // customer1 id
       vehicleId: firstVehicle.id,
       dealerId: firstVehicle.dealerId || '00c22be3-7bdf-4bb7-ab4a-0fb77d2fe83f', // fake if none
       orderDate: new Date().toISOString().split('T')[0],
       status: 'PENDING',
       totalAmount: firstVehicle.price || 50000,
       paymentStatus: 'PENDING',
       paymentMethod: 'CREDIT_CARD'
    };
    console.log('Creating order with:', newOrder);
    let createOrderRes = await request({ hostname: 'localhost', port: 8080, path: '/api/v1/orders', method: 'POST', headers }, newOrder);
    console.log('4. Create Order /api/v1/orders:', createOrderRes.status, createOrderRes.body);
  }
}

runCustomerTest();
