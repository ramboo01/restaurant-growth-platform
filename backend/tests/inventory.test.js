const { app, request, registerAndLogin, cleanupTestData } = require('./testUtils');

describe('Inventory API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Inventory CRUD operations', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Inventory Manager' });

    // 1. Create inventory item
    const createResponse = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        itemName: `Integration Ingredient ${Date.now()}`,
        category: 'Dairy',
        unit: 'Liters',
        quantity: 100,
        minimumQuantity: 20,
        supplier: 'Integration Supplier Corp',
        status: 'In Stock'
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    const itemId = createResponse.body.data.inventoryItem.id;
    expect(itemId).toBeDefined();

    // 2. Read inventory list
    const listResponse = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.data.length).toBeGreaterThan(0);

    // 3. Read specific inventory item
    const getResponse = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.inventoryItem.itemName).toContain('Integration Ingredient');

    // 4. Update inventory item
    const updateResponse = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        itemName: `Integration Ingredient Edit ${Date.now()}`,
        category: 'Dairy Products',
        unit: 'Liters',
        quantity: 15,
        minimumQuantity: 20,
        supplier: 'Integration Supplier Corp',
        status: 'Low Stock'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.inventoryItem.status).toBe('Low Stock');

    // 5. Delete inventory item
    const deleteResponse = await request(app)
      .delete(`/api/inventory/${itemId}`)
      .set('Authorization', `Bearer ${auth.token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });
});
