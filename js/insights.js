/* Parlor — Insights carousel. Three story-style screens; slide 1 keeps the
   original hand-tuned artwork, slides 2 and 3 are generated with the same
   recipe (blurred colour mesh + frosted glass forms) in their own palettes. */
(function () {
  var P = window.P, u = P.u, $ = u.$, $$ = u.$$, D = P.data;
  var card = $('.insights'), stage = $('#insStage'), prog = $('#insProgress');
  var DUR = 8000;

  // ---------- art helpers ----------
  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; }
  // Bilinear sample of a control grid (rows top→bottom, cols left→right)
  function sample(grid, x, y) {
    var R = grid.length - 1, C = grid[0].length - 1;
    var fy = Math.max(0, Math.min(R, y * R)), fx = Math.max(0, Math.min(C, x * C));
    var r0 = Math.floor(fy), c0 = Math.floor(fx), r1 = Math.min(R, r0 + 1), c1 = Math.min(C, c0 + 1);
    var top = mix(hex(grid[r0][c0]), hex(grid[r0][c1]), fx - c0), bot = mix(hex(grid[r1][c0]), hex(grid[r1][c1]), fx - c0);
    return mix(top, bot, fy - r0);
  }
  function mesh(grid) {
    var out = '';
    for (var r = -1; r < 10; r++) for (var c = -1; c < 11; c++) {
      var x = c * 58, y = r * 55;
      out += '<rect x="' + x + '" y="' + y + '" width="59" height="56" fill="' + css(sample(grid, (c + 1) / 11, (r + 1) / 10)) + '"/>';
    }
    return out;
  }
  function filters(id) {
    return '<filter id="mesh' + id + '" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="26" edgeMode="duplicate"/></filter>' +
      '<filter id="b1' + id + '" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '<filter id="b05' + id + '" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.6"/></filter>' +
      '<filter id="b4' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '<filter id="b10' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>' +
      '<filter id="b20' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>';
  }
  function arc(cx, cy, r, a0, a1) {
    var rad = Math.PI / 180, x0 = cx + r * Math.cos(a0 * rad), y0 = cy + r * Math.sin(a0 * rad), x1 = cx + r * Math.cos(a1 * rad), y1 = cy + r * Math.sin(a1 * rad);
    return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }
  function ring(cx, cy, R, r) {
    return 'M' + (cx - R) + ' ' + cy + ' a' + R + ' ' + R + ' 0 1 0 ' + (2 * R) + ' 0 a' + R + ' ' + R + ' 0 1 0 ' + (-2 * R) + ' 0 Z ' +
      'M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0 a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0 Z';
  }

  // ---------- slide 2: subscriptions — frosted renewal rings ----------
  var GRID2 = [
    ['#dcdfcb', '#d2d9b2', '#ebcf8c', '#f3c676'],
    ['#a9c7b5', '#b7cfa8', '#e2c98a', '#efc98a'],
    ['#5c9f8f', '#76b29b', '#acd0ae', '#e9e3ba'],
    ['#165451', '#21766a', '#5aa992', '#d2e8d0'],
    ['#0a2a2f', '#0e3f42', '#2b8473', '#c2e3d1'],
    ['#082025', '#0b3337', '#26786a', '#bfe0d0']
  ];
  function art2(id) {
    var cx = 468, cy = 52, R = 196, r = 124, mid = (R + r) / 2;
    return '<svg class="ins-art" viewBox="0 0 580 495" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>' + filters(id) +
      '<linearGradient id="rf' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fae6" stop-opacity=".55"/><stop offset=".5" stop-color="#6fb79a" stop-opacity=".38"/><stop offset="1" stop-color="#f0cf86" stop-opacity=".22"/></linearGradient>' +
      '<linearGradient id="rb' + id + '" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" stop-color="#fffdf4" stop-opacity=".95"/><stop offset=".5" stop-color="#f3f8ea" stop-opacity=".55"/><stop offset="1" stop-color="#f6f3dc" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ra' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffd98a"/></linearGradient>' +
      '<clipPath id="rc' + id + '"><path d="' + ring(cx, cy, R, r) + '" clip-rule="evenodd"/></clipPath>' +
      '</defs><g>' +
      '<g filter="url(#mesh' + id + ')">' + mesh(GRID2) + '</g>' +
      // cast shadow
      '<path d="' + ring(cx + 14, cy + 22, R, r) + '" fill="#0d3b3a" fill-rule="evenodd" opacity=".34" filter="url(#b20' + id + ')"/>' +
      // ring body
      '<path d="' + ring(cx, cy, R, r) + '" fill="url(#rf' + id + ')" fill-rule="evenodd" filter="url(#b1' + id + ')"/>' +
      '<g clip-path="url(#rc' + id + ')">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 4) + '" fill="none" stroke="#0f4d45" stroke-opacity=".5" stroke-width="16" filter="url(#b4' + id + ')"/>' +
        '<circle cx="' + (cx - 10) + '" cy="' + (cy - 12) + '" r="' + mid + '" fill="none" stroke="#f3fbec" stroke-opacity=".38" stroke-width="30" filter="url(#b4' + id + ')"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 9) + '" fill="none" stroke="url(#rb' + id + ')" stroke-width="20" filter="url(#b1' + id + ')"/>' +
      '</g>' +
      '<path d="' + arc(cx, cy, R - 6, 95, 205) + '" stroke="#fff" stroke-opacity=".7" stroke-width="18" fill="none" filter="url(#b10' + id + ')"/>' +
      '<path d="' + arc(cx, cy, R, 92, 228) + '" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" filter="url(#b05' + id + ')"/>' +
      '<path d="' + arc(cx, cy, r, -60, 70) + '" stroke="#f6fff4" stroke-width="2" fill="none" opacity=".9" stroke-linecap="round" filter="url(#b05' + id + ')"/>' +
      // live retention arc
      '<path class="ret-arc" d="' + arc(cx, cy, mid, 90.5, 449.5) + '" pathLength="1" stroke="url(#ra' + id + ')" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="0 1" opacity=".95"/>' +
      '<path class="ret-arc-glow" d="' + arc(cx, cy, mid, 90.5, 449.5) + '" pathLength="1" stroke="#ffd877" stroke-width="18" stroke-linecap="round" fill="none" stroke-dasharray="0 1" opacity=".75" filter="url(#b4' + id + ')"/>' +
      // small orbiting ring
      '<path d="' + ring(548, 300, 62, 38) + '" fill="#0d3b3a" fill-rule="evenodd" opacity=".2" filter="url(#b10' + id + ')" transform="translate(8 12)"/>' +
      '<path d="' + ring(548, 300, 62, 38) + '" fill="url(#rf' + id + ')" fill-rule="evenodd" filter="url(#b05' + id + ')"/>' +
      '<path d="' + arc(548, 300, 58, 110, 220) + '" stroke="#fff" stroke-opacity=".65" stroke-width="8" fill="none" filter="url(#b4' + id + ')"/>' +
      '<path d="' + arc(548, 300, 62, 105, 235) + '" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" filter="url(#b05' + id + ')"/>' +
      '<path d="' + arc(548, 300, 38, -50, 60) + '" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round" filter="url(#b05' + id + ')"/>' +
      '</g></svg>';
  }

  // ---------- slide 3: in-store — hanging glass pillars, one per store ----------
  var GRID3 = [
    ['#e7dde6', '#e6cdd9', '#efbfca', '#f7cab9'],
    ['#cdb8d6', '#d3aacb', '#e6a3bb', '#f3bca9'],
    ['#9277bd', '#ac84c2', '#da98bb', '#f1cbbb'],
    ['#432f80', '#6243a2', '#b37bba', '#eed5d3'],
    ['#1f1545', '#311f64', '#7250a2', '#e6d2e2'],
    ['#170f36', '#26184f', '#5f418f', '#e2cfe0']
  ];
  function art3(id) {
    var out = '<svg class="ins-art" viewBox="0 0 580 495" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>' + filters(id) +
      '<linearGradient id="pf' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3f6" stop-opacity=".55"/><stop offset=".35" stop-color="#f3c6dc" stop-opacity=".32"/><stop offset="1" stop-color="#b98bd0" stop-opacity=".22"/></linearGradient>' +
      '<linearGradient id="ph' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe2c7" stop-opacity=".85"/><stop offset=".45" stop-color="#ffb59a" stop-opacity=".55"/><stop offset="1" stop-color="#f08a9a" stop-opacity=".35"/></linearGradient>' +
      '<linearGradient id="pv' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>' +
      '</defs><g>' +
      '<g filter="url(#mesh' + id + ')">' + mesh(GRID3) + '</g>';
    for (var k = 0; k < 5; k++) {
      var x = 318 + k * 54, w = 44;
      out += '<g class="pillar" data-k="' + k + '" style="transform-origin:' + (x + w / 2) + 'px -20px">' +
        '<rect class="p-sh" x="' + (x + 7) + '" y="-40" width="' + w + '" height="200" rx="22" fill="#2a1450" opacity=".22" filter="url(#b10' + id + ')"/>' +
        '<rect class="p-body" x="' + x + '" y="-40" width="' + w + '" height="200" rx="22" fill="url(#' + (k === 0 ? 'ph' : 'pf') + id + ')" filter="url(#b05' + id + ')"/>' +
        '<rect class="p-v" x="' + x + '" y="-40" width="' + w + '" height="200" rx="22" fill="url(#pv' + id + ')"/>' +
        '<rect class="p-hl" x="' + (x + 7) + '" y="-40" width="9" height="190" rx="4.5" fill="#fff" opacity=".5" filter="url(#b4' + id + ')"/>' +
        '<rect class="p-edge" x="' + (x + .8) + '" y="-40" width="' + (w - 1.6) + '" height="200" rx="21.2" fill="none" stroke="#fff" stroke-width="1.6" opacity=".85" filter="url(#b05' + id + ')"/>' +
        '<ellipse class="p-cap" cx="' + (x + w / 2) + '" cy="150" rx="13" ry="5" fill="#fff" opacity=".55" filter="url(#b4' + id + ')"/>' +
        '</g>';
    }
    return out + '</g></svg>';
  }

  // ---------- content ----------
  var slides = [], idx = 0, model = null, timer = null;

  function build() {
    var s2 = u.h('div', { class: 'ins-slide', 'data-i': 1 }, art2('s2') + textHTML());
    var s3 = u.h('div', { class: 'ins-slide', 'data-i': 2 }, art3('s3') + textHTML());
    stage.appendChild(s2); stage.appendChild(s3);
    slides = $$('.ins-slide', stage);
  }
  function textHTML() { return '<div class="ins-text"><div class="ins-big"><span class="num">0</span></div><h3 class="ins-head"></h3><p class="ins-body"></p></div>'; }

  function storeDow(r) {
    var dd = D.slice(r), byDow = [0, 0, 0, 0, 0, 0, 0], n = [0, 0, 0, 0, 0, 0, 0];
    dd.forEach(function (d) { byDow[d.dow] += d.storeTx; n[d.dow]++; });
    var avg = byDow.map(function (v, i) { return n[i] ? v / n[i] : 0; });
    var best = 0; avg.forEach(function (v, i) { if (v > avg[best]) best = i; });
    var others = avg.filter(function (_, i) { return i !== best; });
    var mean = others.reduce(function (a, b) { return a + b; }, 0) / (others.length || 1);
    return { day: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][best], lift: mean ? avg[best] / mean - 1 : 0 };
  }

  function content(m) {
    var c = m.cur, p = m.cmp;
    var ar = c.initiated ? c.authorized / c.initiated : 0, arp = p.initiated ? p.authorized / p.initiated : 0, dpts = (ar - arp) * 100;
    var saved = Math.round(Math.abs(ar - arp) * c.initiated), dollars = saved * m.aov * 0.886;
    var subsShare = c.gross ? c.subsRev / c.gross : 0, retD = (c.subRet - p.subRet) * 100;
    var stores = c.stores.slice().sort(function (a, b) { return b.rev - a.rev; }), top = stores[0];
    var storeTotal = c.storeRev || 1, sd = storeDow(m.range);
    return [
      {
        value: ar * 100, fmt: function (v) { return Math.round(v) + '%'; },
        head: 'Authorization rate ' + (dpts >= 0 ? 'increased' : 'slipped') + ' by ' + Math.abs(dpts).toFixed(1).replace(/\.0$/, '') + '% compared to last period.',
        body: dpts >= 0
          ? 'This improvement reduced failed transactions by ' + u.int(saved) + ' and is projected to recover $' + u.int(Math.round(dollars / 100) * 100) + '.'
          : 'That cost roughly ' + u.int(saved) + ' approvals — about $' + u.int(Math.round(dollars / 100) * 100) + ' in volume to win back.'
      },
      {
        value: c.subRet * 100, fmt: function (v) { return Math.round(v) + '%'; }, arc: c.subRet,
        head: 'Subscribers renewed at ' + Math.round(c.subRet * 100) + '%, ' + (retD >= 0 ? 'up ' : 'down ') + Math.abs(retD).toFixed(1).replace(/\.0$/, '') + '% on last period.',
        body: u.int(c.subscribers) + ' active subscribers generated ' + u.money(c.subsRev) + ' — ' + Math.round(subsShare * 100) + '% of gross volume.'
      },
      {
        value: top.rev / storeTotal * 100, fmt: function (v) { return Math.round(v) + '%'; },
        shares: c.stores.map(function (s) { return s.rev / storeTotal; }), topId: top.store.id,
        head: top.store.name + ' drives ' + Math.round(top.rev / storeTotal * 100) + '% of in-store sales.',
        body: sd.day + ' are the busiest in-store day across ' + c.stores.length + ' locations — ' + Math.round(sd.lift * 100) + '% above the rest of the week.'
      }
    ];
  }

  function fill(i, animateNum) {
    var s = slides[i], c = model[i];
    s.querySelector('.ins-head').textContent = c.head;
    s.querySelector('.ins-body').textContent = c.body;
    var num = s.querySelector('.num');
    if (animateNum) num._v = c.value * 0.82;
    u.countTo(num, c.value, c.fmt, animateNum ? 900 : 1);
    if (i === 1) {
      $$('.ret-arc, .ret-arc-glow', s).forEach(function (a) {
        a.style.transition = animateNum ? 'stroke-dasharray 1.4s cubic-bezier(.22,.9,.24,1) .2s' : 'none';
        a.setAttribute('stroke-dasharray', animateNum ? '0 1' : c.arc + ' 1');
        if (animateNum) requestAnimationFrame(function () { requestAnimationFrame(function () { a.setAttribute('stroke-dasharray', c.arc + ' 1'); }); });
      });
    }
    if (i === 2) {
      var order = c.shares.map(function (v, k) { return k; });
      var mx = Math.max.apply(null, c.shares);
      $$('.pillar', s).forEach(function (g, k) {
        var len = 120 + (c.shares[k] / mx) * 170; // bottom of the pill in svg units
        ['.p-sh', '.p-body', '.p-v', '.p-edge'].forEach(function (sel) { var r = g.querySelector(sel); r.setAttribute('height', len + 40); });
        g.querySelector('.p-hl').setAttribute('height', len + 26);
        g.querySelector('.p-cap').setAttribute('cy', len - 8);
        g.style.transition = animateNum ? 'transform 1.1s cubic-bezier(.22,.9,.24,1) ' + (0.12 + k * 0.07) + 's' : 'none';
        g.style.transform = animateNum ? 'scaleY(.35)' : 'none';
        if (animateNum) requestAnimationFrame(function () { requestAnimationFrame(function () { g.style.transform = 'none'; }); });
      });
    }
  }

  function go(i, dir) {
    if (i === idx && slides[i].classList.contains('is-active')) return;
    var prev = slides[idx];
    dir = dir || (i > idx ? 1 : -1);
    slides.forEach(function (s) { s.style.setProperty('--dir', (dir > 0 ? 4 : -4) + '%'); });
    prev.classList.add('leaving'); prev.classList.remove('is-active');
    prev.style.setProperty('--dir', (dir > 0 ? -4 : 4) + '%');
    setTimeout(function () { prev.classList.remove('leaving'); }, 700);
    idx = i;
    slides[i].classList.add('is-active');
    if (model) fill(i, true);
    progress();
  }
  function progress() {
    $$('i', prog).forEach(function (seg, k) {
      seg.classList.toggle('done', k < idx);
      seg.classList.remove('on');
      if (k === idx) { void seg.offsetWidth; seg.classList.add('on'); }
    });
  }
  function next() { go((idx + 1) % slides.length, 1); }
  function prevS() { go((idx + slides.length - 1) % slides.length, -1); }

  build();
  prog.style.setProperty('--dur', DUR + 'ms');
  prog.addEventListener('animationend', function (e) { if (e.target.parentNode.classList.contains('on')) next(); });
  $$('i', prog).forEach(function (seg, k) { seg.addEventListener('click', function () { go(k); }); });
  $('.ins-nav.next', card).addEventListener('click', next);
  $('.ins-nav.prev', card).addEventListener('click', prevS);
  card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') card.classList.add('paused'); });
  card.addEventListener('pointerleave', function () { card.classList.remove('paused'); });
  document.addEventListener('visibilitychange', function () { card.classList.toggle('paused', document.hidden); });
  // swipe
  var sx = null, sy = null;
  card.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
  card.addEventListener('pointerup', function (e) {
    if (sx == null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { (dx < 0 ? next : prevS)(); card._swiped = Date.now(); }
  });
  $$('.ins-nav', card).forEach(function (b) { b.addEventListener('click', function (e) { if (card._swiped && Date.now() - card._swiped < 300) e.stopImmediatePropagation(); }, true); });
  // horizontal trackpad scroll
  var wheelLock = 0;
  card.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    e.preventDefault();
    if (Date.now() - wheelLock < 700) return;
    wheelLock = Date.now(); (e.deltaX > 0 ? next : prevS)();
  }, { passive: false });
  card.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prevS(); });

  P.insights = {
    update: function (m, animate) {
      var first = !model;
      model = content(m);
      slides.forEach(function (_, i) { if (i !== idx) fill(i, false); });
      fill(idx, animate || first);
      if (first) progress();
    },
    go: go
  };
})();
