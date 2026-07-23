const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RestruRent API',
      version: '1.0.0',
      description: 'API documentation for the Restaurant Growth Platform backend.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      }
    ],
    tags: [
      { name: 'Authentication' },
      { name: 'Restaurant' },
      { name: 'Menu' },
      { name: 'Categories' },
      { name: 'Orders' },
      { name: 'Staff' },
      { name: 'Drivers' },
      { name: 'Inventory' },
      { name: 'Loyalty' },
      { name: 'Customers' },
      { name: 'Notifications' },
      { name: 'Analytics' },
      { name: 'Reports' },
      { name: 'Upload' }
    ],
    paths: {
      '/api/auth/register': { post: { tags: ['Authentication'], summary: 'Register a user' } },
      '/api/auth/login': { post: { tags: ['Authentication'], summary: 'Login a user' } },
      '/api/auth/profile': { get: { tags: ['Authentication'], summary: 'Get authenticated user profile' } },
      '/api/restaurants': {
        get: { tags: ['Restaurant'], summary: 'List restaurants' },
        post: { tags: ['Restaurant'], summary: 'Create restaurant' }
      },
      '/api/restaurants/{id}': {
        get: { tags: ['Restaurant'], summary: 'Get restaurant by id' },
        put: { tags: ['Restaurant'], summary: 'Update restaurant' },
        delete: { tags: ['Restaurant'], summary: 'Delete restaurant' }
      },
      '/api/menu': {
        get: { tags: ['Menu'], summary: 'List menu items' },
        post: { tags: ['Menu'], summary: 'Create menu item' }
      },
      '/api/menu/{id}': {
        get: { tags: ['Menu'], summary: 'Get menu item by id' },
        put: { tags: ['Menu'], summary: 'Update menu item' },
        delete: { tags: ['Menu'], summary: 'Delete menu item' }
      },
      '/api/categories': {
        get: { tags: ['Categories'], summary: 'List categories' },
        post: { tags: ['Categories'], summary: 'Create category' }
      },
      '/api/categories/{id}': {
        get: { tags: ['Categories'], summary: 'Get category by id' },
        put: { tags: ['Categories'], summary: 'Update category' },
        delete: { tags: ['Categories'], summary: 'Delete category' }
      },
      '/api/orders': {
        get: { tags: ['Orders'], summary: 'List orders' },
        post: { tags: ['Orders'], summary: 'Create order' }
      },
      '/api/orders/{id}': {
        get: { tags: ['Orders'], summary: 'Get order by id' },
        put: { tags: ['Orders'], summary: 'Update order' },
        delete: { tags: ['Orders'], summary: 'Delete order' }
      },
      '/api/orders/{id}/status': {
        patch: { tags: ['Orders'], summary: 'Update order status' }
      },
      '/api/staff': {
        get: { tags: ['Staff'], summary: 'List staff' },
        post: { tags: ['Staff'], summary: 'Create staff member' }
      },
      '/api/staff/{id}': {
        get: { tags: ['Staff'], summary: 'Get staff by id' },
        put: { tags: ['Staff'], summary: 'Update staff' },
        delete: { tags: ['Staff'], summary: 'Delete staff' }
      },
      '/api/drivers': {
        get: { tags: ['Drivers'], summary: 'List drivers' },
        post: { tags: ['Drivers'], summary: 'Create driver' }
      },
      '/api/drivers/{id}': {
        get: { tags: ['Drivers'], summary: 'Get driver by id' },
        put: { tags: ['Drivers'], summary: 'Update driver' },
        delete: { tags: ['Drivers'], summary: 'Delete driver' }
      },
      '/api/inventory': {
        get: { tags: ['Inventory'], summary: 'List inventory items' },
        post: { tags: ['Inventory'], summary: 'Create inventory item' }
      },
      '/api/inventory/{id}': {
        get: { tags: ['Inventory'], summary: 'Get inventory item by id' },
        put: { tags: ['Inventory'], summary: 'Update inventory item' },
        delete: { tags: ['Inventory'], summary: 'Delete inventory item' }
      },
      '/api/loyalty': {
        get: { tags: ['Loyalty'], summary: 'List loyalty members' },
        post: { tags: ['Loyalty'], summary: 'Create loyalty member' }
      },
      '/api/loyalty/{id}': {
        get: { tags: ['Loyalty'], summary: 'Get loyalty member by id' },
        put: { tags: ['Loyalty'], summary: 'Update loyalty member' },
        delete: { tags: ['Loyalty'], summary: 'Delete loyalty member' }
      },
      '/api/customers': {
        get: { tags: ['Customers'], summary: 'List customers' },
        post: { tags: ['Customers'], summary: 'Create customer' }
      },
      '/api/customers/{id}': {
        get: { tags: ['Customers'], summary: 'Get customer by id' },
        put: { tags: ['Customers'], summary: 'Update customer' },
        delete: { tags: ['Customers'], summary: 'Delete customer' }
      },
      '/api/notifications': {
        get: { tags: ['Notifications'], summary: 'List notifications' },
        post: { tags: ['Notifications'], summary: 'Create notification' }
      },
      '/api/notifications/{id}': {
        get: { tags: ['Notifications'], summary: 'Get notification by id' },
        delete: { tags: ['Notifications'], summary: 'Delete notification' }
      },
      '/api/notifications/{id}/read': {
        patch: { tags: ['Notifications'], summary: 'Mark notification as read' }
      },
      '/api/analytics/dashboard': {
        get: { tags: ['Analytics'], summary: 'Get dashboard analytics' }
      },
      '/api/reports/sales': {
        get: { tags: ['Reports'], summary: 'Get sales report' }
      },
      '/api/reports/menu': {
        get: { tags: ['Reports'], summary: 'Get menu report' }
      },
      '/api/reports/staff': {
        get: { tags: ['Reports'], summary: 'Get staff report' }
      },
      '/api/upload/menu-image': {
        post: { tags: ['Upload'], summary: 'Upload a menu image' }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
