// POST /api/billing/checkout — Create Stripe Checkout session
export async function onRequestPost({ request, env, data }) {
  if (!data.userId) return Response.json({ ok: false, error: 'Login required' }, { status: 401 });
  if (!env.STRIPE_SECRET_KEY) return Response.json({ ok: false, error: 'Stripe not configured' }, { status: 500 });

  const origin = new URL(request.url).origin;

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': env.STRIPE_PRICE_ID || 'price_xxx',
      'line_items[0][quantity]': '1',
      'success_url': origin + '/?upgraded=true',
      'cancel_url': origin + '/',
      'client_reference_id': data.userId,
      'customer_email': data.email || '',
    }),
  });

  const session = await res.json();
  if (session.error) return Response.json({ ok: false, error: session.error.message }, { status: 400 });

  return Response.json({ ok: true, data: { url: session.url } });
}
