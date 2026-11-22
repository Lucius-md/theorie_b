// Shared helpers for the serverless functions. No npm packages: plain fetch (Node 18+).
const PRICE = Number(process.env.PRICE_EUR || '10.00');
const DAYS = 365;
const env = k => { const v = process.env[k]; if (!v) throw Object.assign(new Error('Server not configured: ' + k), { status: 500 }); return v; };
const SITE = () => (process.env.SITE_URL || '').replace(/\/$/, '');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? safeJson(req.body) : req.body;
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  req.rawBody = raw;
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return safeJson(raw);
}
const safeJson = s => { try { return JSON.parse(s || '{}'); } catch { return {}; } };

// Supabase as admin (service role): bypasses RLS, only on the server.
async function sb(path, opt = {}) {
  const r = await fetch(env('SUPABASE_URL') + path, {
    ...opt,
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY'), 'Content-Type': 'application/json', ...(opt.headers || {}) }
  });
  const txt = await r.text();
  if (!r.ok) throw Object.assign(new Error('Database error ' + r.status + ': ' + txt.slice(0, 200)), { status: 502 });
  return txt ? JSON.parse(txt) : null;
}
const rpc = (fn, args) => sb('/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });

// Who is calling? Verifies the user's access token with Supabase Auth.
async function getUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw Object.assign(new Error('Niet ingelogd'), { status: 401 });
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + token } });
  if (!r.ok) throw Object.assign(new Error('Sessie verlopen, log opnieuw in'), { status: 401 });
  const u = await r.json();
  if (!u || !u.id) throw Object.assign(new Error('Niet ingelogd'), { status: 401 });
  return u;
}

async function paidUntil(userId) {
  const rows = await sb('/rest/v1/subscriptions?select=paid_until&user_id=eq.' + encodeURIComponent(userId));
  return rows && rows[0] ? rows[0].paid_until : null;
}
const isActive = d => !!d && new Date(d).getTime() > Date.now();

function handler(fn, methods = ['POST']) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) return send(res, 405, { error: 'Method not allowed' });
      await fn(req, res);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      send(res, status, { error: status >= 500 && !String(e.message).startsWith('Server not configured') ? 'Er ging iets mis op de server' : e.message });
    }
  };
}

// Price after a percentage code; never below €0.
const priceFor = percent => Math.max(0, Math.round(PRICE * (100 - (percent || 0))) / 100);

module.exports = { PRICE, DAYS, env, SITE, send, readBody, sb, rpc, getUser, paidUntil, isActive, handler, priceFor };
