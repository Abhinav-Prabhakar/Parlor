(function () {
  var P = (window.P = window.P || {});
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ---------- formatting ----------
  function trim(n, d) { return n.toFixed(d).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1'); }
  function compact(n, d) {
    var a = Math.abs(n), sign = n < 0 ? '-' : '';
    if (d == null) d = 1;
    if (a >= 1e6) return sign + trim(a / 1e6, a >= 1e7 ? 1 : 2) + 'M';
    if (a >= 1e3) return sign + trim(a / 1e3, a >= 1e5 ? 0 : d) + 'k';
    return sign + Math.round(a);
  }
  function compactFixed(n) { // stable width for counters: 65.2k / 106k / 4.83M
    var a = Math.abs(n);
    if (a >= 1e6) return (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
    if (a >= 1e5) return Math.round(a / 1e3) + 'k';
    if (a >= 1e3) return (a / 1e3).toFixed(1) + 'k';
    return String(Math.round(a));
  }
  function money(n) { return '$' + compactFixed(n); }
  function int(n) { return Math.round(n).toLocaleString('en-US'); }
  function signed(n, f) { return (n >= 0 ? '+' : '−') + (f || int)(Math.abs(n)); }
  function pct(n, d) { return (n * 100).toFixed(d == null ? 0 : d) + '%'; }
  function pctDelta(a, b) { return b ? (a - b) / b : 0; }

  // ---------- motion ----------
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tween(dur, step, ease, done) {
    if (reduced) dur = 1;
    var t0 = performance.now(), id = { stop: false };
    ease = ease || easeOut;
    (function frame(now) {
      if (id.stop) return;
      var t = Math.min(1, (now - t0) / dur);
      step(ease(t), t);
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    })(t0);
    return id;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Counter animation for big numbers. `fmt` formats the in-between values.
  function countTo(el, to, fmt, dur) {
    if (!el) return;
    var from = el._v == null ? 0 : el._v;
    if (el._tw) el._tw.stop = true;
    el._v = to;
    if (from === to) { el.textContent = fmt(to); return; }
    el._tw = tween(dur || 750, function (k) { el.textContent = fmt(lerp(from, to, k)); }, easeOut);
  }

  function download(name, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\n');
    var a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }

  var D = P.data;
  function fmtDay(i, long) {
    var d = D.dateOf(i);
    return D.MONTHS[d.getUTCMonth()] + ' ' + String(d.getUTCDate()).padStart(2, '0') + (long ? ', ' + d.getUTCFullYear() : '');
  }
  function fmtRange(r) {
    var a = D.dateOf(r.from), b = D.dateOf(r.to);
    var ya = a.getUTCFullYear(), yb = b.getUTCFullYear();
    if (ya !== yb) return fmtDay(r.from) + " '" + String(ya).slice(2) + ' – ' + fmtDay(r.to) + " '" + String(yb).slice(2);
    return fmtDay(r.from) + ' – ' + fmtDay(r.to);
  }
  function isoDay(i) { return D.dateOf(i).toISOString().slice(0, 10); }

  P.u = {
    $: $, $$: $$, h: h, s: s, reduced: reduced,
    compact: compact, compactFixed: compactFixed, money: money, int: int, signed: signed, pct: pct, pctDelta: pctDelta,
    tween: tween, lerp: lerp, easeOut: easeOut, easeInOut: easeInOut, countTo: countTo, download: download,
    fmtDay: fmtDay, fmtRange: fmtRange, isoDay: isoDay
  };
})();
