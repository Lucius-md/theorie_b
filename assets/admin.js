/* Beheerpaneel: overzicht, kortingscodes, gebruikers, betalingen. Alleen voor beheerders (server controleert). */
(() => {
  const C = window.TB_CONFIG || {}, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const d = x => x ? new Date(x).toLocaleDateString('nl-NL') : '—';
  const eur = n => '€' + Number(n || 0).toFixed(2).replace('.', ',');
  const root = $('#adm');
  let S = null; try { S = JSON.parse(localStorage.getItem('tb-auth') || 'null'); } catch {}
  async function token() {
    if (!S) return null;
    if (Date.now() > S.expires_at - 60000) {
      const r = await fetch(C.SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: S.refresh_token }) });
      if (!r.ok) return null; const j = await r.json();
      S = { ...S, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 }; localStorage.setItem('tb-auth', JSON.stringify(S));
    }
    return S.access_token;
  }
  async function call(action, data = {}) {
    const t = await token(); if (!t) throw new Error('Log eerst in op de site.');
    const r = await fetch(C.SUPABASE_URL + '/functions/v1/api/admin', { method: 'POST', headers: { Authorization: 'Bearer ' + t, apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Fout'); return j;
  }
  const flash = (t, k = 'ok') => { const m = $('#amsg'); m.textContent = t; m.className = 'amsg ' + k; m.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => m.hidden = true, 5000); };

  const TABS = [['overzicht', 'Overzicht', 'نظرة عامة'], ['codes', 'Kortingscodes', 'أكواد الخصم'], ['users', 'Gebruikers', 'المستخدمين'], ['payments', 'Betalingen', 'الدفعات'], ['admins', 'Beheerders', 'المدراء']];
  const ST = { paid: 'betaald', open: 'open', pending: 'bezig', failed: 'mislukt', canceled: 'geannuleerd', expired: 'verlopen', authorized: 'goedgekeurd', New: 'open', Processing: 'bezig', Settled: 'betaald', Invalid: 'mislukt', Expired: 'verlopen' };
  const METH = { ideal: 'iDEAL', applepay: 'Apple Pay', creditcard: 'Kaart', banktransfer: 'Overschrijving', bancontact: 'Bancontact', bitcoin: 'Bitcoin' };
  const run = async (fn, ok) => { try { await fn(); if (ok) flash(ok); return true; } catch (e) { flash(e.message, 'no'); return false; } };
  const csv = (name, rows) => { const t = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + t], { type: 'text/csv' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const L = (nl, ar) => `${nl} <span lang="ar" dir="rtl">${ar}</span>`;
  function shell() {
    root.innerHTML = `<h1>Beheer · <span lang="ar" dir="rtl">لوحة التحكم</span></h1><div class="atabs adtabs" role="tablist">${TABS.map(([k, n, a]) => `<button role="tab" data-t="${k}">${n} <span lang="ar" dir="rtl">${a}</span></button>`).join('')}</div><p id="amsg" class="amsg" role="status" hidden></p><div id="pane"></div>`;
    $$('[data-t]').forEach(b => b.onclick = () => show(b.dataset.t));
    show(location.hash.slice(1) || 'overzicht');
  }
  async function show(t) {
    if (!TABS.some(x => x[0] === t)) t = 'overzicht';
    history.replaceState(null, '', '#' + t);
    $$('[data-t]').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
    const p = $('#pane'); p.innerHTML = '<p class="amsg">Laden… · عم يحمّل…</p>';
    try { await VIEWS[t](p); } catch (e) { p.innerHTML = `<p class="amsg no">${esc(e.message)}</p>`; }
  }
  const hint = '<p class="scrollhint">← Schuif de tabel opzij · اسحب الجدول عالجنب →</p>';
  const VIEWS = {
    async overzicht(p) {
      const s = await call('stats');
      p.innerHTML = `<div class="kpis">${[['Accounts', s.users, 'حسابات'], ['Actieve abonnementen', s.active, 'اشتراكات فعّالة'], ['Omzet totaal', eur(s.revenue), 'المجموع'], ['Omzet 30 dagen', eur(s.month), 'آخر 30 يوم']].map(([n, v, a]) => `<div class="card kpi"><span>${n} <i lang="ar" dir="rtl">${a}</i></span><b>${esc(v)}</b></div>`).join('')}</div>`;
    },
    async codes(p) {
      const { codes } = await call('codes');
      const now = Date.now();
      const status = c => !c.active ? ['Uit', 'موقّف', ''] : c.expires_at && new Date(c.expires_at) < now ? ['Verlopen', 'منتهي', 'warn'] : c.max_uses && c.uses >= c.max_uses ? ['Op', 'خلص', 'warn'] : ['Aan', 'شغّال', 'on'];
      p.innerHTML = `<form id="newcode" class="card adform"><h3>${L('Nieuwe code', '· كود جديد')}</h3>
        <div class="grid">
          <label>${L('Code', 'الكود')}<input name="code" required placeholder="BIJV. VRIEND2026" autocapitalize="characters"></label>
          <label>${L('Soort', 'النوع')}<select name="kind"><option value="free">Gratis toegang · دخول ببلاش</option><option value="percent">Korting in % · خصم بالمية</option></select></label>
          <label class="pct" hidden>${L('Korting %', 'نسبة الخصم')}<input name="percent" type="number" min="1" max="99" value="50"></label>
          <label class="dys">${L('Dagen toegang', 'أيام الدخول')}<input name="days" type="number" min="1" max="3650" value="365"></label>
          <label>${L('Max. aantal keer', 'أقصى عدد مرات')}<input name="max_uses" type="number" min="1" placeholder="onbeperkt · بلا حد"></label>
          <label>${L('Geldig tot', 'صالح لحد')}<input name="expires_at" type="date"></label>
          <label class="wide">${L('Notitie', 'ملاحظة')}<input name="note" placeholder="voor wie / waarom"></label>
        </div><div class="row"><button class="btn ghost" type="button" id="gen">Willekeurige code · كود عشوائي</button><button class="btn" type="submit">Code maken · اعمل الكود</button></div></form>
        <div class="row"><button class="btn ghost sm" id="csvc">Exporteer CSV · تصدير</button></div>
        ${hint}<div class="tablewrap"><table class="adt"><thead><tr><th>Code</th><th>Soort</th><th>Gebruikt</th><th>Geldig tot</th><th>Notitie</th><th>Status</th><th></th></tr></thead><tbody>
        ${codes.map(c => { const [sn, sa, sc] = status(c); return `<tr><td><b>${esc(c.code)}</b></td><td>${c.kind === 'free' ? 'Gratis, ' + c.days + ' d' : c.percent + '% korting'}</td><td><button class="linkbtn" data-uses="${esc(c.code)}">${c.uses}${c.max_uses ? ' / ' + c.max_uses : ''}</button></td><td>${d(c.expires_at)}</td><td>${esc(c.note || '')}</td>
          <td><button class="chip ${sc}" data-tog="${esc(c.code)}" data-a="${c.active ? 0 : 1}" title="Klik om aan/uit te zetten">${sn} <span lang="ar" dir="rtl">${sa}</span></button></td><td><button class="linkbtn" data-del="${esc(c.code)}">Verwijderen</button></td></tr>`; }).join('') || '<tr><td colspan="7">Nog geen codes. · ما في أكواد لسا.</td></tr>'}
        </tbody></table></div><div id="uses"></div>`;
      const f = $('#newcode');
      f.kind.onchange = () => { const pc = f.kind.value === 'percent'; $('.pct', f).hidden = !pc; $('.dys', f).hidden = pc; };
      $('#gen').onclick = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint8Array(8)); f.code.value = 'TB-' + [...r].map(x => a[x % a.length]).join(''); };
      f.onsubmit = async e => { e.preventDefault(); const o = Object.fromEntries(new FormData(f)); if (o.expires_at) o.expires_at = new Date(o.expires_at + 'T23:59:59').toISOString(); if (await run(() => call('createCode', o), 'Code gemaakt. · انعمل الكود.')) show('codes'); };
      $('#csvc').onclick = () => csv('codes.csv', [['code', 'soort', 'procent', 'dagen', 'gebruikt', 'max', 'geldig tot', 'actief', 'notitie'], ...codes.map(c => [c.code, c.kind, c.percent, c.days, c.uses, c.max_uses, c.expires_at, c.active, c.note])]);
      $$('[data-tog]', p).forEach(b => b.onclick = async () => { if (await run(() => call('setCode', { code: b.dataset.tog, active: b.dataset.a === '1' }))) show('codes'); });
      $$('[data-del]', p).forEach(b => b.onclick = async () => { if (!confirm('Code ' + b.dataset.del + ' verwijderen? · نمسح الكود؟')) return; if (await run(() => call('deleteCode', { code: b.dataset.del }), 'Verwijderd. · انمسح.')) show('codes'); });
      $$('[data-uses]', p).forEach(b => b.onclick = () => run(async () => { const { uses } = await call('codeUses', { code: b.dataset.uses }); $('#uses').innerHTML = `<div class="card"><h3>${esc(b.dataset.uses)}: ${L('gebruikt door', 'استعملوه')}</h3><ul>${uses.map(u => `<li>${esc(u.email)} · ${d(u.used_at)}</li>`).join('') || '<li>Nog niemand. · ولا حدا لسا.</li>'}</ul></div>`; $('#uses').scrollIntoView({ behavior: 'smooth' }); }));
    },
    async users(p, q = '') {
      const { users } = await call('users', { q });
      const now = Date.now();
      p.innerHTML = `<form id="ufind" class="row"><input name="q" type="search" placeholder="Zoek op e-mail · دوّر بالإيميل" value="${esc(q)}"><button class="btn ghost">Zoeken · دوّر</button><button class="btn ghost sm" type="button" id="csvu">CSV</button></form>
        ${hint}<div class="tablewrap"><table class="adt"><thead><tr><th>E-mail</th><th>Aangemeld</th><th>Bevestigd</th><th>Laatst ingelogd</th><th>Toegang tot</th><th>Acties · إجراءات</th></tr></thead><tbody>
        ${users.map(u => `<tr><td>${esc(u.email)}</td><td>${d(u.created_at)}</td><td>${u.confirmed ? '✓' : '—'}</td><td>${d(u.last_sign_in_at)}</td><td>${u.paid_until && new Date(u.paid_until) > now ? '<b class="okt">' + d(u.paid_until) + '</b>' : '<span class="not">geen</span>'}</td>
          <td class="acts"><button class="chip" data-act="grant" data-e="${esc(u.email)}">+365 d</button><button class="chip" data-act="revoke" data-e="${esc(u.email)}">Stop</button><button class="chip" data-act="resetPassword" data-e="${esc(u.email)}">Wachtwoord</button><button class="chip warn" data-act="deleteUser" data-e="${esc(u.email)}">Verwijder</button></td></tr>`).join('') || '<tr><td colspan="6">Geen gebruikers. · ما في مستخدمين.</td></tr>'}</tbody></table></div>`;
      $('#ufind').onsubmit = e => { e.preventDefault(); VIEWS.users(p, e.target.q.value); };
      $('#csvu').onclick = () => csv('gebruikers.csv', [['email', 'aangemeld', 'bevestigd', 'laatst ingelogd', 'toegang tot'], ...users.map(u => [u.email, u.created_at, u.confirmed, u.last_sign_in_at, u.paid_until])]);
      const Q = { grant: ['365 dagen toegang geven aan', 'نعطي سنة دخول لـ', 'Toegang gegeven. · انعطى الدخول.'], revoke: ['Toegang stoppen voor', 'نوقّف الدخول لـ', 'Toegang gestopt. · توقّف الدخول.'], resetPassword: ['Mail sturen om een nieuw wachtwoord te kiezen naar', 'نبعت إيميل لكلمة سر جديدة لـ', 'Mail verstuurd. · انبعت الإيميل.'], deleteUser: ['Account en alle gegevens DEFINITIEF verwijderen van', 'نمسح الحساب وكل معلوماته نهائياً لـ', 'Account verwijderd. · انمسح الحساب.'] };
      $$('[data-act]', p).forEach(b => b.onclick = async () => { const [nl, ar, ok] = Q[b.dataset.act]; if (!confirm(`${nl} ${b.dataset.e}?\n${ar} ${b.dataset.e}؟`)) return; if (await run(() => call(b.dataset.act, { email: b.dataset.e, days: 365 }), ok)) VIEWS.users(p, q); });
    },
    async payments(p) {
      const { payments } = await call('payments');
      p.innerHTML = `<div class="row"><button class="btn ghost sm" id="csvp">Exporteer CSV · تصدير</button></div>${hint}<div class="tablewrap"><table class="adt"><thead><tr><th>Datum</th><th>E-mail</th><th>Bedrag</th><th>Via</th><th>Code</th><th>Status</th></tr></thead><tbody>
        ${payments.map(x => `<tr><td>${d(x.created_at)}</td><td>${esc(x.email)}</td><td>${eur(x.amount)}</td><td>${esc(METH[x.method] || (x.provider === 'btcpay' ? 'Bitcoin' : 'Mollie'))}</td><td>${esc(x.code || '')}</td><td>${x.processed ? '<b class="okt">betaald</b>' : esc(ST[x.status] || x.status || '—')}</td></tr>`).join('') || '<tr><td colspan="6">Nog geen betalingen. · ما في دفعات لسا.</td></tr>'}</tbody></table></div>`;
      $('#csvp').onclick = () => csv('betalingen.csv', [['datum', 'email', 'bedrag', 'via', 'code', 'status'], ...payments.map(x => [x.created_at, x.email, x.amount, x.method || x.provider, x.code, x.processed ? 'betaald' : x.status])]);
    },
    async admins(p) {
      const { admins } = await call('admins');
      p.innerHTML = `<form id="addadm" class="card adform"><h3>${L('Beheerder toevoegen', '· زيد مدير')}</h3><div class="grid"><label class="wide">E-mail<input name="email" type="email" required></label></div><div class="row"><button class="btn">Toevoegen · زيد</button></div></form>
        <div class="tablewrap"><table class="adt"><thead><tr><th>E-mail</th><th>Sinds</th><th></th></tr></thead><tbody>${admins.map(a => `<tr><td>${esc(a.email)}</td><td>${d(a.created_at)}</td><td><button class="linkbtn" data-rm="${esc(a.email)}">Verwijderen</button></td></tr>`).join('')}</tbody></table></div>`;
      $('#addadm').onsubmit = async e => { e.preventDefault(); if (await run(() => call('addAdmin', { email: e.target.email.value }), 'Toegevoegd. · انزاد.')) show('admins'); };
      $$('[data-rm]', p).forEach(b => b.onclick = async () => { if (!confirm(b.dataset.rm + ' is dan geen beheerder meer. Doorgaan? · نشيله من المدراء؟')) return; if (await run(() => call('removeAdmin', { email: b.dataset.rm }), 'Verwijderd. · انشال.')) show('admins'); });
    }
  };
  (async () => {
    if (!S) { root.innerHTML = '<p class="amsg no">Log eerst in op de site met je beheerdersaccount.</p><a class="btn" href="/">Naar inloggen</a>'; return; }
    try { await call('stats'); shell(); }
    catch (e) { root.innerHTML = `<p class="amsg no">${esc(e.message)}</p><a class="btn ghost" href="/">Terug</a>`; }
  })();
})();
