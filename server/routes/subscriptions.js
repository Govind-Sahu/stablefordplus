import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';
import { getUncachableStripeClient } from '../stripeClient.js';

const router = Router();

function getAppUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  return `${req.protocol}://${req.get('host')}`;
}

router.get('/plans', async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 20 }),
      stripe.prices.list({ active: true, limit: 50 }),
    ]);

    const plans = {};
    for (const product of products.data) {
      plans[product.id] = {
        id: product.id,
        name: product.name,
        description: product.description,
        prices: [],
      };
    }
    for (const price of prices.data) {
      if (plans[price.product]) {
        plans[price.product].prices.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        });
      }
    }

    const result = Object.values(plans)
      .filter(p => p.prices.length > 0)
      .map(p => ({ ...p, prices: p.prices.sort((a, b) => a.unit_amount - b.unit_amount) }));

    res.json({ plans: result });
  } catch (err) {
    console.error('Get plans error:', err.message);
    res.status(500).json({ error: 'Failed to fetch plans', plans: [] });
  }
});

router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT stripe_subscription_id, subscription_status FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!user.rows[0]?.stripe_subscription_id) {
      return res.json({ subscription: null, status: user.rows[0]?.subscription_status || 'inactive' });
    }
    try {
      const stripe = await getUncachableStripeClient();
      const sub = await stripe.subscriptions.retrieve(user.rows[0].stripe_subscription_id);
      return res.json({ subscription: sub, status: user.rows[0].subscription_status });
    } catch {
      return res.json({ subscription: null, status: user.rows[0].subscription_status });
    }
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { price_id } = req.body;
    if (!price_id) return res.status(400).json({ error: 'price_id is required' });

    const stripe = await getUncachableStripeClient();
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const u = user.rows[0];

    let customerId = u.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: u.email,
        name: u.name,
        metadata: { userId: u.id },
      });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id=$1 WHERE id=$2', [customerId, u.id]);
    }

    const baseUrl = getAppUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/subscribe?cancelled=true`,
      metadata: { userId: u.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

router.post('/portal', authenticate, async (req, res) => {
  try {
    const user = await pool.query('SELECT stripe_customer_id FROM users WHERE id=$1', [req.user.id]);
    const customerId = user.rows[0]?.stripe_customer_id;
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found' });

    const stripe = await getUncachableStripeClient();
    const baseUrl = getAppUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: err.message || 'Failed to create portal session' });
  }
});

export default router;
