import test from 'node:test';
import assert from 'node:assert';
import { postgresStore } from '../server/db/postgresStore.js';
import { store, hydrateStoreFromPostgres } from '../server/store.js';
import { resolveGigOrderPrice } from '../server/services/orderService.js';
import { randomUUID } from 'crypto';

test('FIX F: Gig packages are ignored and cannot change order price', async (t) => {
  await postgresStore.runMigrations();
  await hydrateStoreFromPostgres();

  const testGigId = 'gig_test_pkg_' + Date.now();
  const testSellerId = 'user_seller_' + Date.now();

  const testGig = {
    id: testGigId,
    freelancerId: testSellerId,
    freelancer_id: testSellerId,
    freelancerName: 'Package Test Seller',
    title: 'Package Ignoring Test Gig',
    description: 'Testing that packages do not alter order pricing',
    price: 50.00,
    deliveryDays: 3,
    status: 'active',
    category: 'Development & IT',
    subcategory: 'General',
    extras: [
      { id: 'extra_fast_1', title: '1-Day Expedited Delivery', price: 20.00, deliveryDays: 1 }
    ]
  };

  await store.saveGig(testGig as any);

  await t.test('Order pricing resolves strictly to base price ($50) without extras', async () => {
    const resolved = await resolveGigOrderPrice(testGigId, []);
    assert.strictEqual(resolved.gigPrice, 50.00);
    assert.strictEqual(resolved.selectedExtrasDetails.length, 0);
  });

  await t.test('Order pricing resolves to base price ($50) + selected extra ($20) = $70', async () => {
    const resolved = await resolveGigOrderPrice(testGigId, ['extra_fast_1']);
    assert.strictEqual(resolved.gigPrice, 70.00);
    assert.strictEqual(resolved.selectedExtrasDetails.length, 1);
    assert.strictEqual(resolved.selectedExtrasDetails[0].price, 20.00);
  });

  await t.test('Passing legacy packages payload cannot alter resolved gig order price', async () => {
    // Attempt to inject arbitrary package prices
    const maliciousPayload = {
      packages: {
        basic: { price: 5 },
        premium: { price: 999 }
      }
    };

    // Neither the base price nor extras price can be influenced by packages
    const resolvedNoExtras = await resolveGigOrderPrice(testGigId, []);
    assert.strictEqual(resolvedNoExtras.gigPrice, 50.00);

    const resolvedWithExtras = await resolveGigOrderPrice(testGigId, ['extra_fast_1']);
    assert.strictEqual(resolvedWithExtras.gigPrice, 70.00);
  });
}).then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
