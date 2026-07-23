const { app, request, registerAndLogin, cleanupTestData } = require('./testUtils');

describe('Restaurant API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Restaurant CRUD', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Restaurant Owner' });

    const createResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: `Integration Restaurant ${Date.now()}`,
        phone: '9999999999',
        email: `restaurant_${Date.now()}@integration.test`,
        address: '123 Integration Street',
        cuisine: 'Indian',
        openingTime: '10:00:00',
        closingTime: '23:00:00'
      });

    expect(createResponse.status).toBe(201);
    const restaurantId = createResponse.body.data.restaurant.id;

    const listResponse = await request(app)
      .get('/api/restaurants')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data.restaurants)).toBe(true);

    const getResponse = await request(app)
      .get(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.restaurant.id).toBe(restaurantId);

    const updateResponse = await request(app)
      .put(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: `Integration Restaurant Updated ${Date.now()}`,
        phone: '8888888888',
        email: `restaurant_updated_${Date.now()}@integration.test`,
        address: '456 Integration Street',
        cuisine: 'Italian',
        openingTime: '09:00:00',
        closingTime: '22:30:00'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.restaurant.cuisine).toBe('Italian');

    const deleteResponse = await request(app)
      .delete(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
