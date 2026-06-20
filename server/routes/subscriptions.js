import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db.js';
import { getUncachableStripeClient, getStripeSync } from '../stripeClient.js';

const router = Router();

router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id as product_id, p.name, p.description, p.metadata,
              pr.id as price_id, pr.unit_amount, pr.currency, pr.recurring
       FROM stripe.products p
       JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
       WHERE p.active = true
       ORDER BY pr.unit_amount ASC`
    );
    const plans = {};
    for (const row of result.rows) {
      if (!plans[row.product_id]) {
        plans[row.product_id] = {
          id: row.product_id,
          name: row.name,
          description: row.description,
          metadata: row.metadata,
          prices: [],
        };
      }
      plans[row.product_id].prices.push({
        id: row.price_id,
        unit_amount: row.unit_amount,
        currency: row.currency,
        recurring: row.recurring,
      });
    }
    res.json({ plans: Object.values(plans) });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT stripe_subscription_id, subscription_status FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!user.rows[0]?.stripe_subscription_id) {
      return res.json({ subscription: null, status: 'inactive' });
    }
    const sub = await pool.query(
      'SELECT * FROM stripe.subscriptions WHERE id=$1',
      [user.rows[0].stripe_subscription_id]
    );
    res.json({
      subscription: sub.rows[0] || null,
      status: user.rows[0].subscription_status,
    });
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

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
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
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/portal', authenticate, async (req, res) => {
  try {
    const user = await pool.query('SELECT stripe_customer_id FROM users WHERE id=$1', [req.user.id]);
    const customerId = user.rows[0]?.stripe_customer_id;
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found' });

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;
