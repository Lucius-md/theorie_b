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
    const r = await fetch('/api/admin', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Fout'); return j;
  }
  const flash = (t, k = 'ok') => { const m = $('#amsg'); m.textContent = t; m.className = 'amsg ' + k; m.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => m.hidden = true, 5000); };

  const TABS = [['overzicht', 'Overzicht', 'نظرة عامة'], ['codes', 'Kortingscodes', 'أكواد الخصم'], ['users', 'Gebruikers', 'المستخدمين'], ['payments', 'Betalingen', 'الدفعات']];
  function shell() {
    root.innerHTML = `<h1>Beheer <span lang="ar" dir="rtl">· لوحة التحكم</span></h1><div class="atabs adtabs" role="tablist">${TABS.map(([k, n, a]) => `<button role="tab" data-t="${k}">${n} <span lang="ar">${a}</span></button>`).join('')}</div><p id="amsg" class="amsg" role="status" hidden></p><div id="pane"></div>`;
    $$('[data-t]').forEach(b => b.onclick = () => show(b.dataset.t));
    show(location.hash.slice(1) || 'overzicht');
  }
  async function show(t) {
    if (!TABS.some(x => x[0] === t)) t = 'overzicht';
    history.replaceState(null, '', '#' + t);
    $$('[data-t]').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
    const p = $('#pane'); p.innerHTML = '<p class="amsg">Laden…</p>';
    try { await VIEWS[t](p); } catch (e) { p.innerHTML = `<p class="amsg no">${esc(e.message)}</p>`; }
  }
  const VIEWS = {
    async overzicht(p) {
      const s = await call('stats');
      p.innerHTML = `<div class="kpis">${[['Accounts', s.users, 'حسابات'], ['Actieve abonnementen', s.active, 'اشتراكات فعّالة'], ['Omzet totaal', eur(s.revenue), 'المجموع'], ['Omzet 30 dagen', eur(s.month), 'آخر 30 يوم']].map(([n, v, a]) => `<div class="card kpi"><span>${n} <i lang="ar">${a}</i></span><b>${esc(v)}</b></div>`).join('')}</div>`;
    },
    async codes(p) {
      const { codes } = await call('codes');
      p.innerHTML = `<form id="newcode" class="card adform"><h3>Nieuwe code <span lang="ar">· كود جديد</span></h3>
        <div class="grid">
          <label>Code<input name="code" required placeholder="BIJV. VRIEND2026" autocapitalize="characters"></label>
          <label>Soort<select name="kind"><option value="free">Gratis toegang</option><option value="percent">Korting in %</option></select></label>
          <label class="pct" hidden>Korting %<input name="percent" type="number" min="1" max="99" value="50"></label>
          <label>Dagen toegang<input name="days" type="number" min="1" max="3650" value="365"></label>
          <label>Max. aantal keer<input name="max_uses" type="number" min="1" placeholder="onbeperkt"></label>
          <label>Geldig tot<input name="expires_at" type="date"></label>
          <label class="wide">Notitie<input name="note" placeholder="voor wie / waarom"></label>
        </div><div class="row"><button class="btn ghost" type="button" id="gen">Willekeurige code</button><button class="btn" type="submit">Code maken</button></div></form>
        <div class="tablewrap"><table class="adt"><thead><tr><th>Code</th><th>Soort</th><th>Gebruikt</th><th>Geldig tot</th><th>Notitie</th><th>Status</th><th></th></tr></thead><tbody>
        ${codes.map(c => `<tr><td><b>${esc(c.code)}</b></td><td>${c.kind === 'free' ? 'Gratis, ' + c.days + ' d' : c.percent + '% korting'}</td><td>${c.uses}${c.max_uses ? ' / ' + c.max_uses : ''}</td><td>${d(c.expires_at)}</td><td>${esc(c.note || '')}</td>
          <td><button class="chip ${c.active ? 'on' : ''}" data-tog="${esc(c.code)}" data-a="${c.active ? 0 : 1}">${c.active ? 'Aan' : 'Uit'}</button></td><td><button class="linkbtn" data-del="${esc(c.code)}">Verwijderen</button></td></tr>`).join('') || '<tr><td colspan="7">Nog geen codes.</td></tr>'}
        </tbody></table></div>`;
      const f = $('#newcode');
      f.kind.onchange = () => { $('.pct', f).hidden = f.kind.value !== 'percent'; };
      $('#gen').onclick = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = crypto.getRandomValues(new Uint8Array(8)); f.code.value = 'TB-' + [...r].map(x => a[x % a.length]).join(''); };
      f.onsubmit = async e => { e.preventDefault(); try { await call('createCode', Object.fromEntries(new FormData(f))); flash('Code gemaakt.'); show('codes'); } catch (err) { flash(err.message, 'no'); } };
      $$('[data-tog]', p).forEach(b => b.onclick = async () => { await call('setCode', { code: b.dataset.tog, active: b.dataset.a === '1' }); show('codes'); });
      $$('[data-del]', p).forEach(b => b.onclick = async () => { if (!confirm('Code ' + b.dataset.del + ' verwijderen?')) return; await call('deleteCode', { code: b.dataset.del }); flash('Verwijderd.'); show('codes'); });
    },
    async users(p, q = '') {
      const { users } = await call('users', { q });
      const now = Date.now();
      p.innerHTML = `<form id="ufind" class="row"><input name="q" type="search" placeholder="Zoek op e-mail" value="${esc(q)}"><button class="btn ghost">Zoeken</button></form>
        <form id="grant" class="card adform"><h3>Toegang geven of afnemen <span lang="ar">· إعطاء أو سحب اشتراك</span></h3><div class="grid"><label class="wide">E-mail<input name="email" type="email" required></label><label>Dagen<input name="days" type="number" min="1" value="365"></label></div><div class="row"><button class="btn ghost" type="button" id="revoke">Toegang stoppen</button><button class="btn">Toegang geven</button></div></form>
        <div class="tablewrap"><table class="adt"><thead><tr><th>E-mail</th><th>Aangemeld</th><th>Bevestigd</th><th>Laatst ingelogd</th><th>Toegang tot</th></tr></thead><tbody>
        ${users.map(u => `<tr><td>${esc(u.email)}</td><td>${d(u.created_at)}</td><td>${u.confirmed ? '✓' : '—'}</td><td>${d(u.last_sign_in_at)}</td><td>${u.paid_until && new Date(u.paid_until) > now ? '<b class="okt">' + d(u.paid_until) + '</b>' : '<span class="not">geen</span>'}</td></tr>`).join('') || '<tr><td colspan="5">Geen gebruikers.</td></tr>'}</tbody></table></div>`;
      $('#ufind').onsubmit = e => { e.preventDefault(); VIEWS.users(p, e.target.q.value); };
      const g = $('#grant');
      g.onsubmit = async e => { e.preventDefault(); try { const j = await call('grant', { email: g.email.value, days: g.days.value }); flash('Toegang tot ' + d(j.paid_until) + '.'); VIEWS.users(p, q); } catch (err) { flash(err.message, 'no'); } };
      $('#revoke').onclick = async () => { if (!g.email.value || !confirm('Toegang stoppen voor ' + g.email.value + '?')) return; try { await call('revoke', { email: g.email.value }); flash('Toegang gestopt.'); VIEWS.users(p, q); } catch (err) { flash(err.message, 'no'); } };
    },
    async payments(p) {
      const { payments } = await call('payments');
      p.innerHTML = `<div class="tablewrap"><table class="adt"><thead><tr><th>Datum</th><th>E-mail</th><th>Bedrag</th><th>Via</th><th>Code</th><th>Status</th></tr></thead><tbody>
        ${payments.map(x => `<tr><td>${d(x.created_at)}</td><td>${esc(x.email)}</td><td>${eur(x.amount)}</td><td>${x.provider === 'btcpay' ? 'Bitcoin' : 'Mollie'}</td><td>${esc(x.code || '')}</td><td>${x.processed ? '<b class="okt">betaald</b>' : esc(x.status)}</td></tr>`).join('') || '<tr><td colspan="6">Nog geen betalingen.</td></tr>'}</tbody></table></div>`;
    }
  };
  (async () => {
    if (!S) { root.innerHTML = '<p class="amsg no">Log eerst in op de site met je beheerdersaccount.</p><a class="btn" href="/">Naar inloggen</a>'; return; }
    try { await call('stats'); shell(); }
    catch (e) { root.innerHTML = `<p class="amsg no">${esc(e.message)}</p><a class="btn ghost" href="/">Terug</a>`; }
  })();
})();
