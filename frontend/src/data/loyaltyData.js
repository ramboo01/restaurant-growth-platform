import { guestCustomers } from './guestCrmData.js';

export const loyaltyRules = [
  '$1 spent = 10 Points',
  'Birthday Bonus (Coming Soon)',
  'Referral Bonus (Coming Soon)'
];

export const initialRewards = [
  {
    id: 'reward-001',
    name: '5 Dollar Discount',
    pointsRequired: 50,
    discountAmount: 5.00,
    description: 'Get $5 off your next order.',
    status: 'Active'
  },
  {
    id: 'reward-002',
    name: '10 Dollar Discount',
    pointsRequired: 100,
    discountAmount: 10.00,
    description: 'Save $10 on your next order.',
    status: 'Active'
  },
  {
    id: 'reward-003',
    name: '15 Dollar Discount',
    pointsRequired: 150,
    discountAmount: 15.00,
    description: 'Enjoy $15 off your order!',
    status: 'Active'
  },
  {
    id: 'reward-004',
    name: '25 Dollar Discount',
    pointsRequired: 250,
    discountAmount: 25.00,
    description: 'Our best reward — $25 off your order!',
    status: 'Active'
  }
];

export function getLoyaltySummary() {
  const totalMembers = guestCustomers.length;
  const activeMembers = guestCustomers.filter((guest) => guest.totalOrders >= 5).length;
  const totalPointsIssued = guestCustomers.reduce((sum, guest) => sum + guest.loyaltyPoints, 0);
  const rewardsRedeemed = 74;

  return {
    totalMembers,
    activeMembers,
    totalPointsIssued,
    rewardsRedeemed
  };
}
