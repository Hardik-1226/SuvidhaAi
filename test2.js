async function run() {
  try {
    console.log('1. Login as Provider');
    let res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'raj@provider.com', password: 'password123'})
    });
    let data = await res.json();
    const providerToken = data.token;

    console.log('2. Create Service');
    res = await fetch('http://localhost:5000/api/services', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${providerToken}`},
      body: JSON.stringify({
        title: 'New Service', category: 'plumber', description: 'Test', price: 100, priceType: 'hourly',
        location: {type: 'Point', coordinates: [77.2, 28.6]}
      })
    });
    data = await res.json();
    const serviceId = data.data._id;
    console.log('Created service ID:', serviceId);

    console.log('3. Login as User');
    res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'alice@example.com', password: 'password123'})
    });
    data = await res.json();
    const userToken = data.token;

    console.log('4. Book Service');
    res = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`},
      body: JSON.stringify({
        serviceId, scheduledAt: new Date(Date.now() + 86400000).toISOString(), duration: 2,
        address: '123 Test St', notes: '', paymentMethod: 'cash'
      })
    });
    data = await res.json();
    console.log('Booking Result:', res.status, data);

  } catch (err) { console.error('Error:', err); }
}
run();
