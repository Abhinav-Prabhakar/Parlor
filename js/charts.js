/* Parlor — chart renderers. Each chart owns its DOM, keeps its last drawn
   values and tweens from them, so filter changes morph rather than redraw. */
(function () {
  var P = window.P, u = P.u, $ = u.$, $$ = u.$$, s = u.s;

  function niceStep(raw) {
    if (raw <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function rel(el, card) {
    var a = el.getBoundingClientRect(), b = card.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height, r: a.right - b.left, b: a.bottom - b.top };
  }

  /* =========================================================
     Payments funnel
     ========================================================= */
  var Funnel = (function () {
    var card = $('.payments'), colsEl = $('#payCols'), cols = $$('.col', colsEl), svg = $('#payBars');
    var gW = $('#payWedges'), gB = $('#payBarG'), gM = $('#payMarkers'), axis = $('#payAxis'), selBg = $('#paySel'), tip = $('#payTip');
    var NAMES = ['initiated', 'authorized', 'successful', 'payouts', 'completed'];
    var bars = [], geo = null, cur = null, curCmp = null, curSc = null, tgt = null, tgtCmp = null, tgtSc = null;
    var lockIdx = 2, selIdx = 2, hovering = false, model = null, tw = null, lastPt = null;

    for (var i = 0; i < 5; i++) {
      var b = {};
      if (i < 4) { b.wedge = s('path', { fill: 'url(#wedge)' }); gW.appendChild(b.wedge); }
      b.hg = s('g', { class: 'hatched' });
      b.v = s('rect', { fill: 'url(#barV)' }); b.hg.appendChild(b.v);
      if (i < 3) { b.hz = s('rect', { fill: 'url(#barH)' }); b.hg.appendChild(b.hz); }
      b.ht = s('rect', { fill: i < 3 ? 'url(#hatch)' : 'url(#hatch2)', opacity: '.95' }); b.hg.appendChild(b.ht);
      b.sg = s('g', { class: 'solid', opacity: '0' });
      b.s1 = s('rect', { fill: 'url(#barSel)' }); b.s2 = s('rect', { fill: 'url(#barSelV)' }); b.s3 = s('rect', { fill: 'url(#selGlow)' });
      b.sg.appendChild(b.s1); b.sg.appendChild(b.s2); b.sg.appendChild(b.s3);
      gB.appendChild(b.hg); gB.appendChild(b.sg);
      b.mk = s('rect', { class: 'mk', width: 32, height: 8, rx: 4, fill: 'url(#marker)', stroke: '#fff', 'stroke-width': '1.5', 'paint-order': 'stroke' });
      gM.appendChild(b.mk);
      bars.push(b);
    }

    function measure() {
      var W = card.clientWidth, H = card.clientHeight;
      var cr = rel(colsEl, card), val = cols[0].querySelector('.val');
      var askH = parseFloat(getComputedStyle(card).getPropertyValue('--ask-h')) || 131;
      var vr = rel(val, card);
      geo = {
        W: W, H: H, x0: cr.x, x1: cr.r, top: cr.y, colW: cr.w / 5,
        yBot: H - askH - 17, yMax: vr.b + 22, askTop: H - askH
      };
      geo.wedge = Math.min(27, geo.colW * 0.127);
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }

    function scaleFor(v) {
      var max = Math.max.apply(null, v), min = Math.min.apply(null, v);
      var step = niceStep(Math.max(max - min, max * 0.15) / 3.5);
      var bot = Math.floor(min / step) * step;
      if (bot >= min * 0.985) bot -= step;
      if (bot < 0) bot = 0;
      return { max: max || 1, bot: bot, step: step };
    }
    function Y(v, sc) {
      var span = Math.max(1e-9, sc.max - sc.bot);
      return geo.yBot - (v - sc.bot) / span * (geo.yBot - geo.yMax);
    }

    function draw(v, c, sc) {
      var g = geo, H = g.H + 12, showMk = P.state.pay.markers;
      for (var i = 0; i < 5; i++) {
        var b = bars[i], x = g.x0 + i * g.colW, w = i < 4 ? g.colW - g.wedge : g.colW;
        var top = Math.min(H, Y(v[i], sc)), hh = Math.max(0, H - top);
        [b.v, b.hz, b.ht, b.s1, b.s2].forEach(function (r) {
          if (!r) return;
          r.setAttribute('x', x); r.setAttribute('y', top); r.setAttribute('width', w); r.setAttribute('height', hh);
        });
        b.s3.setAttribute('x', x); b.s3.setAttribute('y', top); b.s3.setAttribute('width', w); b.s3.setAttribute('height', Math.max(0, Math.min(hh, g.askTop + 4 - top)));
        if (b.wedge) {
          var top2 = Math.min(H, Y(v[i + 1], sc));
          b.wedge.setAttribute('d', 'M' + (x + w) + ' ' + top + ' L' + (x + g.colW) + ' ' + top2 + ' L' + (x + g.colW) + ' ' + H + ' L' + (x + w) + ' ' + H + ' Z');
        }
        var my = Y(c[i], sc) - 4;
        b.mk.setAttribute('x', x + w / 2 - 16);
        b.mk.setAttribute('y', Math.max(g.top + 64, Math.min(g.askTop - 12, my)));
        b.mk.style.opacity = showMk && c[i] > 0 ? 1 : 0;
      }
      if (!hovering) placeTipRest(v, sc);
    }

    function fmtVal(v) { return P.state.pay.measure === 'volume' ? u.money(v) : u.compactFixed(v); }
    function fmtTick(v) { return (P.state.pay.measure === 'volume' ? '$' : '') + u.compact(v, 0); }

    function drawAxis(sc) {
      var keep = {};
      $$('span', axis).forEach(function (sp) { keep[sp.dataset.v] = sp; });
      var used = {};
      for (var k = 0; k < 9; k++) {
        var v = sc.bot + k * sc.step, y = Y(v, sc);
        if (y < geo.top + 50) break;
        var key = String(Math.round(v)), sp = keep[key];
        if (!sp) { sp = u.h('span', { class: 'out' }); sp.dataset.v = key; axis.appendChild(sp); sp.style.top = y + 'px'; requestAnimationFrame(function (e) { return function () { e.classList.remove('out'); }; }(sp)); }
        sp.textContent = fmtTick(v);
        sp.style.top = y + 'px';
        used[key] = 1;
      }
      Object.keys(keep).forEach(function (key) {
        if (!used[key]) { var e = keep[key]; e.classList.add('out'); setTimeout(function () { e.remove(); }, 400); }
      });
    }

    function tipHTML(i) {
      var v = tgt[i], m = P.state.pay.measure === 'volume' ? 'volume' : 'transactions';
      var val = '<b>' + fmtVal(v) + '</b> ' + m;
      var full, short;
      if (i === 0) {
        var d = u.pctDelta(v, tgtCmp[i]);
        var cls = d >= 0 ? 'up' : 'down', t = (d >= 0 ? '+' : '') + (d * 100).toFixed(0) + '%';
        full = val + ' <em>|</em> vs compared: <b class="' + cls + '">' + t + '</b>';
        short = '<b>' + fmtVal(v) + '</b> <em>·</em> <b class="' + cls + '">' + t + '</b>';
      } else {
        var conv = tgt[i - 1] ? v / tgt[i - 1] : 0, drop = conv - 1;
        full = val + ' <em>|</em> Conversion: <b>' + Math.round(conv * 100) + '%</b> <em>|</em> Drop-off: <b>' + Math.round(drop * 100) + '%</b>';
        short = '<b>' + fmtVal(v) + '</b> <em>·</em> <b>' + Math.round(conv * 100) + '%</b> <em>·</em> <b>' + Math.round(drop * 100) + '%</b>';
      }
      return '<span class="tt-c">' + full + '</span><span class="tt-s">' + short + '</span>';
    }

    function setSel(i, force) {
      if (i === selIdx && !force) return;
      selIdx = i;
      cols.forEach(function (c, k) { c.classList.toggle('active', k === i); });
      bars.forEach(function (b, k) { b.sg.setAttribute('opacity', k === i ? 1 : 0); b.hg.setAttribute('opacity', k === i ? 0 : 1); });
      selBg.style.transform = 'translateX(' + (geo.x0 + i * geo.colW) + 'px)';
      selBg.style.width = (geo.colW + 1) + 'px';
      if (tgt) tip.innerHTML = tipHTML(i);
    }

    function moveTip(x, y) {
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      x = Math.max(12, Math.min(geo.W - tw - 12, x));
      y = Math.max(geo.top + 4, Math.min(geo.askTop - th - 8, y));
      tip.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }
    function placeTipRest(v, sc) {
      if (!geo) return;
      var i = selIdx, x = geo.x0 + i * geo.colW, top = Y((v || cur)[i], sc || curSc);
      var narrow = geo.W < 560;
      moveTip(narrow ? x + geo.colW / 2 - tip.offsetWidth / 2 : x + Math.min(77, geo.colW * 0.36), top - (narrow ? 46 : 56));
    }

    function update(m, animate) {
      model = m;
      var ms = P.state.pay.measure;
      var vals = NAMES.map(function (n) { return ms === 'volume' ? m.cur[n] * m.aov : m.cur[n]; });
      var cmps = NAMES.map(function (n) { return ms === 'volume' ? m.cmp[n] * m.cmpAov : m.cmp[n]; });
      if (!geo) measure();
      tgt = vals; tgtCmp = cmps; tgtSc = scaleFor(vals);
      var from = cur || [0, 0, 0, 0, 0], fromC = curCmp || [0, 0, 0, 0, 0];
      var fromSc = curSc || { max: tgtSc.max, bot: tgtSc.bot, step: tgtSc.step };
      if (!cur) { from = vals.map(function () { return tgtSc.bot - (tgtSc.max - tgtSc.bot) * 0.6; }); fromC = from.slice(); }
      drawAxis(tgtSc);
      cols.forEach(function (c, k) { u.countTo(c.querySelector('.val'), vals[k], fmtVal, animate ? 800 : 1); });
      tip.innerHTML = tipHTML(selIdx);
      if (tw) tw.stop = true;
      var a = from.slice(), ac = fromC.slice();
      tw = u.tween(animate ? 850 : 1, function (k) {
        cur = a.map(function (x, j) { return u.lerp(x, vals[j], k); });
        curCmp = ac.map(function (x, j) { return u.lerp(x, cmps[j], k); });
        curSc = { max: u.lerp(fromSc.max, tgtSc.max, k), bot: u.lerp(fromSc.bot, tgtSc.bot, k), step: tgtSc.step };
        draw(cur, curCmp, curSc);
      });
      setSel(selIdx, true);
    }

    function relayout() {
      if (!tgt) return;
      measure();
      cur = tgt.slice(); curCmp = tgtCmp.slice(); curSc = tgtSc;
      draw(cur, curCmp, curSc); drawAxis(curSc); setSel(selIdx, true);
      placeTipRest();
    }

    function idxAt(e) {
      var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < geo.x0 || x > geo.x1 || y < geo.top || y > geo.askTop) return null;
      return { i: Math.max(0, Math.min(4, Math.floor((x - geo.x0) / geo.colW))), x: x, y: y };
    }
    card.addEventListener('pointermove', function (e) {
      if (!geo || card.classList.contains('is-hidden') || e.target.closest('.ask, .more') || $('#ask').classList.contains('expanded')) { leave(); return; }
      var p = idxAt(e);
      if (!p) { leave(); return; }
      if (e.pointerType === 'touch') return;
      hovering = true; tip.classList.add('follow');
      setSel(p.i);
      lastPt = p;
      moveTip(p.x + 17, p.y - 46);
    });
    function leave() {
      if (!hovering) return;
      hovering = false; tip.classList.remove('follow');
      setSel(lockIdx); placeTipRest();
    }
    card.addEventListener('pointerleave', leave);
    card.addEventListener('click', function (e) {
      if (!geo || e.target.closest('.ask, .more, .ghost')) return;
      var p = idxAt(e);
      if (!p) return;
      lockIdx = p.i; setSel(p.i);
      if (e.pointerType !== 'mouse') { hovering = false; tip.classList.remove('follow'); placeTipRest(); }
      P.state.pay.sel = p.i;
    });

    return {
      update: update, relayout: relayout,
      setSel: function (i) { lockIdx = i; setSel(i); placeTipRest(); },
      rows: function () {
        return NAMES.map(function (n, i) { return [cols[i].querySelector('.full').textContent, Math.round(model.cur[n]), Math.round(model.cmp[n])]; });
      }
    };
  })();

  /* =========================================================
     Gross volume
     ========================================================= */
  var Gross = (function () {
    var amount = $('#gvAmount'), delta = $('#gvDelta'), rows = $$('.gv-row');
    var KEYS = { online: 'onlineRev', subs: 'subsRev', store: 'storeRev' };
    function update(m, animate) {
      var g = m.cur.gross, gc = m.cmp.gross, d = u.pctDelta(g, gc);
      u.countTo(amount, g, function (v) { return u.money(v); }, animate ? 900 : 1);
      delta.classList.toggle('neg', Math.round(d * 100) < 0);
      var dt = delta.querySelector('span');
      u.countTo(dt, Math.abs(d * 100), function (v) { return Math.round(v) + '%'; }, animate ? 900 : 1);
      var vals = rows.map(function (r) { return m.cur[KEYS[r.dataset.ch]]; });
      var max = Math.max.apply(null, vals) || 1;
      rows.forEach(function (r, i) {
        var ch = r.dataset.ch, v = vals[i], vc = m.cmp[KEYS[ch]], share = g ? v / g : 0, dd = u.pctDelta(v, vc);
        var b = r.querySelector('.gv-head b');
        if (P.state.gross.mode === 'share') u.countTo(b, share * 100, function (x) { return x.toFixed(1) + '%'; }, animate ? 800 : 1);
        else u.countTo(b, v, u.money, animate ? 800 : 1);
        var w = (v / max) * 72;
        var fill = r.querySelector('.fill');
        if (!animate) { fill.style.transition = 'none'; requestAnimationFrame(function () { fill.style.transition = ''; }); }
        fill.style.width = w + '%';
        var tip = r.querySelector('.gv-tip');
        tip.style.left = 'calc(' + w + '% + 2px)';
        tip.classList.toggle('flip', w > 46);
        tip.innerHTML = (P.state.gross.mode === 'share' ? '<b>' + u.money(v) + '</b>' : '<b>' + Math.round(share * 100) + '%</b> of volume') +
          ' <span class="' + (dd >= 0 ? 'up-t' : 'down-t') + '">' + (dd >= 0 ? '▲' : '▼') + ' ' + Math.abs(Math.round(dd * 100)) + '%</span>';
      });
    }
    rows.forEach(function (r) {
      r.addEventListener('click', function () {
        var on = !r.classList.contains('hl');
        rows.forEach(function (x) { x.classList.remove('hl'); });
        r.classList.toggle('hl', on);
      });
    });
    return { update: update };
  })();

  /* =========================================================
     Retention step chart
     ========================================================= */
  var Retention = (function () {
    var card = $('.retention'), svg = $('#retChart'), area = $('#retArea'), line = $('#retLine'), fade = $('#retFadeRect');
    var base = $('#retBase'), guide = $('#retGuide'), dot = $('#retDot'), pill = $('#retPill'), months = $('#retMonths'), clip = $('#retClipRect');
    var geo, series = null, cur = null, hoverIdx = null, restIdx = 0, tw = null, range = null;

    function measure() {
      var W = card.clientWidth, H = card.clientHeight, narrow = W < 400;
      geo = { W: W, H: H, xL: narrow ? 20 : 31, xR: W - (narrow ? 20 : 31), base: H - (narrow ? 50 : 65), top: Math.max(118, H * 0.29) };
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      base.setAttribute('x1', geo.xL); base.setAttribute('x2', geo.xR); base.setAttribute('y1', geo.base + 0.5); base.setAttribute('y2', geo.base + 0.5);
      fade.setAttribute('x', geo.xL - 4); fade.setAttribute('width', geo.xR - geo.xL + 8);
      fade.setAttribute('y', geo.top - 20); fade.setAttribute('height', geo.base - geo.top + 20);
    }
    function maxSteps() { return Math.max(6, Math.floor((geo.xR - geo.xL) / 23)); }
    function X(day) { return geo.xL + (day - range.from) / (range.to - range.from + 1) * (geo.xR - geo.xL); }
    function yScale() {
      var mx = Math.max.apply(null, series.map(function (p) { return p.value; }));
      return function (v) { return geo.base - v / (mx / 0.97) * (geo.base - geo.top); };
    }
    function path(vals) {
      var y = yScale(), d = '';
      series.forEach(function (p, i) {
        var x0 = X(p.from), x1 = X(p.to + 1), yy = y(vals[i]);
        d += (i === 0 ? 'M' + x0 + ' ' + yy : ' V' + yy) + ' H' + x1;
      });
      return d;
    }
    function draw(vals) {
      var d = path(vals);
      line.setAttribute('d', d);
      area.setAttribute('d', d + ' V' + geo.base + ' H' + geo.xL + ' Z');
      placeDot(false);
    }
    function placeDot(anim) {
      if (!series || !cur) return;
      var i = hoverIdx == null ? restIdx : hoverIdx, p = series[i], y = yScale();
      var cx = (X(p.from) + X(p.to + 1)) / 2, cy = y(cur[i]);
      dot.style.transition = anim ? '' : 'none';
      dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      guide.setAttribute('x1', cx); guide.setAttribute('x2', cx); guide.setAttribute('y1', cy + 9); guide.setAttribute('y2', geo.base);
      guide.style.opacity = hoverIdx == null ? 0 : 1;
      var pw = pill.offsetWidth;
      var px = Math.max(10, Math.min(geo.W - pw - 10, cx - pw / 2)), py = Math.max(76, cy - 55);
      pill.style.transition = anim ? '' : 'none';
      pill.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
      if (!anim) { void pill.offsetWidth; pill.style.transition = ''; dot.style.transition = ''; }
      var label = hoverIdx == null ? u.pct(series[i].value) : u.pct(series[i].value) + '  ' + '<span style="color:#8a8a8a;font-weight:400">' + u.fmtDay(p.from) + '</span>';
      pill.innerHTML = label;
    }
    function labels() {
      months.innerHTML = '';
      var span = range.to - range.from + 1, out = [];
      if (span > 62) {
        var bs = P.data.buckets(range, 'monthly');
        bs.forEach(function (b) { out.push({ x: (X(b.from) + X(b.to + 1)) / 2, t: P.data.MONTHS[P.data.dateOf(b.from).getUTCMonth()], w: b.to - b.from }); });
        out = out.filter(function (o) { return o.w > 8; });
      } else {
        var n = Math.min(6, span);
        for (var k = 0; k < n; k++) {
          var day = range.from + Math.round((k + 0.5) * span / n - 0.5);
          out.push({ x: X(day + 0.5), t: span <= 7 ? P.data.DOWS[P.data.dateOf(day).getUTCDay()] : u.fmtDay(day).replace(/ 0/, ' ') });
        }
      }
      var maxL = Math.max(2, Math.floor((geo.xR - geo.xL) / 48));
      var stepN = Math.ceil(out.length / maxL);
      out.filter(function (_, i) { return i % stepN === 0; }).forEach(function (o) {
        var sp = u.h('span', null, o.t);
        sp.style.left = Math.max(geo.xL + 10, Math.min(geo.xR - 10, o.x)) + 'px';
        months.appendChild(sp);
      });
    }

    function update(m, animate) {
      if (!geo) measure();
      range = m.range;
      var next = P.data.retentionSeries(range, P.state.gran, P.state.ret.metric, maxSteps());
      var same = series && series.length === next.length && cur;
      var fromVals = same ? cur.slice() : null;
      series = next;
      restIdx = 0;
      series.forEach(function (p, i) { if (p.value > series[restIdx].value) restIdx = i; });
      var vals = series.map(function (p) { return p.value; });
      labels();
      if (tw) tw.stop = true;
      if (same && animate) {
        tw = u.tween(700, function (k) { cur = fromVals.map(function (v, i) { return u.lerp(v, vals[i], k); }); draw(cur); });
        clip.setAttribute('width', geo.W + 20);
      } else {
        cur = vals; draw(cur);
        if (animate) {
          clip.setAttribute('width', 0);
          tw = u.tween(900, function (k) { clip.setAttribute('width', geo.xL - 4 + k * (geo.xR - geo.xL + 24)); }, u.easeInOut);
        } else clip.setAttribute('width', geo.W + 20);
      }
      placeDot(false);
    }
    function relayout() { if (!series) return; measure(); var m = { range: range }; series = null; update(m, false); }

    card.addEventListener('pointermove', function (e) {
      if (!series || !geo || e.target.closest('.more')) return;
      var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < geo.xL - 6 || x > geo.xR + 6 || y < geo.top - 60 || y > geo.base + 30) { if (hoverIdx != null) { hoverIdx = null; placeDot(true); } return; }
      var day = range.from + (x - geo.xL) / (geo.xR - geo.xL) * (range.to - range.from + 1), idx = 0;
      series.forEach(function (p, i) { if (day >= p.from) idx = i; });
      if (idx !== hoverIdx) { hoverIdx = idx; placeDot(true); }
    });
    card.addEventListener('pointerleave', function () { hoverIdx = null; placeDot(true); });

    return {
      update: update, relayout: relayout,
      rows: function () { return series.map(function (p) { return [u.isoDay(p.from), u.isoDay(p.to), (p.value * 100).toFixed(2)]; }); }
    };
  })();

  /* =========================================================
     Dot matrices (Transactions / Customers)
     ========================================================= */
  function DotChart(cardSel, kind) {
    var card = $(cardSel), wrap = $('.dots', card), pill = $('.float-pill', card), num = $('.big-num', card), vs = $('.vs b', card);
    var groups = [], peak = 0, hover = null, grpEls = [], restWord = kind === 'cust' ? 'Highest' : 'Peak';

    function levels(gs) {
      var all = []; gs.forEach(function (g) { all.push(g.norm[0], g.norm[1]); });
      var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
      return function (v) { return mx === mn ? 2 : 1 + Math.round(3 * (v - mn) / (mx - mn)); };
    }
    function build(animate) {
      wrap.innerHTML = ''; grpEls = [];
      var lv = levels(groups);
      groups.forEach(function (g, gi) {
        var ge = u.h('div', { class: 'dgrp' });
        g.norm.forEach(function (v, ci) {
          var col = u.h('div', { class: 'dcol' }), n = lv(v);
          for (var k = 0; k < n; k++) {
            var d = u.h('span', animate ? { class: 'dpop', style: 'animation-delay:' + ((gi * 2 + ci) * 22 + k * 30) + 'ms' } : null);
            col.appendChild(d);
          }
          ge.appendChild(col);
        });
        wrap.appendChild(ge); grpEls.push(ge);
      });
    }
    function highlight(anim) {
      var i = hover == null ? peak : hover, g = groups[i];
      if (!g) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      grpEls.forEach(function (e, k) { e.classList.toggle('on', k === i); });
      pill.innerHTML = hover == null ? restWord + ': <b>' + g.label + '</b>' : g.label + ': <b>' + u.compact(g.total) + '</b>';
      var cr = card.getBoundingClientRect(), gr = grpEls[i].getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      var pw = pill.offsetWidth, cx = gr.left - cr.left + gr.width / 2;
      var x = Math.max(12, Math.min(cr.width - pw - 12, cx - pw / 2));
      var ds = parseFloat(getComputedStyle(wrap).getPropertyValue('--ds')) || 13;
      var y = wr.bottom - cr.top - (4 * ds + 6) - (cr.width <= 520 ? 9 : 20) - 33;
      pill.style.transition = anim ? '' : 'none';
      pill.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (!anim) { void pill.offsetWidth; pill.style.transition = ''; }
    }
    // Fit the dot size to the space left between the number and the "vs" block
    function fit() {
      var n = groups.length || 7, row = wrap.parentNode, compact = card.clientWidth <= 520;
      var avail = compact ? row.clientWidth : row.clientWidth - num.offsetWidth - $('.vs', card).offsetWidth - 40;
      var ds = Math.max(7, Math.min(13, (avail - 8) / (n * 2.96)));
      wrap.style.setProperty('--ds', ds.toFixed(2) + 'px');
    }
    function update(m, animate) {
      var ch = P.state[kind === 'cust' ? 'cust' : 'tx'].channel;
      groups = P.data.distribution(m.range, P.state.gran, kind, ch);
      var score = function (g) { return g.avg != null ? g.avg : g.total; };
      peak = 0; groups.forEach(function (g, i) { if (score(g) > score(groups[peak])) peak = i; });
      var total = m.curT[kind](ch), prev = m.cmpT[kind](ch), nf = kind === 'cust' ? u.int : u.compactFixed;
      // reserve the final width so the dots don't shift while the counter runs
      var shown = num.textContent; num.style.minWidth = ''; num.textContent = nf(total);
      num.style.minWidth = num.offsetWidth + 'px'; num.textContent = shown;
      u.countTo(num, total, nf, animate ? 850 : 1);
      var d = total - prev;
      vs.classList.toggle('neg', d < 0);
      vs._v = vs._v == null ? 0 : vs._v;
      u.countTo(vs, d, function (v) { return u.signed(v); }, animate ? 850 : 1);
      build(animate);
      fit();
      hover = null;
      requestAnimationFrame(function () { highlight(false); });
    }
    wrap.addEventListener('pointermove', function (e) {
      var g = e.target.closest('.dgrp'); if (!g) return;
      var i = grpEls.indexOf(g);
      if (i !== hover) { hover = i; highlight(true); }
    });
    card.addEventListener('pointermove', function (e) {
      if (hover == null) return;
      var r = wrap.getBoundingClientRect();
      if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 60 || e.clientY > r.bottom + 10) { hover = null; highlight(true); }
    });
    card.addEventListener('pointerleave', function () { if (hover != null) { hover = null; highlight(true); } });
    return {
      update: update, relayout: function () { num.style.minWidth = ''; var t = num.textContent; num.textContent = (kind === 'cust' ? u.int : u.compactFixed)(num._v || 0); num.style.minWidth = num.offsetWidth + 'px'; num.textContent = t; fit(); highlight(false); },
      rows: function () { return groups.map(function (g) { return [g.long, g.parts[0], g.parts[1], g.total]; }); }
    };
  }

  P.charts = {
    funnel: Funnel, gross: Gross, retention: Retention,
    tx: DotChart('.tx', 'tx'), cust: DotChart('.customers', 'cust')
  };
})();
