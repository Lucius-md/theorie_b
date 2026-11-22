// POST /api/admin { action, ... } — only for e-mails in ADMIN_EMAILS.
const { handler, send, readBody, getUser, isAdmin, sb, rpc, env } = require('./_lib');

const CODE_RE = /^[A-Z0-9_-]{3,40}$/;
const enc = encodeURIComponent;

async function allUsers() {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`${env('SUPABASE_URL')}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY') }
    });
    if (!r.ok) throw Object.assign(new Error('Gebruikers ophalen mislukt'), { status: 502 });
    const j = await r.json(); const list = j.users || [];
    out.push(...list);
    if (list.length < 200) break;
  }
  return out;
}
async function userByEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const u = (await allUsers()).find(x => (x.email || '').toLowerCase() === e);
  if (!u) throw Object.assign(new Error('Geen gebruiker met dit e-mailadres.'), { status: 404 });
  return u;
}

const actions = {
  async stats() {
    const [users, subs, pays] = await Promise.all([
      allUsers(),
      sb('/rest/v1/subscriptions?select=user_id,paid_until'),
      sb('/rest/v1/payments?select=amount,processed,created_at&processed=eq.true')
    ]);
    const now = Date.now();
    const active = subs.filter(s => new Date(s.paid_until).getTime() > now).length;
    const revenue = pays.reduce((a, p) => a + Number(p.amount), 0);
    const month = pays.filter(p => now - new Date(p.created_at).getTime() < 30 * 864e5).reduce((a, p) => a + Number(p.amount), 0);
    return { users: users.length, active, revenue, month, payments: pays.length };
  },
  async codes() {
    return { codes: await sb('/rest/v1/codes?select=*&order=created_at.desc') };
  },
  async createCode(b) {
    const code = String(b.code || '').trim().toUpperCase();
    if (!CODE_RE.test(code)) throw Object.assign(new Error('Code: 3–40 tekens, alleen A–Z, 0–9, - en _.'), { status: 400 });
    const kind = b.kind === 'percent' ? 'percent' : 'free';
    const percent = kind === 'free' ? 100 : Math.min(99, Math.max(1, parseInt(b.percent, 10) || 0));
    const days = Math.min(3650, Math.max(1, parseInt(b.days, 10) || 365));
    const max_uses = b.max_uses ? Math.max(1, parseInt(b.max_uses, 10)) : null;
    const expires_at = b.expires_at ? new Date(b.expires_at + 'T23:59:59').toISOString() : null;
    const note = String(b.note || '').slice(0, 200) || null;
    const exists = await sb('/rest/v1/codes?select=code&code=eq.' + enc(code));
    if (exists.length) throw Object.assign(new Error('Deze code bestaat al.'), { status: 409 });
    await sb('/rest/v1/codes', { method: 'POST', body: JSON.stringify({ code, kind, percent, days, max_uses, expires_at, note }) });
    return { ok: true };
  },
  async setCode(b) {
    const code = String(b.code || '').toUpperCase();
    if (!CODE_RE.test(code)) throw Object.assign(new Error('Ongeldige code'), { status: 400 });
    await sb('/rest/v1/codes?code=eq.' + enc(code), { method: 'PATCH', body: JSON.stringify({ active: !!b.active }) });
    return { ok: true };
  },
  async deleteCode(b) {
    const code = String(b.code || '').toUpperCase();
    if (!CODE_RE.test(code)) throw Object.assign(new Error('Ongeldige code'), { status: 400 });
    await sb('/rest/v1/codes?code=eq.' + enc(code), { method: 'DELETE' });
    return { ok: true };
  },
  async users(b) {
    const [users, subs] = await Promise.all([allUsers(), sb('/rest/v1/subscriptions?select=user_id,paid_until')]);
    const m = Object.fromEntries(subs.map(s => [s.user_id, s.paid_until]));
    const q = String(b.q || '').toLowerCase();
    const list = users.filter(u => !q || (u.email || '').toLowerCase().includes(q))
      .sort((a, z) => new Date(z.created_at) - new Date(a.created_at)).slice(0, 200)
      .map(u => ({ email: u.email, created_at: u.created_at, confirmed: !!(u.email_confirmed_at || u.confirmed_at), last_sign_in_at: u.last_sign_in_at, paid_until: m[u.id] || null }));
    return { users: list };
  },
  async grant(b) {
    const u = await userByEmail(b.email);
    const days = Math.min(3650, Math.max(1, parseInt(b.days, 10) || 365));
    return { ok: true, paid_until: await rpc('extend_subscription', { p_user: u.id, p_days: days }) };
  },
  async revoke(b) {
    const u = await userByEmail(b.email);
    await sb('/rest/v1/subscriptions?user_id=eq.' + u.id, { method: 'PATCH', body: JSON.stringify({ paid_until: new Date(Date.now() - 1000).toISOString(), updated_at: new Date().toISOString() }) });
    return { ok: true };
  },
  async payments() {
    const pays = await sb('/rest/v1/payments?select=id,provider,user_id,amount,code,status,processed,created_at&order=created_at.desc&limit=100');
    const users = await allUsers(); const em = Object.fromEntries(users.map(u => [u.id, u.email]));
    return { payments: pays.map(p => ({ ...p, email: em[p.user_id] || '?' })) };
  }
};

module.exports = handler(async (req, res) => {
  const u = await getUser(req);
  if (!isAdmin(u)) return send(res, 403, { error: 'Geen toegang' });
  const b = await readBody(req);
  const fn = actions[b.action];
  if (!fn) return send(res, 400, { error: 'Onbekende actie' });
  send(res, 200, await fn(b));
});
