const {
  app,
  request,
  registerAndLogin,
  getFixturePath,
  removeUploadedFileIfExists,
  cleanupTestData
} = require('./testUtils');

describe('Upload API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  test('Unauthorized upload', async () => {
    const response = await request(app)
      .post('/api/upload/menu-image')
      .attach('image', getFixturePath('test-image.png'));

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('Authorized upload', async () => {
    const auth = await registerAndLogin({ role: 'Owner', name: 'Upload Owner' });

    const response = await request(app)
      .post('/api/upload/menu-image')
      .set('Authorization', `Bearer ${auth.token}`)
      .attach('image', getFixturePath('test-image.png'));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.path).toContain('uploads/menu/');

    await removeUploadedFileIfExists(response.body.data.path);
  });
});
