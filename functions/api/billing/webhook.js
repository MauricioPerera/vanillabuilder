// POST /api/billing/webhook — Stripe webhook handler
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response('Not configured', { status: 500 });

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  // Verify Stripe signature
  const verified = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(body);

  if (event.type === 'checkout.session.completed') {
    const userId = event.data.object.client_reference_id;
    if (userId) {
      await env.DB.prepare('UPDATE users SET plan = ?, stripe_customer_id = ? WHERE id = ?')
        .bind('pro', event.data.object.customer, userId).run();
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const customerId = event.data.object.customer;
    if (customerId) {
      await env.DB.prepare('UPDATE users SET plan = ? WHERE stripe_customer_id = ?')
        .bind('free', customerId).run();
    }
  }

  return new Response('ok');
}

async function verifyStripeSignature(body, sigHeader, secret) {
  try {
    const parts = {};
    for (const item of sigHeader.split(',')) {
      const [k, v] = item.split('=');
      parts[k] = v;
    }
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return false;

    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expectedHex = [...new Uint8Array(expected)].map(b => b.toString(16).padStart(2, '0')).join('');

    return expectedHex === signature;
  } catch {
    return false;
  }
}
