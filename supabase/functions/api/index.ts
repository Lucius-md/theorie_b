// Theorie B server: one Edge Function, routes /functions/v1/api/<route>.
// Supabase gives this function its own keys automatically; no keys live in the website code.

const SB = Deno.env.get('SUPABASE_URL')!;
const SECRET = (() => { try { return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default; } catch { return undefined; } })();
const LEGACY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SITE = (Deno.env.get('SITE_URL') || 'https://theoriesaid.site').replace(/\/$/, '');
const PRICE = Number(Deno.env.get('PRICE_EUR') || '10');
const DAYS = 365;
const ORIGINS = [SITE, 'https://www.theoriesaid.site', 'https://theorieb.vercel.app'];

const adminHeaders = (): Record<string, string> => SECRET ? { apikey: SECRET } : { apikey: LEGACY!, Authorization: 'Bearer ' + LEGACY };
class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
const fail = (status: number, msg: string): never => { throw new HttpError(status, msg); };

async function sb(path: string, opt: RequestInit = {}) {
  const r = await fetch(SB + path, { ...opt, headers: { ...adminHeaders(), 'Content-Type': 'application/json', ...(opt.headers as Record<string, string> || {}) } });
  const t = await r.text();
  if (!r.ok) { console.error('db', r.status, t.slice(0, 300)); fail(502, 'Databasefout'); }
  return t ? JSON.parse(t) : null;
}
const rpc = (fn: string, args: unknown) => sb('/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });

type User = { id: string; email: string; email_confirmed_at?: string; confirmed_at?: string };
async function getUser(req: Request): Promise<User> {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) fail(401, 'Niet ingelogd');
  const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: SECRET || LEGACY!, Authorization: 'Bearer ' + token } });
  if (!r.ok) fail(401, 'Sessie verlopen, log opnieuw in');
  const u = await r.json();
  if (!u?.id) fail(401, 'Niet ingelogd');
  return u;
}
async function isAdmin(u: User) {
  if (!u.email || !(u.email_confirmed_at || u.confirmed_at)) return false;
  const rows = await sb('/rest/v1/admins?select=email&email=eq.' + encodeURIComponent(u.email.toLowerCase()));
  return rows.length > 0;
}
async function paidUntil(id: string): Promise<string | null> {
  const rows = await sb('/rest/v1/subscriptions?select=paid_until&user_id=eq.' + id);
  return rows[0]?.paid_until ?? null;
}
const active = (d: string | null) => !!d && new Date(d).getTime() > Date.now();
const priceFor = (p: number) => Math.max(0, Math.round(PRICE * (100 - (p || 0))) / 100);
const CODE_RE = /^[A-Z0-9_-]{3,40}$/;
const REASON: Record<string, string> = { onbekend: 'Deze code bestaat niet.', verlopen: 'Deze code is verlopen.', op: 'Deze code is al te vaak gebruikt.', 'al gebruikt': 'Je hebt deze code al gebruikt.' };

async function allUsers() {
  const out: any[] = [];
  for (let page = 1; page <= 20; page++) {
    const j = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const list = j.users || []; out.push(...list); if (list.length < 200) break;
  }
  return out;
}
async function userByEmail(email: string) {
  const e = String(email || '').trim().toLowerCase();
  const u = (await allUsers()).find(x => (x.email || '').toLowerCase() === e);
  if (!u) fail(404, 'Geen gebruiker met dit e-mailadres.');
  return u;
}
async function grantForPayment(row: any) {
  if (row.code) { try { await rpc('use_code', { p_user: row.user_id, p_code: row.code }); } catch (e) { console.error(e); } }
  await rpc('extend_subscription', { p_user: row.user_id, p_days: DAYS });
}

// Lesson content: built by tools/build.py into content.json in the GitHub repo, loaded once per instance.
const CONTENT_URLS = (Deno.env.get('CONTENT_URLS') || 'https://raw.githubusercontent.com/Lucius-md/theorie_b/main/content.enc').split(',');
// content.enc is AES-256-GCM (iv 12 bytes + ciphertext+tag, base64); the key is in table app_secrets.
let KEY: CryptoKey | null = null;
async function decrypt(b64: string) {
  if (!KEY) { const [row] = await sb('/rest/v1/app_secrets?select=value&name=eq.content_key'); if (!row) fail(500, 'content key missing');
    const raw = new Uint8Array(row.value.match(/../g).map((h: string) => parseInt(h, 16)));
    KEY = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']); }
  const bin = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bin.slice(0, 12) }, KEY, bin.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}
let CONTENT: { html: string; questions: unknown; qt: unknown } | null = null, CONTENT_AT = 0;
async function content() {
  if (CONTENT && Date.now() - CONTENT_AT < 10 * 60 * 1000) return CONTENT;
  const gh = Deno.env.get('GITHUB_TOKEN');
  for (const u of CONTENT_URLS) {
    try {
      const r = await fetch(u.trim(), { headers: gh ? { Authorization: 'Bearer ' + gh } : {} });
      if (r.ok) { CONTENT = await decrypt(await r.text()); CONTENT_AT = Date.now(); return CONTENT; }
    } catch (e) { console.error('content', u, e); }
  }
  if (CONTENT) return CONTENT;
  fail(503, 'Lessen konden niet geladen worden. Probeer het zo opnieuw.');
}

const ADMIN: Record<string, (b: any, me?: User) => Promise<unknown>> = {
  async stats() {
    const [users, subs, pays] = await Promise.all([allUsers(), sb('/rest/v1/subscriptions?select=paid_until'), sb('/rest/v1/payments?select=amount,created_at&processed=eq.true&status=neq.refunded')]);
    const now = Date.now();
    return { users: users.length, active: subs.filter((s: any) => new Date(s.paid_until).getTime() > now).length,
      revenue: pays.reduce((a: number, p: any) => a + Number(p.amount), 0),
      month: pays.filter((p: any) => now - new Date(p.created_at).getTime() < 30 * 864e5).reduce((a: number, p: any) => a + Number(p.amount), 0), payments: pays.length };
  },
  async codes() { return { codes: await sb('/rest/v1/codes?select=*&order=created_at.desc') }; },
  async createCode(b) {
    const code = String(b.code || '').trim().toUpperCase();
    if (!CODE_RE.test(code)) fail(400, 'Code: 3–40 tekens, alleen A–Z, 0–9, - en _.');
    const kind = b.kind === 'percent' ? 'percent' : 'free';
    const percent = kind === 'free' ? 100 : Math.min(99, Math.max(1, parseInt(b.percent, 10) || 0));
    const days = Math.min(3650, Math.max(1, parseInt(b.days, 10) || 365));
    const max_uses = b.max_uses ? Math.max(1, parseInt(b.max_uses, 10)) : null;
    const expires_at = b.expires_at ? (isNaN(Date.parse(b.expires_at)) ? fail(400, 'Ongeldige datum.') : new Date(b.expires_at).toISOString()) : null;
    const note = String(b.note || '').slice(0, 200) || null;
    if ((await sb('/rest/v1/codes?select=code&code=eq.' + encodeURIComponent(code))).length) fail(409, 'Deze code bestaat al.');
    await sb('/rest/v1/codes', { method: 'POST', body: JSON.stringify({ code, kind, percent, days, max_uses, expires_at, note }) });
    return { ok: true };
  },
  async setCode(b) { const c = String(b.code || '').toUpperCase(); if (!CODE_RE.test(c)) fail(400, 'Ongeldige code'); await sb('/rest/v1/codes?code=eq.' + encodeURIComponent(c), { method: 'PATCH', body: JSON.stringify({ active: !!b.active }) }); return { ok: true }; },
  async deleteCode(b) { const c = String(b.code || '').toUpperCase(); if (!CODE_RE.test(c)) fail(400, 'Ongeldige code'); await sb('/rest/v1/codes?code=eq.' + encodeURIComponent(c), { method: 'DELETE' }); return { ok: true }; },
  async users(b) {
    const [users, subs] = await Promise.all([allUsers(), sb('/rest/v1/subscriptions?select=user_id,paid_until')]);
    const m = Object.fromEntries(subs.map((s: any) => [s.user_id, s.paid_until]));
    const q = String(b.q || '').toLowerCase();
    return { users: users.filter(u => !q || (u.email || '').toLowerCase().includes(q)).sort((a, z) => +new Date(z.created_at) - +new Date(a.created_at)).slice(0, 200)
      .map(u => ({ email: u.email, created_at: u.created_at, confirmed: !!(u.email_confirmed_at || u.confirmed_at), last_sign_in_at: u.last_sign_in_at, paid_until: m[u.id] || null })) };
  },
  async grant(b) { const u = await userByEmail(b.email); const days = Math.min(3650, Math.max(1, parseInt(b.days, 10) || 365)); return { ok: true, paid_until: await rpc('extend_subscription', { p_user: u.id, p_days: days }) }; },
  async revoke(b) { const u = await userByEmail(b.email); await sb('/rest/v1/subscriptions?user_id=eq.' + u.id, { method: 'PATCH', body: JSON.stringify({ paid_until: new Date(Date.now() - 1000).toISOString(), updated_at: new Date().toISOString() }) }); return { ok: true }; },
  async codeUses(b) {
    const c = String(b.code || '').toUpperCase(); if (!CODE_RE.test(c)) fail(400, 'Ongeldige code');
    const [uses, users] = await Promise.all([sb('/rest/v1/code_uses?select=user_id,used_at&order=used_at.desc&code=eq.' + encodeURIComponent(c)), allUsers()]);
    const em = Object.fromEntries(users.map(u => [u.id, u.email]));
    return { uses: uses.map((x: any) => ({ email: em[x.user_id] || '?', used_at: x.used_at })) };
  },
  async resetPassword(b) {
    const u = await userByEmail(b.email);
    const r = await fetch(SB + '/auth/v1/recover?redirect_to=' + encodeURIComponent(SITE + '/'), { method: 'POST', headers: { apikey: SECRET || LEGACY!, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u.email }) });
    if (!r.ok) fail(502, 'Mail kon niet verstuurd worden (probeer later).');
    return { ok: true };
  },
  async deleteUser(b) {
    const u = await userByEmail(b.email);
    if (await isAdmin(u)) fail(400, 'Een beheerder kun je hier niet verwijderen.');
    await sb('/auth/v1/admin/users/' + u.id, { method: 'DELETE' });
    return { ok: true };
  },
  async admins() { return { admins: await sb('/rest/v1/admins?select=email,created_at&order=created_at') }; },
  async addAdmin(b) {
    const e = String(b.email || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail(400, 'Ongeldig e-mailadres.');
    await sb('/rest/v1/admins', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ email: e }) });
    return { ok: true };
  },
  async removeAdmin(b, me?: User) {
    const e = String(b.email || '').trim().toLowerCase();
    if (me && me.email.toLowerCase() === e) fail(400, 'Je kunt jezelf niet als beheerder verwijderen.');
    await sb('/rest/v1/admins?email=eq.' + encodeURIComponent(e), { method: 'DELETE' });
    return { ok: true };
  },
  async payments() {
    const [pays, users] = await Promise.all([sb('/rest/v1/payments?select=id,provider,method,user_id,amount,code,status,processed,created_at&order=created_at.desc&limit=500'), allUsers()]);
    const em = Object.fromEntries(users.map(u => [u.id, u.email]));
    return { payments: pays.map((p: any) => ({ ...p, email: em[p.user_id] || '?' })) };
  }
};

async function route(name: string, req: Request): Promise<unknown> {
  switch (name) {
    case 'status': {
      const u = await getUser(req); const until = await paidUntil(u.id); const admin = await isAdmin(u);
      return { email: u.email, paid_until: admin && !active(until) ? '2099-12-31T00:00:00Z' : until, active: admin || active(until), admin, price: PRICE,
        bitcoin: !!(Deno.env.get('BTCPAY_URL') && Deno.env.get('BTCPAY_STORE_ID') && Deno.env.get('BTCPAY_API_KEY')), payments: !!Deno.env.get('MOLLIE_API_KEY') };
    }
    case 'app': {
      const u = await getUser(req); const until = await paidUntil(u.id);
      if (!active(until) && !(await isAdmin(u))) fail(402, 'Geen actief abonnement');
      const c = (await content())!;
      return { html: c.html, questions: c.questions, qt: c.qt, paid_until: until };
    }
    case 'redeem': {
      const u = await getUser(req); const b = await req.json().catch(() => ({}));
      const since = new Date(Date.now() - 3600e3).toISOString();
      const tries = await sb('/rest/v1/redeem_attempts?select=at&user_id=eq.' + u.id + '&at=gte.' + since);
      if (tries.length >= 10) fail(429, 'Te veel pogingen. Probeer het over een uur opnieuw. · محاولات كتير، جرّب بعد ساعة.');
      await sb('/rest/v1/redeem_attempts', { method: 'POST', body: JSON.stringify({ user_id: u.id }) });
      const c = String(b.code || '').trim().toUpperCase();
      if (!CODE_RE.test(c)) fail(400, 'Ongeldige code.');
      const [chk] = await rpc('check_code', { p_user: u.id, p_code: c });
      if (!chk?.ok) fail(400, REASON[chk?.reason] || 'Deze code werkt niet.');
      if (!(chk.kind === 'free' || chk.percent >= 100)) return { ok: true, kind: 'percent', percent: chk.percent, price: priceFor(chk.percent), full: PRICE };
      if (!(await rpc('use_code', { p_user: u.id, p_code: c }))) fail(400, 'Deze code werkt niet meer.');
      return { ok: true, kind: 'free', paid_until: await rpc('extend_subscription', { p_user: u.id, p_days: chk.days || 365 }), active: true };
    }
    case 'checkout': {
      const u = await getUser(req); const b = await req.json().catch(() => ({}));
      let code: string | null = String(b.code || '').trim().toUpperCase() || null, amount = PRICE;
      if (code) {
        const [chk] = await rpc('check_code', { p_user: u.id, p_code: code });
        if (!chk?.ok) fail(400, 'Deze kortingscode werkt niet.');
        if (chk.kind === 'free' || chk.percent >= 100) fail(400, 'Dit is een gratis code: gebruik “Code inwisselen”.');
        amount = priceFor(chk.percent);
      }
      const value = amount.toFixed(2);
      if (b.method === 'bitcoin') {
        const base = (Deno.env.get('BTCPAY_URL') || '').replace(/\/$/, ''); if (!base) fail(400, 'Bitcoin is nog niet beschikbaar.');
        const r = await fetch(`${base}/api/v1/stores/${Deno.env.get('BTCPAY_STORE_ID')}/invoices`, { method: 'POST', headers: { Authorization: 'token ' + Deno.env.get('BTCPAY_API_KEY'), 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: value, currency: 'EUR', metadata: { user_id: u.id, code }, checkout: { redirectURL: SITE + '/?paid=1', redirectAutomatically: true } }) });
        const inv = await r.json(); if (!r.ok) { console.error(inv); fail(502, 'Bitcoin-betaling kon niet starten.'); }
        await sb('/rest/v1/payments', { method: 'POST', body: JSON.stringify({ id: inv.id, provider: 'btcpay', user_id: u.id, amount, code }) });
        return { url: inv.checkoutLink };
      }
      const key = Deno.env.get('MOLLIE_API_KEY'); if (!key) fail(400, 'Online betalen is nog niet beschikbaar. Gebruik een kortingscode of probeer het later.');
      const r = await fetch('https://api.mollie.com/v2/payments', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: { currency: 'EUR', value }, description: `Theorie B – toegang ${DAYS} dagen`, redirectUrl: SITE + '/?paid=1', webhookUrl: SB + '/functions/v1/api/mollie-webhook', locale: 'nl_NL', billingEmail: u.email, metadata: { user_id: u.id, code } }) });
      const p = await r.json(); if (!r.ok) { console.error(p); fail(502, 'Betaling kon niet starten.'); }
      await sb('/rest/v1/payments', { method: 'POST', body: JSON.stringify({ id: p.id, provider: 'mollie', user_id: u.id, amount, code }) });
      return { url: p._links.checkout.href };
    }
    case 'mollie-webhook': {
      const form = await req.formData().catch(() => null); const id = String(form?.get('id') || '');
      if (!/^tr_[A-Za-z0-9]+$/.test(id)) return { ignored: true };
      const r = await fetch('https://api.mollie.com/v2/payments/' + id, { headers: { Authorization: 'Bearer ' + Deno.env.get('MOLLIE_API_KEY') } });
      if (!r.ok) fail(502, 'Mollie niet bereikbaar');
      const p = await r.json(); const [row] = await sb('/rest/v1/payments?select=*&id=eq.' + id);
      if (!row) return { ignored: true };
      const back = Number(p.amountRefunded?.value || 0) + Number(p.amountChargedBack?.value || 0);
      if (row.processed && back > 0 && back + 0.001 >= Number(row.amount)) { await rpc('revoke_payment', { p_id: id }); return { ok: true, refunded: true }; }
      if (row.status === 'refunded') return { ok: true };
      await sb('/rest/v1/payments?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ status: p.status, method: p.method || null }) });
      if (p.status !== 'paid' || row.processed || Number(p.amount.value) + 0.001 < Number(row.amount)) return { ok: true };
      const claimed = await sb('/rest/v1/payments?id=eq.' + id + '&processed=eq.false', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ processed: true }) });
      if (claimed?.length) {
        try { await grantForPayment(row); }
        catch (e) { await sb('/rest/v1/payments?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ processed: false }) }); throw e; }
      }
      return { ok: true };
    }
    case 'btcpay-webhook': {
      const raw = new Uint8Array(await req.arrayBuffer()); const secret = Deno.env.get('BTCPAY_WEBHOOK_SECRET'); if (!secret) fail(400, 'not configured');
      const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const want = 'sha256=' + [...new Uint8Array(await crypto.subtle.sign('HMAC', k, raw))].map(x => x.toString(16).padStart(2, '0')).join('');
      const got = req.headers.get('btcpay-sig') || '';
      let diff = got.length ^ want.length; for (let i = 0; i < Math.min(got.length, want.length); i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
      if (diff) fail(401, 'bad signature');
      const ev = JSON.parse(new TextDecoder().decode(raw) || '{}');
      if (!ev.invoiceId) return { ok: true };
      if (ev.type === 'InvoiceExpired' || ev.type === 'InvoiceInvalid') { await sb('/rest/v1/payments?processed=eq.false&id=eq.' + encodeURIComponent(ev.invoiceId), { method: 'PATCH', body: JSON.stringify({ status: ev.type === 'InvoiceExpired' ? 'expired' : 'failed' }) }); return { ok: true }; }
      if (ev.type !== 'InvoiceSettled') return { ok: true };
      const [row] = await sb('/rest/v1/payments?select=*&id=eq.' + encodeURIComponent(ev.invoiceId)); if (!row) return { ignored: true };
      const claimed = await sb('/rest/v1/payments?id=eq.' + encodeURIComponent(ev.invoiceId) + '&processed=eq.false', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ processed: true, status: 'paid', method: 'bitcoin' }) });
      if (claimed?.length) { try { await grantForPayment(row); } catch (e) { await sb('/rest/v1/payments?id=eq.' + encodeURIComponent(ev.invoiceId), { method: 'PATCH', body: JSON.stringify({ processed: false }) }); throw e; } }
      return { ok: true };
    }
    case 'admin': {
      const u = await getUser(req); if (!(await isAdmin(u))) fail(403, 'Geen toegang');
      const b = await req.json().catch(() => ({})); const fn = ADMIN[b.action]; if (!fn) fail(400, 'Onbekende actie');
      return await fn(b, u);
    }
  }
  fail(404, 'Niet gevonden');
}

Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const cors: Record<string, string> = { 'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : SITE, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const name = new URL(req.url).pathname.split('/').filter(Boolean).pop() || '';
  try {
    const body = await route(name, req);
    return new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status >= 500) console.error(e);
    return new Response(JSON.stringify({ error: status >= 500 && !(e instanceof HttpError) ? 'Er ging iets mis op de server' : (e as Error).message }), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
  }
});
