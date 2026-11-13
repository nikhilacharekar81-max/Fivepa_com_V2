import test from 'node:test';
import assert from 'node:assert';
import { postgresStore } from '../server/db/postgresStore.js';
import { store, hydrateStoreFromPostgres } from '../server/store.js';
import { processProjectInvoiceReminders, calculateInvoiceReviewDeadline } from '../server/services/orderService.js';

test('FIX G: Project invoice auto-release reminders', async (t) => {
  await postgresStore.runMigrations();
  await hydrateStoreFromPostgres();

  const suffix = Date.now().toString();
  const buyerId = `usr_buyer_rem_${suffix}`;
  const sellerId = `usr_seller_rem_${suffix}`;
  const orderId = `ord_proj_rem_${suffix}`;
  const invoiceId = `inv_rem_${suffix}`;

  await store.saveUser({
    id: buyerId,
    name: 'Reminder Buyer',
    email: `rem_buyer_${suffix}@example.com`,
    role: 'Employer',
    ActiveRole: 'buyer'
  } as any);

  await store.saveUser({
    id: sellerId,
    name: 'Reminder Seller',
    email: `rem_seller_${suffix}@example.com`,
    role: 'Freelancer',
    ActiveRole: 'seller'
  } as any);

  const createdAtDate = new Date(Date.now() - 1000); // 1 second ago
  const createdAtIso = createdAtDate.toISOString();

  const project = {
    id: `proj_${suffix}`,
    buyerId,
    buyerName: 'Reminder Buyer',
    title: 'Website Redesign Project',
    category: 'Development',
    description: 'Project description for testing',
    budgetMin: 100,
    budgetMax: 1000,
    deadlineDays: 14,
    status: 'open',
    createdAt: createdAtIso
  };
  await store.saveProject(project as any);

  const projectOrder = {
    id: orderId,
    orderType: 'project',
    projectId: `proj_${suffix}`,
    title: 'Website Redesign Project',
    buyerId,
    sellerId,
    amount: 500,
    status: 'in_progress',
    createdAt: createdAtIso,
    reviewWindowDays: 7
  };
  await store.saveOrder(projectOrder as any);

  const pendingInvoice = {
    id: invoiceId,
    number: `INV-${suffix}`,
    orderId,
    kind: 'invoice',
    title: 'Final Project Milestone',
    amount: 500,
    status: 'pending',
    createdBy: sellerId,
    createdAt: createdAtIso,
    metadata: {
      invoiceReminders: {}
    }
  };
  await store.saveOffer(pendingInvoice as any);

  await t.test('calculateInvoiceReviewDeadline computes 7 days for project order', () => {
    const deadline = calculateInvoiceReviewDeadline(projectOrder, pendingInvoice);
    assert.ok(deadline);
    const expected = createdAtDate.getTime() + 7 * 24 * 60 * 60 * 1000;
    assert.strictEqual(Math.abs(deadline - expected) < 1000, true);
  });

  await t.test('Sends initial reminder on first sweep and records flag in metadata', async () => {
    const sweepTime = createdAtDate.getTime() + 1000;
    const reminders = await processProjectInvoiceReminders(sweepTime);
    const sent = reminders.filter(r => r.invoiceId === invoiceId);
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(sent[0].reminderType, 'initial');

    const updatedOffer = await store.getOfferById(invoiceId);
    assert.strictEqual(updatedOffer?.metadata?.invoiceReminders?.initial, true);
  });

  await t.test('Idempotency / Restart: does not re-send initial reminder on subsequent sweep', async () => {
    const sweepTime = createdAtDate.getTime() + 2000;
    const reminders = await processProjectInvoiceReminders(sweepTime);
    const sent = reminders.filter(r => r.invoiceId === invoiceId && r.reminderType === 'initial');
    assert.strictEqual(sent.length, 0);
  });

  await t.test('Sends day3 reminder after 3 days elapsed, exactly once', async () => {
    // Sweep at 3.1 days
    const day3Time = createdAtDate.getTime() + 3.1 * 24 * 60 * 60 * 1000;
    const reminders = await processProjectInvoiceReminders(day3Time);
    const sent = reminders.filter(r => r.invoiceId === invoiceId);
    assert.strictEqual(sent.some(r => r.reminderType === 'day3'), true);

    // Immediate re-run at 3.2 days: should NOT re-send day3
    const reminders2 = await processProjectInvoiceReminders(day3Time + 3600 * 1000);
    const sent2 = reminders2.filter(r => r.invoiceId === invoiceId && r.reminderType === 'day3');
    assert.strictEqual(sent2.length, 0);

    const updatedOffer = await store.getOfferById(invoiceId);
    assert.strictEqual(updatedOffer?.metadata?.invoiceReminders?.day3, true);
  });

  await t.test('Sends day6 and hours24 reminders as deadlines approach, each once', async () => {
    // Sweep at 6.1 days
    const day6Time = createdAtDate.getTime() + 6.1 * 24 * 60 * 60 * 1000;
    const reminders = await processProjectInvoiceReminders(day6Time);
    assert.strictEqual(reminders.some(r => r.invoiceId === invoiceId && r.reminderType === 'day6'), true);
    assert.strictEqual(reminders.some(r => r.invoiceId === invoiceId && r.reminderType === 'hours24'), true);

    // Re-sweep: neither day6 nor hours24 should re-fire
    const remindersRecheck = await processProjectInvoiceReminders(day6Time + 1000);
    assert.strictEqual(remindersRecheck.filter(r => r.invoiceId === invoiceId).length, 0);

    const updatedOffer = await store.getOfferById(invoiceId);
    assert.strictEqual(updatedOffer?.metadata?.invoiceReminders?.day6, true);
    assert.strictEqual(updatedOffer?.metadata?.invoiceReminders?.hours24, true);
  });

  await t.test('Reminders are NOT sent when a dispute is open', async () => {
    const disputeOrderId = `ord_dispute_${suffix}`;
    const disputeInvoiceId = `inv_dispute_${suffix}`;

    await store.saveProject({
      id: `proj_d_${suffix}`,
      buyerId,
      buyerName: 'Reminder Buyer',
      title: 'Disputed Project',
      category: 'Development',
      description: 'Disputed project description',
      budgetMin: 100,
      budgetMax: 800,
      deadlineDays: 7,
      status: 'open',
      createdAt: createdAtIso
    } as any);

    await store.saveOrder({
      id: disputeOrderId,
      orderType: 'project',
      projectId: `proj_d_${suffix}`,
      title: 'Disputed Project',
      buyerId,
      sellerId,
      amount: 400,
      status: 'disputed',
      createdAt: createdAtIso,
      reviewWindowDays: 7
    } as any);

    await store.saveOffer({
      id: disputeInvoiceId,
      number: `INV-DISP-${suffix}`,
      orderId: disputeOrderId,
      kind: 'invoice',
      title: 'Disputed Invoice',
      amount: 400,
      status: 'pending',
      createdBy: sellerId,
      createdAt: createdAtIso,
      metadata: { invoiceReminders: {} }
    } as any);

    await store.saveDispute({
      id: `disp_${suffix}`,
      orderId: disputeOrderId,
      buyerId,
      sellerId,
      raisedBy: buyerId,
      status: 'open',
      reason: 'Work incomplete',
      createdAt: createdAtIso
    } as any);

    const reminders = await processProjectInvoiceReminders(createdAtDate.getTime() + 3.5 * 24 * 60 * 60 * 1000);
    const sent = reminders.filter(r => r.invoiceId === disputeInvoiceId);
    assert.strictEqual(sent.length, 0, 'No reminders should be sent for disputed order');
  });

  await t.test('Reminders are NOT sent when invoice is already paid or cancelled', async () => {
    const paidInvoiceId = `inv_paid_${suffix}`;
    await store.saveOffer({
      id: paidInvoiceId,
      number: `INV-PAID-${suffix}`,
      orderId,
      kind: 'invoice',
      title: 'Paid Invoice',
      amount: 500,
      status: 'paid',
      createdBy: sellerId,
      createdAt: createdAtIso,
      metadata: { invoiceReminders: {} }
    } as any);

    const reminders = await processProjectInvoiceReminders(createdAtDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    const sent = reminders.filter(r => r.invoiceId === paidInvoiceId);
    assert.strictEqual(sent.length, 0, 'Paid invoice must not trigger reminders');
  });
}).then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

