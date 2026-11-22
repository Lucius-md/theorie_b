/* Accounts, abonnement en voortgang per gebruiker.
   Flow: inloggen (e-mail + wachtwoord) → /api/status → actief? dan /api/app (lessen) laden, anders betalen of code. */
(() => {
  const C = window.TB_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AK = 'tb-auth', PEND = 'tb-pending-code';
  const configured = C.SUPABASE_URL && !C.SUPABASE_URL.includes('JOUW-PROJECT');
  let S = null; // { access_token, refresh_token, expires_at, user:{id,email} }
  try { S = JSON.parse(localStorage.getItem(AK) || 'null'); } catch { S = null; }
  const keep = () => { try { S ? localStorage.setItem(AK, JSON.stringify(S)) : localStorage.removeItem(AK); } catch {} };

  /* ---------- Supabase Auth (REST, no library) ---------- */
  async function auth(path, body, method = 'POST', token) {
    const r = await fetch(C.SUPABASE_URL + '/auth/v1/' + path, {
      method, headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const t = await r.text(); const j = t ? JSON.parse(t) : {};
    if (!r.ok) throw new Error(nlErr(j.error_description || j.msg || j.message || j.error || r.status));
    return j;
  }
  const nlErr = m => {
    m = String(m);
    if (/invalid login|invalid_grant|Invalid login credentials/i.test(m)) return 'E-mail of wachtwoord klopt niet. Nog geen account? Klik op “Account maken”. · الإيميل أو كلمة السر غلط. إذا ما عندك حساب، اضغط «Account maken».';
    if (/already registered|already exists/i.test(m)) return 'Er bestaat al een account met dit e-mailadres. Log in.';
    if (/email not confirmed/i.test(m)) return 'Bevestig eerst je e-mailadres via de link in je mail.';
    if (/password.*(6|characters|short)/i.test(m)) return 'Je wachtwoord moet minstens 8 tekens hebben.';
    if (/rate limit|too many/i.test(m)) return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
    return m;
  };
  const setSession = j => { try { localStorage.setItem('tb-known', '1'); } catch {} S = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: { id: j.user.id, email: j.user.email } }; keep(); };
  async function token() {
    if (!S) return null;
    if (Date.now() > S.expires_at - 60000) {
      try { setSession(await auth('token?grant_type=refresh_token', { refresh_token: S.refresh_token })); }
      catch { S = null; keep(); return null; }
    }
    return S.access_token;
  }
  async function api(path, opt = {}) {
    const t = await token(); if (!t) throw Object.assign(new Error('Log opnieuw in.'), { status: 401 });
    const r = await fetch(C.SUPABASE_URL + '/functions/v1/api/' + path, { ...opt, headers: { Authorization: 'Bearer ' + t, apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || 'Er ging iets mis.'), { status: r.status, data: j });
    return j;
  }

  /* ---------- links from e-mail (bevestigen / wachtwoord vergeten) ---------- */
  let recovery = false;
  if (/access_token=/.test(location.hash)) {
    const h = new URLSearchParams(location.hash.slice(1));
    S = { access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_at: Date.now() + (+h.get('expires_in') || 3600) * 1000, user: null };
    recovery = h.get('type') === 'recovery';
    history.replaceState(null, '', location.pathname + location.search);
  } else if (/error_description=/.test(location.hash)) {
    const h = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => msg(h.get('error_description') || 'De link werkt niet meer. Vraag een nieuwe aan.', 'no'), 50);
  }

  /* ---------- UI ---------- */
  const box = () => $('#authbox');
  function msg(t, kind = '') { const m = $('#amsg'); if (m) { m.textContent = t; m.className = 'amsg ' + kind; m.hidden = !t; } }
  const busy = (b, on) => { if (!b) return; b.disabled = on; b.classList.toggle('loading', on); };

  function viewLogin(mode = 'login') {
    const su = mode === 'signup';
    box().innerHTML = `
      <div class="atabs" role="tablist"><button role="tab" aria-selected="${!su}" data-m="login">Inloggen <span lang="ar">· دخول</span></button><button role="tab" aria-selected="${su}" data-m="signup">Account maken <span lang="ar">· حساب جديد</span></button></div>
      <form id="aform" novalidate>
        <label><span class="lt"><span>E-mailadres</span><span lang="ar" dir="rtl">الإيميل</span></span><input type="email" name="email" autocomplete="email" required></label>
        <label><span class="lt"><span>Wachtwoord</span><span lang="ar" dir="rtl">كلمة السر</span></span><input type="password" name="password" autocomplete="${su ? 'new-password' : 'current-password'}" minlength="8" required></label>
        ${su ? `<label><span class="lt"><span>Herhaal wachtwoord</span><span lang="ar" dir="rtl">عيد كلمة السر</span></span><input type="password" name="password2" autocomplete="new-password" minlength="8" required></label>
        <label><span class="lt"><span>Kortingscode <small>(niet verplicht)</small></span><span lang="ar" dir="rtl">كود الخصم (اختياري)</span></span><input type="text" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>` : ''}
        <button class="btn" type="submit">${su ? 'Account maken' : 'Inloggen'}</button>
        ${su ? '' : '<button class="linkbtn" type="button" id="forgot">Wachtwoord vergeten? <span lang="ar">· نسيت كلمة السر؟</span></button>'}
        <p class="switch">${su ? 'Heb je al een account? <button class="linkbtn" type="button" data-m="login">Inloggen · دخول</button>' : 'Nog geen account? <button class="linkbtn big" type="button" data-m="signup">Maak een account · اعمل حساب جديد</button>'}</p>
      </form><p id="amsg" class="amsg" role="status" aria-live="polite" hidden></p>`;
    box().querySelectorAll('[data-m]').forEach(b => b.onclick = () => viewLogin(b.dataset.m));
    if (!su) { const cf = document.createElement('p'); cf.className = 'small'; cf.innerHTML = 'Heb je een kortingscode? Maak eerst een account, daar vul je hem in. · <span lang="ar" dir="rtl">عندك كود؟ اعمل حساب وحطّه هناك.</span>'; $('#aform').appendChild(cf); }
    const f = $('#aform');
    f.onsubmit = async e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const b = f.querySelector('[type=submit]');
      const email = String(d.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg('Vul een geldig e-mailadres in.', 'no');
      if (String(d.password || '').length < 8) return msg('Je wachtwoord moet minstens 8 tekens hebben.', 'no');
      if (su && d.password !== d.password2) return msg('De wachtwoorden zijn niet hetzelfde.', 'no');
      busy(b, true); msg('');
      try {
        if (su) {
          if (d.code) localStorage.setItem(PEND, String(d.code).trim().toUpperCase());
          const j = await auth('signup?redirect_to=' + encodeURIComponent(location.origin + '/'), { email, password: d.password });
          if (j.access_token) { setSession(j); return start(); }
          box().innerHTML = `<div class="adone"><h3>Check je e-mail</h3><p>We hebben een link gestuurd naar <b>${esc(email)}</b>. Klik op de link om je account te bevestigen.</p><div class="ar" lang="ar" dir="rtl">بعتنالك رابط عالإيميل. اضغط عليه لتأكّد حسابك.</div><button class="btn ghost" id="toLogin">Naar inloggen</button></div>`;
          $('#toLogin').onclick = () => viewLogin('login');
        } else {
          setSession(await auth('token?grant_type=password', { email, password: d.password }));
          start();
        }
      } catch (err) { msg(err.message, 'no'); } finally { busy(b, false); }
    };
    const fg = $('#forgot');
    if (fg) fg.onclick = async () => {
      const email = String(f.email.value || '').trim();
      if (!email) return msg('Vul eerst je e-mailadres in.', 'no');
      try { await auth('recover?redirect_to=' + encodeURIComponent(location.origin + '/'), { email }); msg('Als dit e-mailadres bij ons bekend is, krijg je een link om een nieuw wachtwoord te kiezen.', 'ok'); }
      catch (err) { msg(err.message, 'no'); }
    };
  }

  function viewNewPassword() {
    box().innerHTML = `<h3>Kies een nieuw wachtwoord <span lang="ar">· اختار كلمة سر جديدة</span></h3><form id="pform"><label>Nieuw wachtwoord<input type="password" name="p" minlength="8" autocomplete="new-password" required></label><label>Herhaal wachtwoord<input type="password" name="p2" minlength="8" autocomplete="new-password" required></label><button class="btn" type="submit">Opslaan</button></form><p id="amsg" class="amsg" role="status" hidden></p>`;
    $('#pform').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      if (f.p.value.length < 8) return msg('Minstens 8 tekens.', 'no');
      if (f.p.value !== f.p2.value) return msg('De wachtwoorden zijn niet hetzelfde.', 'no');
      try { await auth('user', { password: f.p.value }, 'PUT', S.access_token); recovery = false; msg('Je wachtwoord is aangepast.', 'ok'); setTimeout(start, 900); }
      catch (err) { msg(err.message, 'no'); }
    };
  }

  function viewPay(st, info = '', preset = null) {
    const until = st.paid_until ? new Date(st.paid_until) : null;
    const expired = until && until < new Date();
    box().innerHTML = `
      <p class="who">Ingelogd als <b>${esc(st.email)}</b> · <button class="linkbtn" id="logout">Uitloggen</button></p>
      ${expired ? `<p class="amsg no">Je abonnement is verlopen op ${until.toLocaleDateString('nl-NL')}. Verleng het om verder te leren.</p>` : ''}
      <div class="paycard"><div class="price"><b>€${esc(C.PRICE || st.price)}</b><span>per jaar · 365 dagen toegang</span></div>
        <p class="ar" lang="ar" dir="rtl">اشتراك سنة كاملة بـ ${esc(C.PRICE || st.price)} يورو.</p>
        ${st.payments === false ? '<p class="amsg">Online betalen komt binnenkort. Heb je een code? Vul hem hieronder in.</p>' : '<button class="btn" id="pay">Betalen met iDEAL, Apple Pay, kaart of overschrijving</button>'}
        ${st.bitcoin ? '<button class="btn ghost" id="paybtc">Betalen met Bitcoin</button>' : ''}
        <p class="small">Je betaalt één keer. Er is <b>geen automatische verlenging</b>. Bij een bankoverschrijving krijg je toegang zodra het geld binnen is (1–2 werkdagen).</p>
      </div>
      <form id="cform" class="codeform"><label><span class="lt"><span>Heb je een kortingscode?</span><span lang="ar" dir="rtl">عندك كود خصم؟</span></span><input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE"></label><button class="btn ghost" type="submit">Code inwisselen</button></form>
      <p id="amsg" class="amsg" role="status" aria-live="polite" ${info ? '' : 'hidden'}>${esc(info)}</p>`;
    let code = null;
    $('#logout').onclick = logout;
    if (preset) { code = preset.code; $('.price b').innerHTML = `<s>€${esc(preset.full)}</s> €${esc(preset.price.toFixed(2).replace('.', ','))}`; $('#cform [name=code]').value = preset.code; msg(`Je kortingscode ${preset.code} is toegepast: ${preset.percent}% korting.`, 'ok'); }
    const pay = async method => {
      const b = method === 'bitcoin' ? $('#paybtc') : $('#pay'); busy(b, true); msg('');
      try { const j = await api('checkout', { method: 'POST', body: JSON.stringify({ code, method }) }); location.href = j.url; }
      catch (err) { msg(err.message, 'no'); busy(b, false); }
    };
    if ($('#pay')) $('#pay').onclick = () => pay('mollie');
    if ($('#paybtc')) $('#paybtc').onclick = () => pay('bitcoin');
    $('#cform').onsubmit = async e => {
      e.preventDefault(); const c = e.target.code.value.trim().toUpperCase(); if (!c) return;
      const b = e.target.querySelector('button'); busy(b, true); msg('');
      try {
        const j = await api('redeem', { method: 'POST', body: JSON.stringify({ code: c }) });
        if (j.kind === 'free') { msg('Gelukt! Je hebt gratis toegang tot ' + new Date(j.paid_until).toLocaleDateString('nl-NL') + '.', 'ok'); setTimeout(start, 900); }
        else { code = c; $('.price b').innerHTML = `<s>€${esc(j.full)}</s> €${esc(j.price.toFixed(2).replace('.', ','))}`; msg(`Code geldt: ${j.percent}% korting. Betaal nu het nieuwe bedrag.`, 'ok'); }
      } catch (err) { msg(err.message, 'no'); } finally { busy(b, false); }
    };
  }

  async function logout() {
    try { if (S) await auth('logout', null, 'POST', S.access_token); } catch {}
    S = null; keep(); location.href = '/';
  }

  /* ---------- progress per user, synced to the database ---------- */
  async function loadProgress(uid, t) {
    const KEY = 'tb-v2:' + uid; window.TB_KEY = KEY;
    try {
      const r = await fetch(`${C.SUPABASE_URL}/rest/v1/progress?select=data,updated_at&user_id=eq.${uid}`, { headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + t } });
      const rows = r.ok ? await r.json() : [];
      const remote = rows[0]; const localT = +localStorage.getItem(KEY + ':t') || 0;
      if (remote && new Date(remote.updated_at).getTime() > localT) { localStorage.setItem(KEY, JSON.stringify(remote.data)); localStorage.setItem(KEY + ':t', new Date(remote.updated_at).getTime()); }
    } catch {}
    let timer = 0, last = null;
    const push = async () => {
      if (!last) return; const data = last; last = null; const tk = await token(); if (!tk) return;
      const now = new Date().toISOString();
      try {
        await fetch(`${C.SUPABASE_URL}/rest/v1/progress`, { method: 'POST', keepalive: true, headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: uid, data, updated_at: now }) });
        localStorage.setItem(KEY + ':t', Date.parse(now));
      } catch {}
    };
    window.TB_SYNC = P => { last = P; clearTimeout(timer); timer = setTimeout(push, 1500); };
    addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); push(); } });
  }

  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); });

  async function openApp(st) {
    const t = await token();
    msg('Lessen laden…');
    const app = await api('app');
    await loadProgress(S.user.id, t);
    window.QUESTIONS = app.questions; window.QT = app.qt;
    window.ALLQ = Object.entries(app.questions).flatMap(([tp, l]) => l.map((x, i) => Object.assign({ id: tp + '-' + i, t: tp }, x)));
    document.body.classList.remove('landing');
    document.body.innerHTML = app.html;
    for (const s of ['assets/data.js', 'assets/scenes.js', 'assets/app.js']) await loadScript(s);
    // account button in the header
    const tools = document.querySelector('header.top');
    if (tools) {
      const b = document.createElement('button'); b.className = 'tbtn acct'; b.type = 'button';
      b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span class="lbl">Account</span>';
      b.setAttribute('aria-label', 'Account'); b.onclick = () => accountPanel(st); tools.appendChild(b);
    }
  }

  function accountPanel(st) {
    let d = document.getElementById('acctdlg');
    if (!d) { d = document.createElement('dialog'); d.id = 'acctdlg'; d.className = 'acctdlg'; document.body.appendChild(d); }
    const until = new Date(st.paid_until);
    const left = Math.max(0, Math.ceil((until - Date.now()) / 864e5));
    d.innerHTML = `<form method="dialog"><h3>Mijn account <span lang="ar">· حسابي</span></h3><p><b>${esc(st.email)}</b></p><p>${st.admin ? 'Beheerder: altijd toegang.' : `Toegang tot <b>${until.toLocaleDateString('nl-NL')}</b> (nog ${left} dagen).`}</p><p class="small">Je voortgang wordt bewaard in je account, dus ook op je telefoon en computer.</p>${st.admin ? '<p><a class="btn ghost" href="/admin">Beheerpaneel openen</a></p>' : ''}<div class="row"><button class="btn ghost" value="close">Sluiten</button><button class="btn" type="button" id="lo">Uitloggen</button></div></form>`;
    d.querySelector('#lo').onclick = logout; d.showModal();
  }

  async function waitForPayment() {
    msg('Betaling wordt gecontroleerd… · عم نتأكد من الدفع…');
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try { const st = await api('status'); if (st.active) return st; } catch {}
    }
    return null;
  }

  async function start() {
    if (!configured) { box().innerHTML = '<p class="amsg no">De website is nog niet gekoppeld aan de database. Vul assets/config.js in (zie SETUP.md).</p>'; return; }
    if (!(await token())) { const m = new URLSearchParams(location.search).get('m'); return viewLogin(m || (localStorage.getItem('tb-known') ? 'login' : 'signup')); }
    if (recovery) return viewNewPassword();
    box().innerHTML = '<p class="amsg">Even geduld… · لحظة…</p>';
    try {
      let st = await api('status');
      S.user = S.user || { email: st.email }; if (!S.user.id) { const u = await auth('user', null, 'GET', S.access_token); S.user = { id: u.id, email: u.email }; } keep();
      const pend = localStorage.getItem(PEND);
      if (pend && !st.active) {
        localStorage.removeItem(PEND);
        try { const j = await api('redeem', { method: 'POST', body: JSON.stringify({ code: pend }) }); if (j.kind === 'free') st = await api('status'); else return viewPay(st, '', { code: pend, ...j }); }
        catch (err) { return viewPay(st, 'Kortingscode: ' + err.message); }
      }
      if (!st.active && new URLSearchParams(location.search).has('paid')) {
        history.replaceState(null, '', '/');
        const ok = await waitForPayment();
        if (ok) st = ok; else return viewPay(st, 'We hebben je betaling nog niet ontvangen. Bij een bankoverschrijving kan dit 1–2 werkdagen duren; daarna kun je gewoon inloggen.');
      }
      if (st.active) return openApp(st);
      viewPay(st);
    } catch (err) {
      if (err.status === 401) { S = null; keep(); return viewLogin(); }
      box().innerHTML = `<p class="amsg no">${esc(err.message)}</p><button class="btn ghost" id="retry">Opnieuw proberen</button>`;
      $('#retry').onclick = start;
    }
  }
  document.addEventListener('DOMContentLoaded', start);
})();
