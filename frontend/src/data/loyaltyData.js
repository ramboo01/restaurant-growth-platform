import { guestCustomers } from './guestCrmData.js';

export const loyaltyRules = [
  '₹100 = 10 Points',
  'Birthday Bonus',
  'Referral Bonus'
];

export const initialRewards = [
  {
    id: 'reward-001',
    name: 'Free Side',
    pointsRequired: 120,
    description: 'Redeem for any side item.',
    status: 'Active'
  },
  {
    id: 'reward-002',
    name: 'Free Drink',
    pointsRequired: 90,
    description: 'Redeem for a house beverage.',
    status: 'Active'
  },
  {
    id: 'reward-003',
    name: '10% Off Next Order',
    pointsRequired: 150,
    description: 'Discount applied to the next guest order.',
    status: 'Active'
  },
  {
    id: 'reward-004',
    name: 'Free Dessert',
    pointsRequired: 180,
    description: 'Redeem for a brownie or cheesecake.',
    status: 'Inactive'
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
