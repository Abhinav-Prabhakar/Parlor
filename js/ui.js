/* Parlor — interface layer: cursor, popovers, filters, menus, notifications,
   search palette, widget management and sharing. */
(function () {
  var P = window.P, u = P.u, $ = u.$, $$ = u.$$, h = u.h, D = P.data;
  var S = function () { return P.state; };
  var phone = function () { return window.innerWidth < 760; };

  var IC = {
    check: '<svg class="tick" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#1a62d6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>',
    download: '<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5v9M5.2 7.8 9 11.6l3.8-3.8M3 13.5v1a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-1"/></svg>',
    hide: '<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="#c5363b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 9s2.4-4.5 6.5-4.5S15.5 9 15.5 9s-2.4 4.5-6.5 4.5S2.5 9 2.5 9Z"/><circle cx="9" cy="9" r="2"/><path d="M3 15 15 3"/></svg>',
    ask: '<svg viewBox="0 0 26 26" width="18" height="18" fill="#5b6472"><path d="M10 4.5c.75 4.6 2.4 6.25 7 7-4.6.75-6.25 2.4-7 7-.75-4.6-2.4-6.25-7-7 4.6-.75 6.25-2.4 7-7Z"/><path d="M19.5 1.5c.4 2.2 1.1 2.9 3.3 3.3-2.2.4-2.9 1.1-3.3 3.3-.4-2.2-1.1-2.9-3.3-3.3 2.2-.4 2.9-1.1 3.3-3.3Z"/></svg>',
    cal: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#333" stroke-width="1.6"><rect x="2.5" y="3.5" width="15" height="14" rx="3"/><path d="M2.5 8h15M6.5 2v3M13.5 2v3" stroke-linecap="round"/></svg>',
    jump: '<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="13" height="13" rx="3.5"/><path d="M7 11l4-4M7.5 7H11v3.5"/></svg>',
    chevL: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
    chevR: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
    ok: '<span class="ok"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg></span>'
  };
  var WIDGETS = [
    { id: 'payments', name: 'Payments', thumb: '<svg viewBox="0 0 24 18" width="22" height="16"><rect x="1" y="3" width="5" height="14" rx="1" fill="#2879fa"/><rect x="7" y="6" width="5" height="11" rx="1" fill="#7eaef5"/><rect x="13" y="9" width="5" height="8" rx="1" fill="#1d55ea"/><rect x="19" y="11" width="4" height="6" rx="1" fill="#c9dbf7"/></svg>' },
    { id: 'gross', name: 'Gross Volume', thumb: '<svg viewBox="0 0 24 18" width="22" height="16"><rect x="1" y="2" width="20" height="3.4" rx="1.7" fill="#14a32e"/><rect x="1" y="7.3" width="12" height="3.4" rx="1.7" fill="#186fee"/><rect x="1" y="12.6" width="8" height="3.4" rx="1.7" fill="#f36a9f"/></svg>' },
    { id: 'retention', name: 'Retention', thumb: '<svg viewBox="0 0 24 18" width="22" height="16" fill="none" stroke="#ee2f7e" stroke-width="2"><path d="M1 12h4V8h4v3h4V4h4v5h5"/></svg>' },
    { id: 'tx', name: 'Transactions', thumb: '<svg viewBox="0 0 24 18" width="22" height="16" fill="#9cd8a2"><rect x="2" y="12" width="4" height="4" rx="1.4"/><rect x="7" y="12" width="4" height="4" rx="1.4" fill="#0ca829"/><rect x="7" y="7" width="4" height="4" rx="1.4" fill="#0ca829"/><rect x="12" y="12" width="4" height="4" rx="1.4"/><rect x="17" y="12" width="4" height="4" rx="1.4"/><rect x="17" y="7" width="4" height="4" rx="1.4"/></svg>' },
    { id: 'customers', name: 'Customers', thumb: '<svg viewBox="0 0 24 18" width="22" height="16" fill="#9ecbf8"><rect x="2" y="12" width="4" height="4" rx="1.4"/><rect x="7" y="12" width="4" height="4" rx="1.4"/><rect x="12" y="12" width="4" height="4" rx="1.4" fill="#1a75fb"/><rect x="12" y="7" width="4" height="4" rx="1.4" fill="#1a75fb"/><rect x="12" y="2" width="4" height="4" rx="1.4" fill="#1a75fb"/><rect x="17" y="12" width="4" height="4" rx="1.4"/></svg>' },
    { id: 'insights', name: 'Insights', thumb: '<svg viewBox="0 0 24 18" width="22" height="16"><defs><linearGradient id="thg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1c4a97"/><stop offset=".55" stop-color="#9cb2b9"/><stop offset="1" stop-color="#f2a37c"/></linearGradient></defs><rect x="1" y="1" width="22" height="16" rx="4" fill="url(#thg)"/></svg>' }
  ];
  var CHANNELS = [
    { id: 'all', name: 'All channels', color: 'conic-gradient(#14a32e 0 50%, #1a75fb 0 75%, #ef2f7e 0)' },
    { id: 'online', name: 'Online', color: '#14a32e' },
    { id: 'subs', name: 'Subscriptions', color: '#1a75fb' },
    { id: 'store', name: 'In-store', color: '#ef2f7e' }
  ];

  /* ===================== Cursor ===================== */
  function initCursor() {
    if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
    var c = $('#cursor'), root = document.documentElement;
    root.classList.add('has-cursor');
    var CLICK = 'button, a, [role="button"], .gv-row, .ins-progress i, .ghost, .cal-grid .d, .n-item, .m-item, .seg button, .chip, .slash-item';
    var TEXT = '[contenteditable="true"], input, textarea';
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      c.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      c.classList.add('on');
      var t = e.target;
      var txt = t.closest && t.closest(TEXT) && !t.closest('.chip');
      c.classList.toggle('is-text', !!txt);
      c.classList.toggle('is-pointer', !txt && !!(t.closest && t.closest(CLICK)));
    }, { passive: true });
    document.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { c.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { c.classList.remove('on'); });
    document.addEventListener('mouseenter', function () { c.classList.add('on'); });
    window.addEventListener('blur', function () { c.classList.remove('on'); });
  }

  /* ===================== Toast ===================== */
  var toastT;
  function toast(msg) {
    var t = $('#toast');
    t.innerHTML = IC.ok + '<span>' + msg + '</span>';
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  /* ===================== Popovers ===================== */
  var cur = null;
  function closePop() {
    if (!cur) return;
    var p = cur; cur = null;
    p.el.classList.remove('open');
    if (p.anchor) p.anchor.classList.remove('open');
    if (p.anchor) p.anchor.setAttribute('aria-expanded', 'false');
    $('#scrim').classList.remove('on');
    if (p.onClose) p.onClose();
    setTimeout(function () { p.el.remove(); }, 260);
  }
  function place(p) {
    var el = p.el, a = p.anchor;
    if (!a || el.classList.contains('sheet')) return;
    var r = a.getBoundingClientRect(), w = el.offsetWidth, hh = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var left = p.align === 'left' ? r.left : p.align === 'center' ? r.left + r.width / 2 - w / 2 : r.right - w;
    left = Math.max(8, Math.min(vw - w - 8, left));
    var top = r.bottom + 8, up = false;
    if (top + hh > vh - 8 && r.top - hh - 8 > 8) { top = r.top - hh - 8; up = true; }
    el.classList.toggle('up', up);
    el.style.left = left + 'px'; el.style.top = top + 'px';
    el.style.setProperty('--ox', (r.left + r.width / 2 - left) + 'px');
    el.style.setProperty('--oy', up ? '100%' : '0');
  }
  function openPop(anchor, content, opts) {
    opts = opts || {};
    var same = cur && cur.anchor === anchor;
    closePop();
    if (same && anchor) return null;
    var el = h('div', { class: 'pop ' + (opts.cls || ''), role: opts.role || 'menu' });
    if (opts.sheet && phone()) { el.classList.add('sheet'); $('#scrim').classList.add('on'); }
    if (typeof content === 'string') el.innerHTML = content; else el.appendChild(content);
    document.body.appendChild(el);
    var p = cur = { el: el, anchor: anchor, align: opts.align, onClose: opts.onClose };
    if (anchor) { anchor.classList.add('open'); anchor.setAttribute('aria-expanded', 'true'); }
    place(p);
    requestAnimationFrame(function () { el.classList.add('open'); if (opts.onOpen) opts.onOpen(el); });
    return p;
  }
  document.addEventListener('pointerdown', function (e) {
    if (!cur) return;
    if (cur.el.contains(e.target) || (cur.anchor && cur.anchor.contains(e.target))) return;
    closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePop(); closePalette(); } });
  window.addEventListener('resize', function () { if (cur) place(cur); });
  window.addEventListener('scroll', function () { if (cur) place(cur); }, true);
  $('#scrim').addEventListener('click', function () { closePop(); closePalette(); });

  // segmented control
  function seg(opts, value, onChange) {
    var el = h('div', { class: 'seg' }), ind = h('span', { class: 'seg-ind' });
    el.appendChild(ind);
    var btns = opts.map(function (o) {
      var b = h('button', { type: 'button' }, o[1]);
      b.addEventListener('click', function () { set(o[0]); onChange(o[0]); });
      el.appendChild(b); return b;
    });
    function set(v, instant) {
      var i = opts.findIndex(function (o) { return o[0] === v; }), b = btns[i];
      btns.forEach(function (x, k) { x.classList.toggle('on', k === i); });
      if (instant) ind.style.transition = 'none';
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    }
    requestAnimationFrame(function () { set(value, true); });
    return el;
  }
  function item(html, onClick, cls) {
    var b = h('button', { class: 'm-item ' + (cls || ''), type: 'button' }, html);
    if (onClick) b.addEventListener('click', function (e) { onClick(e, b); });
    return b;
  }
  function frag(nodes) { var d = h('div'); nodes.forEach(function (n) { if (n) d.appendChild(n); }); return d; }
  function label(t) { return h('div', { class: 'm-label' }, t); }
  function sep() { return h('div', { class: 'm-sep' }); }

  /* ===================== Widgets: hide / restore ===================== */
  function cardOf(id) { return $('.card[data-widget="' + id + '"]'); }
  function widgetName(id) { return WIDGETS.filter(function (w) { return w.id === id; })[0].name; }
  function setHidden(id, hide) {
    var st = S(), i = st.hidden.indexOf(id);
    if (hide && i < 0) st.hidden.push(id);
    if (!hide && i >= 0) st.hidden.splice(i, 1);
    syncHidden();
    P.app.render(!hide, hide ? null : id);
    if (!hide) toast(widgetName(id) + ' added');
  }
  function syncHidden() {
    $$('.card[data-widget]').forEach(function (c) {
      var id = c.dataset.widget, hidden = S().hidden.indexOf(id) >= 0;
      if (!$('.ghost', c)) {
        var g = h('button', { class: 'ghost', type: 'button', 'aria-label': 'Add ' + widgetName(id) },
          '<div><span class="plus"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#222" stroke-width="1.6" stroke-linecap="round"><path d="M8 1.5v13M1.5 8h13"/></svg></span>' + widgetName(id) + '</div>');
        g.addEventListener('click', function () { setHidden(id, false); });
        c.appendChild(g);
      }
      c.classList.toggle('is-hidden', hidden);
    });
  }

  function addWidgetMenu(anchor) {
    var list = WIDGETS.map(function (w) {
      var on = S().hidden.indexOf(w.id) < 0;
      return item('<span class="w-thumb">' + w.thumb + '</span><span class="grow">' + w.name + '</span><span class="switch' + (on ? ' on' : '') + '"></span>', function (e, b) {
        var sw = $('.switch', b), nowOn = !sw.classList.contains('on');
        sw.classList.toggle('on', nowOn);
        setHidden(w.id, !nowOn);
      });
    });
    var body = frag([label('Widgets on Overview')].concat(list).concat([sep(), item('<svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="#333" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a6 6 0 1 0 1.8-4.3"/><path d="M3 3v3.5h3.5"/></svg><span class="grow">Reset to default view</span>', function () {
      closePop(); location.hash = ''; resetAll();
    })]));
    body.style.width = '280px';
    openPop(anchor, body, { align: 'right' });
  }
  function resetAll() {
    var d = JSON.parse(JSON.stringify(P.app.defaults));
    Object.keys(d).forEach(function (k) { P.state[k] = d[k]; });
    syncHidden(); P.app.render(true); toast('View reset');
  }

  /* ===================== Per-widget menus ===================== */
  function csvName(w) { return 'parlor-' + w + '-' + u.isoDay(S().range.from) + '_' + u.isoDay(S().range.to) + '.csv'; }
  function commonTail(id, rowsFn, header) {
    return [sep(),
      item(IC.download + '<span class="grow">Download CSV</span>', function () { closePop(); u.download(csvName(id), [header].concat(rowsFn())); toast('CSV downloaded'); }),
      item(IC.hide + '<span class="grow">Hide widget</span>', function () { closePop(); setHidden(id, true); }, 'danger')];
  }
  function channelList(key, re) {
    return CHANNELS.map(function (c) {
      return item('<span class="dotc" style="background:' + c.color + '"></span><span class="grow">' + c.name + '</span>' + IC.check, function (e, b) {
        S()[key].channel = c.id;
        $$('.m-item', b.parentNode).forEach(function (x) { x.classList.toggle('on', x === b); });
        P.app.render(true, re);
      }, S()[key].channel === c.id ? 'on' : '');
    });
  }
  var MENUS = {
    payments: function () {
      var ch = P.charts;
      return [label('Measure'), seg([['count', 'Count'], ['volume', 'Volume']], S().pay.measure, function (v) { S().pay.measure = v; P.app.render(true, 'payments'); }),
        item('<span class="grow">Comparison markers</span><span class="switch' + (S().pay.markers ? ' on' : '') + '"></span>', function (e, b) {
          S().pay.markers = !S().pay.markers; $('.switch', b).classList.toggle('on', S().pay.markers); P.app.render(false, 'payments');
        }),
        item(IC.ask + '<span class="grow">Explain this drop-off</span>', function () { closePop(); P.ask && P.ask.run('What caused the drop-off from authorized to /successful-payments'); })
      ].concat(commonTail('payments', ch.funnel.rows, ['Stage', 'Selected period', 'Compared period']));
    },
    gross: function () {
      return [label('Show channels as'), seg([['amount', 'Amount'], ['share', 'Share']], S().gross.mode, function (v) { S().gross.mode = v; P.app.render(true, 'gross'); })]
        .concat(commonTail('gross', function () {
          var m = P.app.model();
          return [['Online payments', m.cur.onlineRev, m.cmp.onlineRev], ['Subscriptions', m.cur.subsRev, m.cmp.subsRev], ['In-store sales', m.cur.storeRev, m.cmp.storeRev], ['Total', m.cur.gross, m.cmp.gross]]
            .map(function (r) { return [r[0], r[1].toFixed(2), r[2].toFixed(2)]; });
        }, ['Channel', 'Selected period ($)', 'Compared period ($)']));
    },
    retention: function () {
      return [label('Metric'), seg([['returning', 'Returning'], ['subscribers', 'Subscribers']], S().ret.metric, function (v) { S().ret.metric = v; P.app.render(true, 'retention'); })]
        .concat(commonTail('retention', P.charts.retention.rows, ['From', 'To', 'Rate (%)']));
    },
    tx: function () { return [label('Channel')].concat(channelList('tx', 'tx')).concat(commonTail('tx', P.charts.tx.rows, ['Bucket', 'First half', 'Second half', 'Total'])); },
    customers: function () { return [label('Acquired via')].concat(channelList('cust', 'customers')).concat(commonTail('customers', P.charts.cust.rows, ['Bucket', 'First half', 'Second half', 'New customers'])); }
  };

  /* ===================== Date range picker ===================== */
  function presetRanges() {
    var last = D.N - 1, ytd = D.idxOf(2026, 0, 1);
    return [
      ['Last 7 days', { from: last - 6, to: last }],
      ['Last 30 days', { from: last - 29, to: last }],
      ['Last 90 days', { from: last - 89, to: last }],
      ['Year to date', { from: ytd, to: last }],
      ['Jan 01 – Jul 31', { from: ytd, to: D.idxOf(2026, 6, 31) }],
      ['Last 12 months', { from: last - 364, to: last }],
      ['All time', { from: 0, to: last }]
    ];
  }
  function picker(anchor, which) {
    var st = S(), isCmp = which === 'compare';
    var sel = { from: (isCmp ? st.compare : st.range).from, to: (isCmp ? st.compare : st.range).to }, anchorDay = null, hoverDay = null;
    var view = D.dateOf(sel.to); var vy = view.getUTCFullYear(), vm = view.getUTCMonth();
    var root = h('div', { class: 'picker' }), pres = h('div', { class: 'presets' }), cal = h('div', { class: 'cal-wrap' });
    root.appendChild(pres); root.appendChild(cal);

    function apply(r, mode) {
      if (isCmp) P.app.setCompare(r, mode); else P.app.setRange(r);
      setTimeout(closePop, 160);
    }
    if (isCmp) {
      [['Previous period', 'previous'], ['Same period last year', 'year'], ['Custom range', 'custom']].forEach(function (p) {
        var b = item('<span class="grow">' + p[0] + '</span>', function () {
          if (p[1] === 'custom') { $$('.m-item', pres).forEach(function (x) { x.classList.toggle('on', x === b); }); return; }
          var tmp = JSON.parse(JSON.stringify(st)); tmp.cmpMode = p[1];
          apply(null, p[1]);
        }, st.cmpMode === p[1] ? 'on' : '');
        pres.appendChild(b);
      });
    } else {
      presetRanges().forEach(function (p) {
        var on = p[1].from === sel.from && p[1].to === sel.to;
        pres.appendChild(item('<span class="grow">' + p[0] + '</span>', function () { apply(p[1]); }, on ? 'on' : ''));
      });
    }

    function render() {
      var first = Date.UTC(vy, vm, 1), startIdx = Math.round((first - D.START) / D.DAY);
      var dim = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate(), lead = (new Date(first).getUTCDay() + 6) % 7;
      var lo = anchorDay != null ? Math.min(anchorDay, hoverDay == null ? anchorDay : hoverDay) : sel.from;
      var hi = anchorDay != null ? Math.max(anchorDay, hoverDay == null ? anchorDay : hoverDay) : sel.to;
      var other = isCmp ? st.range : st.compare;
      var html = '<div class="cal-head"><button type="button" data-nav="-1" aria-label="Previous month"' + (startIdx <= 0 ? ' disabled' : '') + '>' + IC.chevL + '</button><b>' +
        ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][vm] + ' ' + vy +
        '</b><button type="button" data-nav="1" aria-label="Next month"' + (startIdx + dim >= D.N ? ' disabled' : '') + '>' + IC.chevR + '</button></div><div class="cal-grid">';
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { html += '<div class="dw">' + d + '</div>'; });
      for (var k = 0; k < lead; k++) html += '<div></div>';
      for (var d = 1; d <= dim; d++) {
        var i = startIdx + d - 1, cls = 'd';
        if (i < 0 || i >= D.N) cls += ' dis';
        if (i >= lo && i <= hi) cls += ' in';
        if (i === lo) cls += ' s';
        if (i === hi) cls += ' e';
        if (i >= other.from && i <= other.to) cls += ' cmp';
        html += '<div class="' + cls + '" data-i="' + i + '"><span>' + d + '</span></div>';
      }
      html += '</div><div class="cal-foot"><span>' + (anchorDay != null ? 'Pick an end date' : '<b>' + u.fmtRange({ from: lo, to: hi }) + '</b> · ' + (hi - lo + 1) + ' days') + '</span></div>';
      cal.innerHTML = html;
    }
    cal.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) { vm += +nav.dataset.nav; if (vm < 0) { vm = 11; vy--; } if (vm > 11) { vm = 0; vy++; } render(); if (cur) place(cur); return; }
      var d = e.target.closest('.d'); if (!d || d.classList.contains('dis')) return;
      var i = +d.dataset.i;
      if (anchorDay == null) { anchorDay = i; hoverDay = i; render(); }
      else {
        var r = { from: Math.min(anchorDay, i), to: Math.max(anchorDay, i) };
        anchorDay = null; sel = r; render();
        apply(r, 'custom');
      }
    });
    cal.addEventListener('pointerover', function (e) {
      if (anchorDay == null) return;
      var d = e.target.closest('.d'); if (!d || d.classList.contains('dis')) return;
      if (+d.dataset.i !== hoverDay) { hoverDay = +d.dataset.i; render(); }
    });
    render();
    openPop(anchor, root, { align: isCmp ? 'right' : 'left', sheet: true, role: 'dialog', cls: 'date-pop' });
  }

  function granMenu(anchor) {
    var opts = [['daily', 'Daily', 'By weekday'], ['weekly', 'Weekly', 'Last 7 weeks'], ['monthly', 'Monthly', 'Last 7 months']];
    var body = frag([label('Group charts by')].concat(opts.map(function (o) {
      return item('<span class="grow">' + o[1] + '</span><span class="hint">' + o[2] + '</span>' + IC.check, function () { closePop(); P.app.setGran(o[0]); }, S().gran === o[0] ? 'on' : '');
    })));
    body.style.width = '250px';
    openPop(anchor, body, { align: 'right' });
  }

  /* ===================== Notifications ===================== */
  var notes = [];
  function buildNotes() {
    var last = D.N - 1, recent = D.slice({ from: last - 29, to: last });
    var best = recent.reduce(function (a, b) { var ta = a.tx.online + a.tx.subs + a.tx.store, tb = b.tx.online + b.tx.subs + b.tx.store; return tb > ta ? b : a; });
    var bestTx = best.tx.online + best.tx.subs + best.tx.store;
    var wk = D.slice({ from: last - 6, to: last }), pwk = D.slice({ from: last - 13, to: last - 7 });
    var bestS = D.STORES.map(function (st, k) {
      var a = wk.reduce(function (x, d) { return x + d.storeRevByLoc[k]; }, 0), b = pwk.reduce(function (x, d) { return x + d.storeRevByLoc[k]; }, 0);
      return { st: st, g: a / b - 1 };
    }).sort(function (a, b) { return b.g - a.g; })[0];
    var payout = D.slice({ from: last - 2, to: last }).reduce(function (a, d) { return a + d.onlineRev + d.subsRev; }, 0);
    notes = [
      { k: 'payout', t: 'Payout sent', s: '<span class="n-amt">$' + u.int(payout) + '</span> to •••• 4821', at: '2m', read: false },
      { k: 'dispute', t: 'Chargeback opened', s: 'SoHo · <span class="n-amt">$86.40</span> · Order #48213', at: '38m', read: false },
      { k: 'record', t: 'Best day this month', s: '<span class="n-amt">' + u.int(bestTx) + '</span> transactions on ' + u.fmtDay(best.i).replace(/ 0/, ' '), at: '3h', read: false },
      { k: 'store', t: bestS.st.name + ' is on a roll', s: '<span class="n-amt">' + (bestS.g >= 0 ? '+' : '') + Math.round(bestS.g * 100) + '%</span> in-store sales vs. last week', at: 'Yesterday', read: true },
      { k: 'subs', t: 'Renewals processed', s: '<span class="n-amt">' + u.int(wk[wk.length - 1].renewals) + '</span> subscriptions renewed overnight', at: 'Yesterday', read: true },
      { k: 'stock', t: 'Low stock risk', s: 'Fulton Market · 3 SKUs under 2 days of cover', at: 'Mon', read: true }
    ];
  }
  var NIC = {
    payout: ['#e3f6e6', '#bfe7c6', '<path d="M3 7.5h14M3 7.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7M3 7.5 5 4h10l2 3.5M7 12h2" stroke="#12a62c"/>'],
    dispute: ['#fde7e8', '#f6c2c5', '<path d="M10 3.5 17 16H3Z" stroke="#e5484d"/><path d="M10 8.5v3.2M10 13.8v.2" stroke="#e5484d"/>'],
    record: ['#e3edfe', '#bcd3fb', '<path d="M4 15.5V10M8 15.5V6.5M12 15.5V8.5M16 15.5V4" stroke="#1a75fb"/>'],
    store: ['#fde6ef', '#f6bfd5', '<path d="M3.5 8 5 4h10l1.5 4M3.5 8h13M3.5 8a2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.3 0M5 10v6h10v-6" stroke="#ef2f7e"/>'],
    subs: ['#ece7fe', '#d0c4fa', '<path d="M15.5 8A5.6 5.6 0 0 0 5 6.2M4.5 12a5.6 5.6 0 0 0 10.5 1.8" stroke="#7a5af5"/><path d="M5 3v3.4h3.3M15 17v-3.4h-3.3" stroke="#7a5af5"/>'],
    stock: ['#fdf0dc', '#f6d6a6', '<path d="M10 3 16.5 6.5v7L10 17l-6.5-3.5v-7Z M3.5 6.5 10 10l6.5-3.5M10 10v7" stroke="#e1801f"/>']
  };
  function unread() { return notes.filter(function (n) { return !n.read; }).length; }
  function syncDot() { $('.notif-dot').classList.toggle('off', unread() === 0); $('#bellBtn').setAttribute('aria-label', 'Notifications' + (unread() ? ' (' + unread() + ' unread)' : '')); }
  function notifPanel(anchor) {
    var root = h('div', { class: 'notif' });
    function render() {
      root.innerHTML = '<div class="notif-head"><b>Notifications</b>' + (unread() ? '<button type="button" data-all>Mark all read</button>' : '') + '</div>';
      var list = h('div', { class: 'notif-list' });
      if (!notes.length) list.innerHTML = '<div class="n-empty">You’re all caught up</div>';
      notes.forEach(function (n, i) {
        var ic = NIC[n.k];
        var b = h('button', { class: 'n-item' + (n.read ? ' read' : '') + (n.fresh ? ' new' : ''), type: 'button' },
          '<span class="n-ic" style="--bgc:' + ic[0] + ';--bd:' + ic[1] + '"><svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ic[2] + '</svg></span>' +
          '<span class="n-main"><b>' + n.t + '</b><small>' + n.s + '</small></span><span class="n-meta"><time>' + n.at + '</time><span class="u"></span></span>');
        n.fresh = false;
        b.addEventListener('click', function () { n.read = true; b.classList.add('read'); syncDot(); var a = $('[data-all]', root); if (a && !unread()) a.remove(); });
        list.appendChild(b);
      });
      root.appendChild(list);
      var all = $('[data-all]', root);
      if (all) all.addEventListener('click', function () { notes.forEach(function (n) { n.read = true; }); $$('.n-item', root).forEach(function (x) { x.classList.add('read'); }); all.remove(); syncDot(); });
    }
    render();
    openPop(anchor, root, { align: 'right', sheet: true, role: 'dialog' });
  }
  function liveNote() {
    var m = P.app.model(); if (!m) return;
    notes.unshift({ k: 'subs', t: 'New subscriber milestone', s: '<span class="n-amt">' + u.int(Math.ceil(m.cur.subscribers / 100) * 100) + '</span> active subscriptions', at: 'now', read: false, fresh: true });
    syncDot();
    var bell = $('.bell'); bell.classList.remove('ring'); void bell.getBoundingClientRect(); bell.classList.add('ring');
  }

  /* ===================== Search palette ===================== */
  var pal = null;
  function closePalette() {
    if (!pal) return;
    var p = pal; pal = null;
    p.classList.remove('open'); $('#scrim').classList.remove('on'); $('#searchBtn').classList.remove('open');
    setTimeout(function () { p.remove(); }, 250);
  }
  function openPalette() {
    closePop();
    if (pal) { closePalette(); return; }
    pal = h('div', { class: 'pop palette', role: 'dialog', 'aria-label': 'Search' },
      '<div class="pal-input"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#666" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="7"/><path d="M16 16l5 5"/></svg><input placeholder="Search widgets, dates, stores… or ask a question" aria-label="Search"><kbd>esc</kbd></div><div class="pal-list"></div>');
    document.body.appendChild(pal);
    $('#scrim').classList.add('on'); $('#searchBtn').classList.add('open');
    var input = $('input', pal), list = $('.pal-list', pal), kb = 0, items = [];
    function entries(q) {
      var out = [];
      WIDGETS.forEach(function (w) { out.push({ g: 'Jump to', html: '<span class="w-thumb">' + w.thumb + '</span><span class="grow">' + w.name + '</span>', text: w.name, run: function () { jump(w.id); } }); });
      presetRanges().forEach(function (p) { out.push({ g: 'Date range', html: IC.cal + '<span class="grow">' + p[0] + '</span><span class="hint">' + u.fmtRange(p[1]) + '</span>', text: p[0], run: function () { P.app.setRange(p[1]); } }); });
      D.STORES.forEach(function (s) { out.push({ g: 'Stores', html: '<span class="dotc" style="background:#ef2f7e"></span><span class="grow">' + s.name + '</span><span class="hint">' + s.city + '</span>', text: s.name + ' ' + s.city, run: function () { P.ask && P.ask.run('How is /in-store doing at ' + s.name); } }); });
      q = q.trim().toLowerCase();
      var f = q ? out.filter(function (o) { return o.text.toLowerCase().indexOf(q) >= 0; }) : out.slice(0, 13);
      if (q) f.push({ g: 'Ask Parlor', html: IC.ask + '<span class="grow">Ask “' + q.replace(/</g, '&lt;') + '”</span><span class="hint">↵</span>', run: function () { P.ask && P.ask.run(input.value); } });
      return f;
    }
    function render() {
      items = entries(input.value); list.innerHTML = ''; kb = Math.min(kb, items.length - 1);
      var g = null;
      items.forEach(function (o, i) {
        if (o.g !== g) { g = o.g; list.appendChild(label(g)); }
        var b = item(o.html, function () { closePalette(); o.run(); }, i === kb ? 'kb' : '');
        b.addEventListener('pointermove', function () { if (kb !== i) { kb = i; mark(); } });
        list.appendChild(b);
      });
    }
    function mark() { $$('.m-item', list).forEach(function (b, i) { b.classList.toggle('kb', i === kb); if (i === kb) b.scrollIntoView({ block: 'nearest' }); }); }
    input.addEventListener('input', function () { kb = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { kb = Math.min(items.length - 1, kb + 1); mark(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { kb = Math.max(0, kb - 1); mark(); e.preventDefault(); }
      if (e.key === 'Enter' && items[kb]) { var o = items[kb]; closePalette(); o.run(); }
    });
    render();
    input.focus();
    requestAnimationFrame(function () { pal.classList.add('open'); });
  }
  function jump(id) {
    var c = cardOf(id);
    if (S().hidden.indexOf(id) >= 0) setHidden(id, false);
    c.scrollIntoView({ behavior: u.reduced ? 'auto' : 'smooth', block: 'center' });
    c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
  }

  /* ===================== Nav ===================== */
  function navInd() {
    var nav = $('#nav'), a = $('a.active', nav), ind = $('.nav-ind', nav);
    if (!a) return;
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function initNav() {
    var nav = $('#nav'), hov = $('.nav-hover', nav);
    $$('a', nav).forEach(function (a) {
      a.setAttribute('tabindex', '0');
      a.addEventListener('pointerenter', function () {
        if (a.classList.contains('active')) { nav.classList.remove('hovering'); return; }
        hov.style.width = a.offsetWidth + 'px';
        hov.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        nav.classList.add('hovering');
      });
      a.addEventListener('click', function () {
        if (a.classList.contains('active')) return;
        toast(a.textContent + ' is on its way');
      });
    });
    nav.addEventListener('pointerleave', function () { nav.classList.remove('hovering'); });
    var ind = $('.nav-ind', nav); ind.style.transition = 'none'; navInd(); void ind.offsetWidth; ind.style.transition = '';
  }

  /* ===================== Init ===================== */
  function copyLink() {
    var url = location.href, btn = $('#linkBtn');
    function ok() { toast('Link to this view copied'); btn.classList.remove('done'); void btn.offsetWidth; btn.classList.add('done'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(ok, fallback);
    else fallback();
    function fallback() {
      var t = h('textarea'); t.value = url; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      t.remove(); ok();
    }
  }

  function init() {
    initCursor();
    initNav();
    buildNotes(); syncDot();
    syncHidden();
    $('#rangeBtn').addEventListener('click', function () { picker(this, 'range'); });
    $('#compareBtn').addEventListener('click', function () { picker(this, 'compare'); });
    $('#granBtn').addEventListener('click', function () { granMenu(this); });
    $('#addBtn').addEventListener('click', function () { addWidgetMenu(this); });
    $('#bellBtn').addEventListener('click', function () { notifPanel(this); });
    $('#searchBtn').addEventListener('click', openPalette);
    $('#linkBtn').addEventListener('click', copyLink);
    $('.brand').addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $$('.more[data-menu]').forEach(function (b) {
      b.setAttribute('aria-haspopup', 'menu');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var body = frag(MENUS[b.dataset.menu]());
        body.style.width = '256px';
        openPop(b, body, { align: 'right' });
      });
    });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    });
    setTimeout(liveNote, 24000);
  }

  P.ui = { init: init, toast: toast, relayout: function () { navInd(); }, syncHidden: syncHidden, openPop: openPop, closePop: closePop, jump: jump };
})();
