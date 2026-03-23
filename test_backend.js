async function runTests() {
  try {
    console.log('--- Testing User Login ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(loginData)}`);
    console.log('Login successful:', loginData.user.email);
    const token = loginData.token;

    console.log('--- Testing Get Services ---');
    const servicesRes = await fetch('http://localhost:5000/api/services');
    const servicesData = await servicesRes.json();
    console.log(`Found ${servicesData.count} services.`);

    if (servicesData.count > 0) {
      const providerId = servicesData.data[0].provider._id || servicesData.data[0].provider;
      console.log('--- Testing Create Review ---');
      const reviewRes = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          providerId: providerId,
          rating: 5,
          comment: 'Great service!'
        })
      });
      const reviewData = await reviewRes.json();
      console.log('Review response:', reviewRes.status, reviewData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runTests();
