const { app, request, createRestaurantRecord, cleanupTestData } = require('./testUtils');

describe('Public Storefront API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Public routes fetch restaurant and menu successfully without authorization', async () => {
    const restaurantId = await createRestaurantRecord();

    // 1. Get restaurant list
    const listResponse = await request(app)
      .get('/api/public/restaurants');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.restaurants.length).toBeGreaterThan(0);

    // 2. Get specific restaurant
    const detailResponse = await request(app)
      .get(`/api/public/restaurants/${restaurantId}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.success).toBe(true);
    expect(detailResponse.body.data.restaurant.id).toBe(restaurantId);

    // 3. Get menu items
    const menuResponse = await request(app)
      .get(`/api/public/restaurants/${restaurantId}/menu`);
    expect(menuResponse.status).toBe(200);
    expect(menuResponse.body.success).toBe(true);
    expect(Array.isArray(menuResponse.body.data.data)).toBe(true);

    // 4. Get categories
    const categoriesResponse = await request(app)
      .get(`/api/public/restaurants/${restaurantId}/categories`);
    expect(categoriesResponse.status).toBe(200);
    expect(categoriesResponse.body.success).toBe(true);
    expect(Array.isArray(categoriesResponse.body.data.categories)).toBe(true);

    // 5. Place an order publicly
    const orderPayload = {
      restaurantId,
      customerName: 'Guest User',
      customerPhone: '1234567890',
      orderNumber: 'PUB-123456',
      totalAmount: 45.50,
      orderStatus: 'Pending',
      paymentStatus: 'Pending'
    };

    const createOrderResponse = await request(app)
      .post('/api/public/orders')
      .send(orderPayload);
    expect(createOrderResponse.status).toBe(201);
    expect(createOrderResponse.body.success).toBe(true);
    expect(createOrderResponse.body.data.order.orderNumber).toBe('PUB-123456');

    const createdOrderId = createOrderResponse.body.data.order.id;

    // 6. Retrieve order details publicly by ID
    const getOrderResponse = await request(app)
      .get(`/api/public/orders/${createdOrderId}`);
    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.body.success).toBe(true);
    expect(getOrderResponse.body.data.order.id).toBe(createdOrderId);

    // 7. Retrieve order details publicly by Order Number
    const getOrderByNumResponse = await request(app)
      .get('/api/public/orders/number/PUB-123456');
    expect(getOrderByNumResponse.status).toBe(200);
    expect(getOrderByNumResponse.body.success).toBe(true);
    expect(getOrderByNumResponse.body.data.order.id).toBe(createdOrderId);
  });
});
