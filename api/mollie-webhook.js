// POST /api/mollie-webhook (form: id=tr_xxx). Mollie calls this; we never trust the body,
// we fetch the payment from Mollie ourselves and only then give access.
const { handler, send, readBody, sb, rpc, env, DAYS } = require('./_lib');
module.exports = handler(async (req, res) => {
  const { id } = await readBody(req);
  if (!/^tr_[A-Za-z0-9]+$/.test(id || '')) return send(res, 200, { ignored: true });
  const r = await fetch('https://api.mollie.com/v2/payments/' + id, { headers: { Authorization: 'Bearer ' + env('MOLLIE_API_KEY') } });
  if (!r.ok) return send(res, 200, { ignored: true });
  const p = await r.json();
  const rows = await sb('/rest/v1/payments?id=eq.' + id + '&select=*');
  const row = rows && rows[0];
  if (!row) return send(res, 200, { ignored: true });
  await sb('/rest/v1/payments?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ status: p.status }) });
  if (p.status !== 'paid' || row.processed) return send(res, 200, { ok: true });
  if (Number(p.amount.value) + 0.001 < Number(row.amount)) return send(res, 200, { ok: true, underpaid: true });
  // claim the row first so a retried webhook can't extend twice
  const claimed = await sb('/rest/v1/payments?id=eq.' + id + '&processed=eq.false', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ processed: true }) });
  if (!claimed || !claimed.length) return send(res, 200, { ok: true });
  if (row.code) { try { await rpc('use_code', { p_user: row.user_id, p_code: row.code }); } catch (e) { console.error(e); } }
  await rpc('extend_subscription', { p_user: row.user_id, p_days: DAYS });
  send(res, 200, { ok: true });
});
