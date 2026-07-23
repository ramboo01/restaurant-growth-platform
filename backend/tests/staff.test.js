const { app, request, registerAndLogin, cleanupTestData } = require('./testUtils');

describe('Staff API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Staff CRUD operations', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Staff Manager' });

    // 1. Create staff member
    const createResponse = await request(app)
      .post('/api/staff')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: 'Integration Employee',
        role: 'Chef',
        phone: '1234567890',
        email: `staff_${Date.now()}@integration.test`,
        shift: 'Morning',
        status: 'Active'
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    const staffId = createResponse.body.data.staff?.id;
    expect(staffId).toBeDefined();

    // 2. Read staff list
    const listResponse = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.data.length).toBeGreaterThan(0);

    // 3. Update staff member
    const updateResponse = await request(app)
      .put(`/api/staff/${staffId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        name: 'Integration Employee Edited',
        role: 'Chef',
        phone: '1234567890',
        email: `staff_edit_${Date.now()}@integration.test`,
        shift: 'Evening',
        status: 'On Leave'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.staff.status).toBe('On Leave');

    // 4. Delete staff member
    const deleteResponse = await request(app)
      .delete(`/api/staff/${staffId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
