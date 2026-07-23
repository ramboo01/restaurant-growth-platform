const {
  app,
  request,
  registerAndLogin,
  createRestaurant,
  assignUserToRestaurant,
  cleanupTestData
} = require('./testUtils');

describe('Reports API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Sales, Menu, Staff reports', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Report Owner' });
    const restaurantResponse = await createRestaurant(auth.token, {
      name: `Integration Report Restaurant ${Date.now()}`
    });
    const restaurantId = restaurantResponse.body.data.restaurant.id;

    await assignUserToRestaurant(auth.user.id, restaurantId);

    const refreshedAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: auth.email, password: auth.password });
    const token = refreshedAuth.body.data.token;

    const salesResponse = await request(app)
      .get('/api/reports/sales')
      .set('Authorization', `Bearer ${token}`)
      .query({ restaurantId });

    const menuResponse = await request(app)
      .get('/api/reports/menu')
      .set('Authorization', `Bearer ${token}`)
      .query({ restaurantId });

    const staffResponse = await request(app)
      .get('/api/reports/staff')
      .set('Authorization', `Bearer ${token}`)
      .query({ restaurantId });

    expect(salesResponse.status).toBe(200);
    expect(menuResponse.status).toBe(200);
    expect(staffResponse.status).toBe(200);
    expect(salesResponse.body.success).toBe(true);
    expect(menuResponse.body.success).toBe(true);
    expect(staffResponse.body.success).toBe(true);
  });
});
