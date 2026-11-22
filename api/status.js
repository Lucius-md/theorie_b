// GET /api/status → { email, paid_until, active, price, methods }
const { handler, send, getUser, paidUntil, isActive, isAdmin, PRICE } = require('./_lib');
module.exports = handler(async (req, res) => {
  const u = await getUser(req);
  const until = await paidUntil(u.id);
  const admin = isAdmin(u);
  send(res, 200, { email: u.email, paid_until: admin && !isActive(until) ? '2099-12-31T00:00:00Z' : until, active: admin || isActive(until), admin, price: PRICE, bitcoin: !!(process.env.BTCPAY_URL && process.env.BTCPAY_STORE_ID && process.env.BTCPAY_API_KEY) });
}, ['GET']);
