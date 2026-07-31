export const currentOwner = {
  name: 'Alex Morgan',
  role: 'Owner / GM'
};

export const currentLocation = {
  name: 'Downtown Flagship'
};

export const dashboardGreeting = 'Good morning, Alex';

export const notificationCount = 3;

export const ownerNavigationGroups = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', to: '/owner', icon: 'bi-speedometer2', end: true },
      { label: 'Guests', to: '/owner/guests', icon: 'bi-people' },
      { label: 'Menu', to: '/owner/menu', icon: 'bi-card-list' },
      { label: '86 Board', to: '/owner/86-board', icon: 'bi-toggle-off' },
      { label: 'Site Editor (CMS)', to: '/owner/site-editor', icon: 'bi-palette' },
      { label: 'Site / App', to: '/owner/site-app', icon: 'bi-window-sidebar' }
    ]
  },
  {
    label: 'Growth',
    items: [
      { label: 'Campaigns', to: '/owner/campaigns', icon: 'bi-megaphone' },
      { label: 'Loyalty', to: '/owner/loyalty', icon: 'bi-stars' },
      { label: 'SEO & Listings', to: '/owner/seo', icon: 'bi-search' },
      { label: 'Reviews', to: '/owner/reviews', icon: 'bi-chat-square-heart' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Delivery', to: '/owner/delivery', icon: 'bi-truck' },
      { label: 'Orders', to: '/owner/orders', icon: 'bi-receipt' },
      { label: 'Staff & Scheduling', to: '/owner/staff', icon: 'bi-calendar2-week' },
      { label: 'Inventory', to: '/owner/inventory', icon: 'bi-box-seam' },
      { label: 'AI Operations', to: '/owner/ai-operations', icon: 'bi-cpu' }
    ]
  },
  {
    label: 'Business',
    items: [
      { label: 'Franchise', to: '/owner/franchise', icon: 'bi-diagram-3' },
      { label: 'Franchise Compliance', to: '/owner/franchise-compliance', icon: 'bi-shield-check' },
      { label: 'Franchise Comparison', to: '/owner/franchise-comparison', icon: 'bi-bar-chart-line' },
      { label: 'Reports', to: '/owner/reports', icon: 'bi-bar-chart' },
      { label: 'Financial Products', to: '/owner/financial-products', icon: 'bi-credit-card' },
      { label: 'Data Export Tool', to: '/owner/data-export', icon: 'bi-file-earmark-arrow-down' }
    ]
  },
  {
    label: 'System',
    items: [{ label: 'Settings', to: '/owner/settings', icon: 'bi-gear' }]
  }
];

export const needsAttention = [
  {
    id: 'menu-sync-failures',
    title: 'Menu sync failures',
    description: '3 channels need attention',
    severity: 'critical',
    actionLabel: 'Review sync',
    to: '/owner/menu'
  },
  {
    id: 'reviews-awaiting-reply',
    title: 'Reviews awaiting reply',
    description: '5 guest reviews need approval',
    severity: 'warning',
    actionLabel: 'Review replies',
    to: '/owner/reviews'
  },
  {
    id: 'price-override-approvals',
    title: 'Price override approvals',
    description: '2 location requests are pending',
    severity: 'info',
    actionLabel: 'Review requests',
    to: '/owner/franchise'
  },
  {
    id: 'inventory-risk',
    title: 'Inventory risk',
    description: '4 ingredients may run out today',
    severity: 'warning',
    actionLabel: 'View inventory',
    to: '/owner/inventory'
  }
];

export const keyMetrics = [
  {
    id: 'net-revenue',
    label: 'Net Revenue',
    value: '$24,580',
    trend: '+12.4%',
    comparison: 'vs last 7 days',
    icon: 'bi-currency-dollar'
  },
  {
    id: 'orders',
    label: 'Orders',
    value: '1,240',
    trend: '+8.2%',
    comparison: 'vs last 7 days',
    icon: 'bi-receipt'
  },
  {
    id: 'repeat-guests',
    label: 'Repeat Guests',
    value: '38%',
    trend: '+3.1%',
    comparison: 'vs last 30 days',
    icon: 'bi-person-heart'
  },
  {
    id: 'average-order-value',
    label: 'Average Order Value',
    value: '$42.60',
    trend: '+5.7%',
    comparison: 'vs last 7 days',
    icon: 'bi-basket'
  }
];

export const todayOperations = [
  { id: 'orders-in-progress', label: 'Orders in progress', value: 18, icon: 'bi-hourglass-split' },
  { id: 'awaiting-driver', label: 'Awaiting driver', value: 4, icon: 'bi-truck' },
  { id: 'eighty-six-items', label: "86'd items", value: 3, icon: 'bi-slash-circle' },
  { id: 'open-shifts', label: 'Open shifts', value: 2, icon: 'bi-person-plus' }
];

export const recentActivity = [
  {
    id: 'menu-price-updated',
    title: 'Menu item price updated',
    description: 'Spicy rigatoni price changed for dinner service.',
    time: '12 min ago',
    icon: 'bi-pencil-square'
  },
  {
    id: 'vip-guest-identified',
    title: 'VIP guest identified',
    description: 'A repeat guest with high lifetime value placed an order.',
    time: '28 min ago',
    icon: 'bi-person-badge'
  },
  {
    id: 'delivery-reassigned',
    title: 'Delivery reassigned',
    description: 'Order #1842 moved to an owned driver after delay risk.',
    time: '43 min ago',
    icon: 'bi-arrow-left-right'
  },
  {
    id: 'review-approved',
    title: 'Review reply approved',
    description: 'AI-assisted reply approved for a 4-star delivery review.',
    time: '1 hr ago',
    icon: 'bi-chat-left-check'
  },
  {
    id: 'inventory-count-submitted',
    title: 'Inventory count submitted',
    description: 'Kitchen team updated counts for prep and dairy items.',
    time: '2 hrs ago',
    icon: 'bi-clipboard-check'
  }
];

export const ownerModulePlaceholders = {
  guests: {
    title: 'Guests',
    description: 'Frontend module scheduled for a later phase.'
  },
  menu: {
    title: 'Menu',
    description: 'Frontend module scheduled for a later phase.'
  },
  '86-board': {
    title: '86 Board',
    description: 'Frontend module scheduled for a later phase.'
  },
  'site-app': {
    title: 'Site / App',
    description: 'Frontend module scheduled for a later phase.'
  },
  campaigns: {
    title: 'Campaigns',
    description: 'Frontend module scheduled for a later phase.'
  },
  loyalty: {
    title: 'Loyalty',
    description: 'Frontend module scheduled for a later phase.'
  },
  seo: {
    title: 'SEO & Listings',
    description: 'Frontend module scheduled for a later phase.'
  },
  reviews: {
    title: 'Reviews',
    description: 'Frontend module scheduled for a later phase.'
  },
  delivery: {
    title: 'Delivery',
    description: 'Frontend module scheduled for a later phase.'
  },
  staff: {
    title: 'Staff & Scheduling',
    description: 'Frontend module scheduled for a later phase.'
  },
  inventory: {
    title: 'Inventory',
    description: 'Frontend module scheduled for a later phase.'
  },
  'ai-operations': {
    title: 'AI Operations',
    description: 'Frontend module scheduled for a later phase.'
  },
  franchise: {
    title: 'Franchise',
    description: 'Frontend module scheduled for a later phase.'
  },
  reports: {
    title: 'Reports',
    description: 'Frontend module scheduled for a later phase.'
  },
  'financial-products': {
    title: 'Financial Products',
    description: 'Frontend module scheduled for a later phase.'
  },
  settings: {
    title: 'Settings',
    description: 'Frontend module scheduled for a later phase.'
  }
};
