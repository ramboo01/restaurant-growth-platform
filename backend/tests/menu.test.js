const {
  app,
  request,
  registerAndLogin,
  createRestaurant,
  assignUserToRestaurant,
  cleanupTestData
} = require('./testUtils');

describe('Menu API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Menu CRUD, Pagination, Search', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Menu Owner' });
    const restaurantResponse = await createRestaurant(auth.token, {
      name: `Integration Menu Restaurant ${Date.now()}`
    });
    const restaurantId = restaurantResponse.body.data.restaurant.id;

    await assignUserToRestaurant(auth.user.id, restaurantId);

    const refreshedAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: auth.email, password: auth.password });
    const token = refreshedAuth.body.data.token;

    const createResponse = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId,
        name: `Integration Menu Item ${Date.now()}`,
        description: 'Integration spicy paneer item',
        category: 'Main Course',
        price: 249,
        imageUrl: 'uploads/menu/test-image.png',
        isAvailable: true
      });

    expect(createResponse.status).toBe(201);
    const menuId = createResponse.body.data.menuItem.id;

    const listResponse = await request(app)
      .get('/api/menu')
      .set('Authorization', `Bearer ${token}`)
      .query({
        restaurantId,
        page: 1,
        limit: 5,
        search: 'spicy',
        sort: 'price',
        order: 'ASC'
      });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.page).toBe(1);
    expect(Array.isArray(listResponse.body.data.data)).toBe(true);

    const getResponse = await request(app)
      .get(`/api/menu/${menuId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.menuItem.id).toBe(menuId);

    const updateResponse = await request(app)
      .put(`/api/menu/${menuId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId,
        name: `Integration Menu Item Updated ${Date.now()}`,
        description: 'Integration updated menu item',
        category: 'Starters',
        price: 199,
        imageUrl: 'uploads/menu/test-image.png',
        isAvailable: false
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.menuItem.category).toBe('Starters');

    const deleteResponse = await request(app)
      .delete(`/api/menu/${menuId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
