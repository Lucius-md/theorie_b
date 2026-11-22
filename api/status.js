// GET /api/status → { email, paid_until, active, price, methods }
const { handler, send, getUser, paidUntil, isActive, PRICE } = require('./_lib');
module.exports = handler(async (req, res) => {
  const u = await getUser(req);
  const until = await paidUntil(u.id);
  send(res, 200, { email: u.email, paid_until: until, active: isActive(until), price: PRICE, bitcoin: !!(process.env.BTCPAY_URL && process.env.BTCPAY_STORE_ID && process.env.BTCPAY_API_KEY) });
}, ['GET']);
