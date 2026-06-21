import app from './app.js';
import { getStripeSync } from './stripeClient.js';

const PORT = process.env.PORT || 3001;

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.warn('DATABASE_URL not set — skipping Stripe init'); return; }
  try {
    const { runMigrations } = await import('stripe-replit-sync');
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    console.log('Stripe schema ready');
    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log('Stripe webhook configured');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch(err => console.error('Stripe backfill error:', err.message));
  } catch (err) {
    console.error('Stripe init failed (continuing without Stripe):', err.message);
  }
}

await initStripe();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
