/**
 * Seed proper discount-based loyalty rewards, replacing any junk/free-drink rewards.
 * Run: node src/scripts/seed-discount-rewards.js
 */
require('dotenv').config();
const { getDatabasePool } = require('../config/database');

async function seedDiscountRewards() {
  const pool = getDatabasePool();

  // First, ensure discount_amount column exists
  try {
    await pool.execute('ALTER TABLE loyalty_rewards ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT NULL');
    console.log('[Seed] Added discount_amount column to loyalty_rewards.');
  } catch {
    console.log('[Seed] discount_amount column already exists.');
  }

  // Get all restaurant IDs
  const [restaurants] = await pool.execute('SELECT id FROM restaurants');
  
  if (restaurants.length === 0) {
    console.log('[Seed] No restaurants found, skipping.');
    process.exit(0);
  }

  for (const restaurant of restaurants) {
    const rid = restaurant.id;
    console.log(`\n[Seed] Processing restaurant ID: ${rid}`);

    // Delete all existing "free drink" type rewards (junk data)
    const [deleteResult] = await pool.execute(
      `DELETE FROM loyalty_rewards WHERE restaurant_id = ? AND (
        LOWER(name) LIKE '%free drink%' OR
        LOWER(name) LIKE '%free side%' OR
        LOWER(name) LIKE '%free dessert%' OR
        LOWER(name) LIKE '%free beverage%' OR
        LOWER(name) LIKE '%drinkss%'
      )`,
      [rid]
    );
    console.log(`  Deleted ${deleteResult.affectedRows} junk/free-item rewards.`);

    // Define proper discount-based rewards
    const discountRewards = [
      {
        name: '5 Dollar Discount',
        description: 'Get $5 off your next order. Perfect for a quick save!',
        points_required: 50,
        discount_amount: 5.00,
        status: 'Active'
      },
      {
        name: '10 Dollar Discount',
        description: 'Save $10 on your next order. Great value reward!',
        points_required: 100,
        discount_amount: 10.00,
        status: 'Active'
      },
      {
        name: '15 Dollar Discount',
        description: 'Enjoy $15 off! Treat yourself to something special.',
        points_required: 150,
        discount_amount: 15.00,
        status: 'Active'
      },
      {
        name: '25 Dollar Discount',
        description: 'Our best reward — $25 off your order! VIP treatment.',
        points_required: 250,
        discount_amount: 25.00,
        status: 'Active'
      }
    ];

    for (const reward of discountRewards) {
      // Check if this reward already exists for this restaurant
      const [existing] = await pool.execute(
        'SELECT id FROM loyalty_rewards WHERE restaurant_id = ? AND name = ? LIMIT 1',
        [rid, reward.name]
      );

      if (existing.length > 0) {
        // Update existing
        await pool.execute(
          `UPDATE loyalty_rewards SET description = ?, points_required = ?, discount_amount = ?, status = ? WHERE id = ?`,
          [reward.description, reward.points_required, reward.discount_amount, reward.status, existing[0].id]
        );
        console.log(`  ✅ Updated: "${reward.name}" (${reward.points_required} pts → $${reward.discount_amount} off)`);
      } else {
        // Insert new
        await pool.execute(
          `INSERT INTO loyalty_rewards (restaurant_id, name, description, points_required, discount_amount, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [rid, reward.name, reward.description, reward.points_required, reward.discount_amount, reward.status]
        );
        console.log(`  ✅ Created: "${reward.name}" (${reward.points_required} pts → $${reward.discount_amount} off)`);
      }
    }

    // Also delete any old "10% Off" text-based reward
    await pool.execute(
      `DELETE FROM loyalty_rewards WHERE restaurant_id = ? AND LOWER(name) LIKE '%10% off%'`,
      [rid]
    );
  }

  console.log('\n[Seed] ✅ Done! All restaurants now have proper discount-based rewards.');
  process.exit(0);
}

seedDiscountRewards().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
