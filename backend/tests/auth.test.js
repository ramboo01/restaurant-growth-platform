const { app, request, cleanupTestData, createRestaurantRecord } = require('./testUtils');

describe('Authentication', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Register', async () => {
    const restaurantId = await createRestaurantRecord();
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Auth User',
        email: `auth_register_${Date.now()}@integration.test`,
        password: 'Password123!',
        role: 'Owner',
        restaurantId
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toContain('@integration.test');
  });

  test('Register with invalid restaurantId should fail', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Auth User',
        email: `auth_register_fail_${Date.now()}@integration.test`,
        password: 'Password123!',
        role: 'Owner',
        restaurantId: 999999
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Restaurant not found');
  });

  test('Login', async () => {
    const email = `auth_login_${Date.now()}@integration.test`;
    const password = 'Password123!';
    const restaurantId = await createRestaurantRecord();

    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Login User',
        email,
        password,
        role: 'Owner',
        restaurantId
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();
  });

  test('Invalid Login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: `missing_${Date.now()}@integration.test`,
        password: 'WrongPassword123!'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
