// POST /api/btcpay-webhook. BTCPay signs the body with HMAC-SHA256 (header BTCPay-Sig: sha256=...).
const crypto = require('crypto');
const { handler, send, sb, rpc, env, DAYS } = require('./_lib');
module.exports = handler(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);
  const sig = String(req.headers['btcpay-sig'] || '');
  const want = 'sha256=' + crypto.createHmac('sha256', env('BTCPAY_WEBHOOK_SECRET')).update(raw).digest('hex');
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return send(res, 401, { error: 'bad signature' });
  const ev = JSON.parse(raw.toString('utf8') || '{}');
  if (ev.type !== 'InvoiceSettled' || !ev.invoiceId) return send(res, 200, { ok: true });
  const rows = await sb('/rest/v1/payments?id=eq.' + encodeURIComponent(ev.invoiceId) + '&select=*');
  const row = rows && rows[0];
  if (!row) return send(res, 200, { ignored: true });
  const claimed = await sb('/rest/v1/payments?id=eq.' + encodeURIComponent(ev.invoiceId) + '&processed=eq.false', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ processed: true, status: 'paid' }) });
  if (!claimed || !claimed.length) return send(res, 200, { ok: true });
  if (row.code) { try { await rpc('use_code', { p_user: row.user_id, p_code: row.code }); } catch (e) { console.error(e); } }
  await rpc('extend_subscription', { p_user: row.user_id, p_days: DAYS });
  send(res, 200, { ok: true });
});
module.exports.config = { api: { bodyParser: false } };
