// POST /api/checkout { code?, method?: 'mollie' | 'bitcoin' } → { url } of the payment page
const { handler, send, readBody, getUser, rpc, sb, priceFor, PRICE, DAYS, env, SITE } = require('./_lib');
module.exports = handler(async (req, res) => {
  const u = await getUser(req);
  const body = await readBody(req);
  let code = String(body.code || '').trim().toUpperCase() || null, amount = PRICE;
  if (code) {
    const [chk] = await rpc('check_code', { p_user: u.id, p_code: code });
    if (!chk || !chk.ok) return send(res, 400, { error: 'Deze kortingscode werkt niet.' });
    if (chk.kind === 'free' || chk.percent >= 100) return send(res, 400, { error: 'Dit is een gratis code: gebruik “Code inwisselen”.' });
    amount = priceFor(chk.percent);
  }
  const site = SITE() || ('https://' + req.headers.host);
  const value = amount.toFixed(2);
  if (body.method === 'bitcoin') {
    const base = env('BTCPAY_URL').replace(/\/$/, '');
    const r = await fetch(`${base}/api/v1/stores/${env('BTCPAY_STORE_ID')}/invoices`, {
      method: 'POST', headers: { Authorization: 'token ' + env('BTCPAY_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, currency: 'EUR', metadata: { user_id: u.id, code, orderId: 'tb-' + u.id.slice(0, 8) + '-' + Date.now() }, checkout: { redirectURL: site + '/?paid=1', redirectAutomatically: true } })
    });
    const inv = await r.json();
    if (!r.ok) throw Object.assign(new Error('BTCPay: ' + JSON.stringify(inv).slice(0, 200)), { status: 502 });
    await sb('/rest/v1/payments', { method: 'POST', body: JSON.stringify({ id: inv.id, provider: 'btcpay', user_id: u.id, amount, code }) });
    return send(res, 200, { url: inv.checkoutLink });
  }
  const r = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST', headers: { Authorization: 'Bearer ' + env('MOLLIE_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: { currency: 'EUR', value },
      description: `Theorie B – toegang ${DAYS} dagen`,
      redirectUrl: site + '/?paid=1',
      webhookUrl: site + '/api/mollie-webhook',
      locale: 'nl_NL',
      metadata: { user_id: u.id, code }
    })
  });
  const p = await r.json();
  if (!r.ok) throw Object.assign(new Error('Mollie: ' + (p.detail || r.status)), { status: 502 });
  await sb('/rest/v1/payments', { method: 'POST', body: JSON.stringify({ id: p.id, provider: 'mollie', user_id: u.id, amount, code }) });
  send(res, 200, { url: p._links.checkout.href });
});
