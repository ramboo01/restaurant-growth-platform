export const guestStorefront = {
  restaurant: {
    name: 'RestruRent Kitchen',
    description: 'Craft burgers, stone-baked pizza, and comfort food made for every craving.'
  },
  location: {
    name: 'Downtown Flagship'
  },
  rating: '4.8',
  reviewCount: '1,240',
  storeStatus: 'Open',
  fulfillmentOptions: ['Delivery', 'Pickup'],
  defaultFulfillment: 'Delivery',
  fulfillment: {
    delivery: {
      estimatedDelivery: '25-35 min',
      deliveryFee: '$2.99',
      minimumOrder: '$10.00'
    },
    pickup: {
      pickupTime: '15-20 min'
    }
  },
  promotion: {
    title: 'Free delivery today',
    description: 'Enjoy free delivery on orders over $35.'
  }
};
