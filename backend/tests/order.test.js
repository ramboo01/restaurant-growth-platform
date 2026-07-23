const {
  app,
  request,
  registerAndLogin,
  createRestaurant,
  assignUserToRestaurant,
  cleanupTestData
} = require('./testUtils');

describe('Orders API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Orders CRUD and Filtering', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Order Owner' });
    const restaurantResponse = await createRestaurant(auth.token, {
      name: `Integration Order Restaurant ${Date.now()}`
    });
    const restaurantId = restaurantResponse.body.data.restaurant.id;

    await assignUserToRestaurant(auth.user.id, restaurantId);

    const refreshedAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: auth.email, password: auth.password });
    const token = refreshedAuth.body.data.token;

    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId,
        customerName: 'Integration Customer',
        customerPhone: '9876543210',
        orderNumber: `INT-${Date.now()}`,
        totalAmount: 599,
        orderStatus: 'Pending',
        paymentStatus: 'Pending'
      });

    expect(createResponse.status).toBe(201);
    const orderId = createResponse.body.data.order.id;

    const listResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({
        restaurantId,
        page: 1,
        limit: 5,
        status: 'Pending'
      });

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data.data)).toBe(true);

    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.order.id).toBe(orderId);

    const updateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId,
        customerName: 'Integration Customer Updated',
        customerPhone: '9876543211',
        orderNumber: `INT-${Date.now()}-UPD`,
        totalAmount: 699,
        orderStatus: 'Accepted',
        paymentStatus: 'Paid'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.order.orderStatus).toBe('Accepted');

    const deleteResponse = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
