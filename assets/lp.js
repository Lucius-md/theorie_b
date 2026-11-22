/* Landing page decoration: a few real traffic signs. */
(() => { const el = document.getElementById('lpSigns'); if (!el || typeof sign !== 'function') return;
  el.innerHTML = ['B6', 'B1', 'C2', 'B7', 'Drot', 'J8'].map(k => { try { return `<span>${sign(k)}</span>`; } catch { return ''; } }).join(''); })();
