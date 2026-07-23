export const mockOrders = [
  {
    orderId: 'RR-10421',
    customerName: 'Aarav Patel',
    orderType: 'Delivery',
    orderStatus: 'New',
    orderTime: '11:08 AM',
    total: 28.5,
    itemCount: 2,
    priority: 'High',
    items: [
      { name: 'Classic Burger', quantity: 1 },
      { name: 'Loaded Fries', quantity: 1 }
    ]
  },
  {
    orderId: 'RR-10422',
    customerName: 'Mia Johnson',
    orderType: 'Pickup',
    orderStatus: 'Preparing',
    orderTime: '11:12 AM',
    total: 19.25,
    itemCount: 1,
    priority: 'Normal',
    items: [{ name: 'Margherita Pizza', quantity: 1 }]
  },
  {
    orderId: 'RR-10422-D',
    customerName: 'Mia Johnson',
    orderType: 'Pickup',
    orderStatus: 'Ready',
    orderTime: '11:12 AM',
    total: 19.25,
    itemCount: 1,
    priority: 'Normal',
    items: [{ name: 'Margherita Pizza', quantity: 1 }],
    deliveryTime: '12 min',
    address: '28 Market Street, Downtown'
  },
  {
    orderId: 'RR-10423',
    customerName: 'Noah Kim',
    orderType: 'Delivery',
    orderStatus: 'Ready',
    orderTime: '11:18 AM',
    total: 36.0,
    itemCount: 3,
    priority: 'High',
    deliveryTime: '18 min',
    address: '14 Oak Avenue, Riverside',
    items: [
      { name: 'Smokehouse Bacon Burger', quantity: 1 },
      { name: 'Vanilla Shake', quantity: 2 }
    ]
  },
  {
    orderId: 'RR-10424',
    customerName: 'Sophia Brown',
    orderType: 'Pickup',
    orderStatus: 'Completed',
    orderTime: '11:25 AM',
    total: 14.75,
    itemCount: 1,
    priority: 'Normal',
    items: [{ name: 'House Lemonade', quantity: 1 }]
  },
  {
    orderId: 'RR-10425',
    customerName: 'Ethan Miller',
    orderType: 'Delivery',
    orderStatus: 'New',
    orderTime: '11:31 AM',
    total: 42.3,
    itemCount: 4,
    priority: 'High',
    items: [
      { name: 'Pepperoni Pizza', quantity: 2 },
      { name: 'Chocolate Brownie', quantity: 2 }
    ]
  },
  {
    orderId: 'RR-10426',
    customerName: 'Olivia Garcia',
    orderType: 'Pickup',
    orderStatus: 'Preparing',
    orderTime: '11:34 AM',
    total: 23.4,
    itemCount: 2,
    priority: 'Normal',
    items: [
      { name: 'Garden Stack', quantity: 1 },
      { name: 'Loaded Fries', quantity: 1 }
    ]
  },
  {
    orderId: 'RR-10427',
    customerName: 'Liam Wilson',
    orderType: 'Delivery',
    orderStatus: 'Ready',
    orderTime: '11:40 AM',
    total: 31.95,
    itemCount: 2,
    priority: 'Normal',
    deliveryTime: '14 min',
    address: '90 Lake Road, Midtown',
    items: [
      { name: 'Truffle Mushroom Pizza', quantity: 1 },
      { name: 'House Lemonade', quantity: 1 }
    ]
  },
  {
    orderId: 'RR-10428',
    customerName: 'Emma Davis',
    orderType: 'Pickup',
    orderStatus: 'Completed',
    orderTime: '11:44 AM',
    total: 18.0,
    itemCount: 1,
    priority: 'Normal',
    items: [{ name: 'Buffalo Wings', quantity: 1 }]
  },
  {
    orderId: 'RR-10429',
    customerName: 'Lucas Martinez',
    orderType: 'Delivery',
    orderStatus: 'New',
    orderTime: '11:48 AM',
    total: 27.5,
    itemCount: 2,
    priority: 'High',
    items: [
      { name: 'Classic Burger', quantity: 1 },
      { name: 'Vanilla Shake', quantity: 1 }
    ]
  },
  {
    orderId: 'RR-10430',
    customerName: 'Harper Lee',
    orderType: 'Delivery',
    orderStatus: 'Out for Delivery',
    orderTime: '11:52 AM',
    total: 24.9,
    itemCount: 2,
    priority: 'High',
    deliveryTime: '9 min',
    address: '51 Pine Street, Uptown',
    items: [
      { name: 'Pepperoni Pizza', quantity: 1 },
      { name: 'House Lemonade', quantity: 1 }
    ]
  },
  {
    orderId: 'RR-10431',
    customerName: 'James Carter',
    orderType: 'Delivery',
    orderStatus: 'Delivered',
    orderTime: '11:56 AM',
    total: 22.5,
    itemCount: 2,
    priority: 'Normal',
    deliveryTime: 'Delivered',
    address: '18 Cedar Lane, East Side',
    items: [
      { name: 'Garden Stack', quantity: 1 },
      { name: 'Chocolate Brownie', quantity: 1 }
    ]
  }
];
