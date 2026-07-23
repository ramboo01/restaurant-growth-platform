export const menuChannels = ['Website', 'Branded App', 'Kiosk', 'Marketplace', 'POS'];

export const menuCategories = [
  {
    id: 'burgers',
    name: 'Burgers',
    description: 'Signature beef, chicken, and plant-based burgers.',
    itemCount: 3,
    icon: 'bi-egg-fried'
  },
  {
    id: 'pizza',
    name: 'Pizza',
    description: 'Stone-baked pies with classic and premium toppings.',
    itemCount: 3,
    icon: 'bi-circle'
  },
  {
    id: 'sides',
    name: 'Sides',
    description: 'Shareable fries, wings, and crisp accompaniments.',
    itemCount: 2,
    icon: 'bi-basket'
  },
  {
    id: 'beverages',
    name: 'Beverages',
    description: 'House drinks, shakes, and refreshers.',
    itemCount: 2,
    icon: 'bi-cup-straw'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    description: 'Sweet finishes for dine-in and delivery orders.',
    itemCount: 2,
    icon: 'bi-cake2'
  }
];

const burgerModifiers = [
  {
    id: 'burger-size',
    name: 'Size',
    minSelections: 1,
    maxSelections: 1,
    required: true,
    options: [
      { id: 'regular', name: 'Regular', priceAdjustment: 0 },
      { id: 'large', name: 'Large', priceAdjustment: 3 }
    ]
  },
  {
    id: 'burger-extras',
    name: 'Extras',
    minSelections: 0,
    maxSelections: 3,
    required: false,
    options: [
      { id: 'extra-cheese', name: 'Extra Cheese', priceAdjustment: 1.5 },
      { id: 'extra-patty', name: 'Extra Patty', priceAdjustment: 4 },
      { id: 'bacon', name: 'Bacon', priceAdjustment: 2 }
    ]
  },
  {
    id: 'burger-sauce',
    name: 'Sauce',
    minSelections: 0,
    maxSelections: 2,
    required: false,
    options: [
      { id: 'bbq', name: 'BBQ', priceAdjustment: 0 },
      { id: 'garlic-mayo', name: 'Garlic Mayo', priceAdjustment: 0 },
      { id: 'spicy-sauce', name: 'Spicy Sauce', priceAdjustment: 0 }
    ]
  }
];

const pizzaModifiers = [
  {
    id: 'pizza-size',
    name: 'Size',
    minSelections: 1,
    maxSelections: 1,
    required: true,
    options: [
      { id: 'regular', name: 'Regular', priceAdjustment: 0 },
      { id: 'large', name: 'Large', priceAdjustment: 5 }
    ]
  },
  {
    id: 'pizza-extras',
    name: 'Extras',
    minSelections: 0,
    maxSelections: 4,
    required: false,
    options: [
      { id: 'extra-cheese', name: 'Extra Cheese', priceAdjustment: 2 },
      { id: 'pepperoni', name: 'Pepperoni', priceAdjustment: 3 },
      { id: 'mushrooms', name: 'Mushrooms', priceAdjustment: 1.5 }
    ]
  }
];

const defaultChannelStatus = {
  Website: { status: 'synced', enabled: true },
  'Branded App': { status: 'synced', enabled: true },
  Kiosk: { status: 'synced', enabled: true },
  Marketplace: { status: 'pending', enabled: true },
  POS: { status: 'synced', enabled: true }
};

export const menuItems = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    description: 'Double smashed beef patty, cheddar, lettuce, tomato, pickles, house sauce.',
    categoryId: 'burgers',
    basePrice: 12.5,
    imagePlaceholder: 'CB',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten'],
    channels: {
      Website: { status: 'synced', enabled: true },
      'Branded App': { status: 'synced', enabled: true },
      Kiosk: { status: 'synced', enabled: true },
      Marketplace: { status: 'failed', enabled: true, note: 'Last sync attempt failed.' },
      POS: { status: 'synced', enabled: true }
    },
    modifierGroups: burgerModifiers
  },
  {
    id: 'smokehouse-bacon-burger',
    name: 'Smokehouse Bacon Burger',
    description: 'Angus patty, smoked bacon, crispy onions, cheddar, BBQ sauce.',
    categoryId: 'burgers',
    basePrice: 15.75,
    imagePlaceholder: 'SB',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten'],
    channels: defaultChannelStatus,
    modifierGroups: burgerModifiers
  },
  {
    id: 'garden-stack',
    name: 'Garden Stack',
    description: 'Plant-based patty, avocado, greens, tomato relish, vegan bun.',
    categoryId: 'burgers',
    basePrice: 14,
    imagePlaceholder: 'GS',
    isAvailable: false,
    is86d: true,
    allergenTags: ['Gluten'],
    channels: {
      Website: { status: 'pending', enabled: true },
      'Branded App': { status: 'pending', enabled: true },
      Kiosk: { status: 'synced', enabled: true },
      Marketplace: { status: 'failed', enabled: true, note: 'Last sync attempt failed.' },
      POS: { status: 'synced', enabled: true }
    },
    modifierGroups: burgerModifiers
  },
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    description: 'Tomato, mozzarella, basil, sea salt, extra virgin olive oil.',
    categoryId: 'pizza',
    basePrice: 16,
    imagePlaceholder: 'MP',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten'],
    channels: defaultChannelStatus,
    modifierGroups: pizzaModifiers
  },
  {
    id: 'pepperoni-pizza',
    name: 'Pepperoni Pizza',
    description: 'Mozzarella, tomato sauce, cup-and-char pepperoni, oregano.',
    categoryId: 'pizza',
    basePrice: 18.5,
    imagePlaceholder: 'PP',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten'],
    channels: {
      Website: { status: 'synced', enabled: true },
      'Branded App': { status: 'synced', enabled: true },
      Kiosk: { status: 'pending', enabled: true },
      Marketplace: { status: 'pending', enabled: true },
      POS: { status: 'synced', enabled: true, priceOverride: 17.99 }
    },
    modifierGroups: pizzaModifiers
  },
  {
    id: 'truffle-mushroom-pizza',
    name: 'Truffle Mushroom Pizza',
    description: 'Roasted mushrooms, fontina, mozzarella, truffle cream, thyme.',
    categoryId: 'pizza',
    basePrice: 21,
    imagePlaceholder: 'TM',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten'],
    channels: defaultChannelStatus,
    modifierGroups: pizzaModifiers
  },
  {
    id: 'loaded-fries',
    name: 'Loaded Fries',
    description: 'Crispy fries, cheddar sauce, scallions, bacon crumble, ranch drizzle.',
    categoryId: 'sides',
    basePrice: 8.5,
    imagePlaceholder: 'LF',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy'],
    channels: defaultChannelStatus,
    modifierGroups: []
  },
  {
    id: 'buffalo-wings',
    name: 'Buffalo Wings',
    description: 'Eight wings tossed in buffalo sauce with celery and blue cheese.',
    categoryId: 'sides',
    basePrice: 13,
    imagePlaceholder: 'BW',
    isAvailable: false,
    is86d: true,
    allergenTags: ['Dairy'],
    channels: {
      Website: { status: 'synced', enabled: true },
      'Branded App': { status: 'failed', enabled: true, note: 'Last sync attempt failed.' },
      Kiosk: { status: 'synced', enabled: true },
      Marketplace: { status: 'pending', enabled: true },
      POS: { status: 'synced', enabled: true }
    },
    modifierGroups: []
  },
  {
    id: 'house-lemonade',
    name: 'House Lemonade',
    description: 'Fresh lemon, cane sugar, mint, sparkling water.',
    categoryId: 'beverages',
    basePrice: 4.5,
    imagePlaceholder: 'HL',
    isAvailable: true,
    is86d: false,
    allergenTags: [],
    channels: defaultChannelStatus,
    modifierGroups: []
  },
  {
    id: 'vanilla-shake',
    name: 'Vanilla Shake',
    description: 'Vanilla ice cream, milk, whipped cream, cherry.',
    categoryId: 'beverages',
    basePrice: 7,
    imagePlaceholder: 'VS',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy'],
    channels: {
      Website: { status: 'synced', enabled: true },
      'Branded App': { status: 'synced', enabled: true },
      Kiosk: { status: 'synced', enabled: true },
      Marketplace: { status: 'failed', enabled: true, note: 'Last sync attempt failed.' },
      POS: { status: 'synced', enabled: true }
    },
    modifierGroups: []
  },
  {
    id: 'chocolate-brownie',
    name: 'Chocolate Brownie',
    description: 'Warm fudge brownie with chocolate chips and powdered sugar.',
    categoryId: 'desserts',
    basePrice: 6.5,
    imagePlaceholder: 'CB',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten', 'Egg'],
    channels: defaultChannelStatus,
    modifierGroups: []
  },
  {
    id: 'seasonal-cheesecake',
    name: 'Seasonal Cheesecake',
    description: 'Creamy cheesecake with rotating seasonal fruit topping.',
    categoryId: 'desserts',
    basePrice: 8,
    imagePlaceholder: 'SC',
    isAvailable: true,
    is86d: false,
    allergenTags: ['Dairy', 'Gluten', 'Egg'],
    channels: {
      Website: { status: 'pending', enabled: true },
      'Branded App': { status: 'synced', enabled: true },
      Kiosk: { status: 'synced', enabled: true },
      Marketplace: { status: 'synced', enabled: true },
      POS: { status: 'synced', enabled: true }
    },
    modifierGroups: []
  }
];

export const syncHealthSummary = {
  title: 'Overall sync health',
  summary: '4 channels synced',
  attention: '1 channel needs attention',
  channels: [
    { name: 'Website', status: 'synced' },
    { name: 'Branded App', status: 'synced' },
    { name: 'Kiosk', status: 'synced' },
    { name: 'Marketplace', status: 'failed' },
    { name: 'POS', status: 'synced' }
  ]
};
