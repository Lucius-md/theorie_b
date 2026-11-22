// POST /api/redeem { code } → free code: activates the subscription; percent code: returns the new price
const { handler, send, readBody, getUser, rpc, priceFor, PRICE } = require('./_lib');
const REASON = { onbekend: 'Deze code bestaat niet.', verlopen: 'Deze code is verlopen.', op: 'Deze code is al te vaak gebruikt.', 'al gebruikt': 'Je hebt deze code al gebruikt.' };
module.exports = handler(async (req, res) => {
  const u = await getUser(req);
  const { code } = await readBody(req);
  const c = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(c)) return send(res, 400, { error: 'Ongeldige code.' });
  const [chk] = await rpc('check_code', { p_user: u.id, p_code: c });
  if (!chk || !chk.ok) return send(res, 400, { error: REASON[chk && chk.reason] || 'Deze code werkt niet.' });
  const free = chk.kind === 'free' || chk.percent >= 100;
  if (!free) return send(res, 200, { ok: true, kind: 'percent', percent: chk.percent, price: priceFor(chk.percent), full: PRICE });
  const used = await rpc('use_code', { p_user: u.id, p_code: c });
  if (!used) return send(res, 400, { error: 'Deze code werkt niet meer.' });
  const until = await rpc('extend_subscription', { p_user: u.id, p_days: chk.days || 365 });
  send(res, 200, { ok: true, kind: 'free', paid_until: until, active: true });
});
