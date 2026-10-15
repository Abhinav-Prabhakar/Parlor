/* Parlor — app state, URL sync and render orchestration. */
(function () {
  var P = window.P, D = P.data, u = P.u, $ = u.$, $$ = u.$$;

  var DEFAULTS = {
    range: { from: D.idxOf(2026, 0, 1), to: D.idxOf(2026, 6, 31) },
    compare: { from: D.idxOf(2025, 7, 1), to: D.idxOf(2025, 11, 31) },
    cmpMode: 'custom',
    gran: 'daily',
    pay: { measure: 'count', markers: true },
    gross: { mode: 'amount' },
    ret: { metric: 'returning' },
    tx: { channel: 'all' },
    cust: { channel: 'all' },
    hidden: []
  };
  var state = P.state = JSON.parse(JSON.stringify(DEFAULTS));

  // ---------- URL hash <-> state ----------
  function dayFromIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var i = D.idxOf(+m[1], +m[2] - 1, +m[3]);
    return i >= 0 && i < D.N ? i : null;
  }
  function readHash() {
    var q = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || ''); });
    function rng(v) { var p = (v || '').split('_'), a = dayFromIso(p[0]), b = dayFromIso(p[1]); return a != null && b != null && a <= b ? { from: a, to: b } : null; }
    var r = rng(q.r); if (r) state.range = r;
    var c = rng(q.c); if (c) state.compare = c;
    if (/^(custom|previous|year)$/.test(q.cm)) state.cmpMode = q.cm;
    if (/^(daily|weekly|monthly)$/.test(q.g)) state.gran = q.g;
    if (/^(count|volume)$/.test(q.pm)) state.pay.measure = q.pm;
    if (q.mk === '0') state.pay.markers = false;
    if (/^(amount|share)$/.test(q.gm)) state.gross.mode = q.gm;
    if (/^(returning|subscribers)$/.test(q.rm)) state.ret.metric = q.rm;
    if (/^(all|online|subs|store)$/.test(q.tc)) state.tx.channel = q.tc;
    if (/^(all|online|subs|store)$/.test(q.cc)) state.cust.channel = q.cc;
    if (q.h) state.hidden = q.h.split(',').filter(Boolean);
  }
  function writeHash() {
    var p = ['r=' + u.isoDay(state.range.from) + '_' + u.isoDay(state.range.to), 'c=' + u.isoDay(state.compare.from) + '_' + u.isoDay(state.compare.to)];
    if (state.cmpMode !== 'custom') p.push('cm=' + state.cmpMode);
    if (state.gran !== 'daily') p.push('g=' + state.gran);
    if (state.pay.measure !== 'count') p.push('pm=' + state.pay.measure);
    if (!state.pay.markers) p.push('mk=0');
    if (state.gross.mode !== 'amount') p.push('gm=' + state.gross.mode);
    if (state.ret.metric !== 'returning') p.push('rm=' + state.ret.metric);
    if (state.tx.channel !== 'all') p.push('tc=' + state.tx.channel);
    if (state.cust.channel !== 'all') p.push('cc=' + state.cust.channel);
    if (state.hidden.length) p.push('h=' + state.hidden.join(','));
    try { history.replaceState(null, '', '#' + p.join('&')); } catch (e) { /* file:// in some browsers */ }
  }

  // Comparison windows derived from the primary range
  function deriveCompare() {
    var len = state.range.to - state.range.from + 1;
    if (state.cmpMode === 'previous') {
      state.compare = { from: Math.max(0, state.range.from - len), to: Math.max(0, state.range.from - 1) };
    } else if (state.cmpMode === 'year') {
      state.compare = { from: Math.max(0, state.range.from - 365), to: Math.max(0, state.range.to - 365) };
    }
  }

  // ---------- model ----------
  function model() {
    var c = D.totals(state.range), p = D.totals(state.compare);
    return {
      range: state.range, cmpRange: state.compare, cur: c, cmp: p,
      aov: c.successful ? c.onlineRev / c.successful : 0,
      cmpAov: p.successful ? p.onlineRev / p.successful : 0,
      curT: { tx: c.tx, cust: c.cust }, cmpT: { tx: p.tx, cust: p.cust }
    };
  }
  P.model = model;

  var lastModel = null;
  function render(animate, only) {
    var m = lastModel = model();
    $('#rangeBtn .range-txt').textContent = u.fmtRange(state.range);
    $('#compareBtn .range-txt').textContent = u.fmtRange(state.compare);
    $('#rangeBtn').title = u.fmtDay(state.range.from, true) + ' – ' + u.fmtDay(state.range.to, true);
    $('#compareBtn').title = u.fmtDay(state.compare.from, true) + ' – ' + u.fmtDay(state.compare.to, true);
    $('#granBtn .gran-txt').textContent = state.gran[0].toUpperCase() + state.gran.slice(1);
    var ch = P.charts;
    if (!only || only === 'payments') ch.funnel.update(m, animate);
    if (!only || only === 'gross') ch.gross.update(m, animate);
    if (!only || only === 'retention') ch.retention.update(m, animate);
    if (!only || only === 'tx') ch.tx.update(m, animate);
    if (!only || only === 'customers') ch.cust.update(m, animate);
    if ((!only || only === 'insights') && P.insights) P.insights.update(m, animate);
    writeHash();
  }

  P.app = {
    defaults: DEFAULTS,
    model: function () { return lastModel; },
    render: render,
    setRange: function (r) { state.range = r; deriveCompare(); render(true); },
    setCompare: function (r, mode) { state.cmpMode = mode || 'custom'; if (r) state.compare = r; deriveCompare(); render(true); },
    setGran: function (g) { state.gran = g; render(true); },
    deriveCompare: deriveCompare
  };

  // ---------- resize ----------
  var raf = 0;
  function relayout() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var ch = P.charts;
      ch.funnel.relayout(); ch.retention.relayout(); ch.tx.relayout(); ch.cust.relayout();
      if (P.ui && P.ui.relayout) P.ui.relayout();
    });
  }
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(relayout);
    $$('.card').forEach(function (c) { ro.observe(c); });
  } else window.addEventListener('resize', relayout);

  // ---------- boot ----------
  readHash();
  deriveCompare();
  window.addEventListener('hashchange', function () { readHash(); deriveCompare(); render(true); if (P.ui) P.ui.syncHidden(); });

  function boot() {
    if (P.ui && P.ui.init) P.ui.init();
    render(true);
    requestAnimationFrame(function () { document.body.classList.remove('is-loading'); });
  }
  if (document.fonts && document.fonts.ready) {
    var done = false;
    document.fonts.ready.then(function () { if (!done) { done = true; boot(); } });
    setTimeout(function () { if (!done) { done = true; boot(); } }, 600);
  } else boot();
})();
