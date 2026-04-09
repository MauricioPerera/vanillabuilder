// GET /api/auth/plan — get current plan details
export async function onRequestGet({ env, data }) {
  if (!data.userId) return Response.json({ ok: true, data: { plan: 'anonymous', limits: {} } });

  const user = await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(data.userId).first();
  const plan = user?.plan || 'free';

  const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?').bind(data.userId).first();

  const plans = {
    free: { name: 'Free', pages: 3, dataSources: 0, formActions: 0, export: false, price: '$0' },
    pro: { name: 'Pro', pages: -1, dataSources: -1, formActions: -1, export: true, price: '$9/mo' },
  };

  return Response.json({
    ok: true,
    data: {
      plan,
      details: plans[plan] || plans.free,
      usage: { pages: count },
    },
  });
}
