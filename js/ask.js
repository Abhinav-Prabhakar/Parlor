/* Parlor — "What would you like to explore next?" Ask panel.
   Contenteditable input with slash commands that turn into styled chips,
   and a small answer engine that responds with visuals from the dataset. */
(function () {
  var P = window.P, u = P.u, $ = u.$, $$ = u.$$, h = u.h, D = P.data;
  var ask = $('#ask'), input = $('#askInput'), thread = $('#askThread'), menu = $('#slashMenu'), head = $('#askHead'), send = $('#askSend');

  var CMDS = [
    { cmd: 'successful-payments', kind: 'metric', hint: 'Funnel stage' },
    { cmd: 'authorized-payments', kind: 'metric', hint: 'Funnel stage' },
    { cmd: 'initiated-payments', kind: 'metric', hint: 'Funnel stage' },
    { cmd: 'gross-volume', kind: 'metric', hint: 'Metric' },
    { cmd: 'retention', kind: 'metric', hint: 'Metric' },
    { cmd: 'customers', kind: 'metric', hint: 'Metric' },
    { cmd: 'online', kind: 'online', hint: 'Channel' },
    { cmd: 'subscriptions', kind: 'subs', hint: 'Channel' },
    { cmd: 'in-store', kind: 'store', hint: 'Channel' },
    { cmd: 'last-30-days', kind: 'time', hint: 'Time' },
    { cmd: 'compare', kind: 'action', hint: 'Action' },
    { cmd: 'forecast', kind: 'action', hint: 'Action' }
  ];
  var GLYPH = { metric: '#', online: '●', subs: '↻', store: '⌂', time: '◷', action: '✦' };
  function find(c) { return CMDS.filter(function (x) { return x.cmd === c; })[0]; }
  function chipLabel(c) { return '/' + (c === 'in-store' ? c : c.replace(/-/g, ' ')); }
  function chipEl(c, fresh) {
    var cm = find(c);
    var el = h('span', { class: 'chip' + (fresh ? ' chip-in' : ''), contenteditable: 'false', 'data-cmd': c, 'data-kind': cm.kind }, chipLabel(c));
    return el;
  }
  function chipHTML(c) { var cm = find(c); return '<span class="chip" data-kind="' + cm.kind + '">' + chipLabel(c) + '</span>'; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // ---------- input helpers ----------
  function caretInfo() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    if (!input.contains(r.startContainer) || r.startContainer.nodeType !== 3) return null;
    return { node: r.startContainer, off: r.startOffset, before: r.startContainer.textContent.slice(0, r.startOffset) };
  }
  function replaceWithChip(info, len, cmd) {
    var r = document.createRange();
    r.setStart(info.node, info.off - len); r.setEnd(info.node, info.off);
    r.deleteContents();
    var chip = chipEl(cmd, true), sp = document.createTextNode(' ');
    r.insertNode(sp); r.insertNode(chip);
    var sel = window.getSelection(), nr = document.createRange();
    nr.setStart(sp, 1); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
  }
  function serialize(el) {
    var out = '';
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += n.textContent;
      else if (n.classList && n.classList.contains('chip')) out += '/' + n.dataset.cmd;
      else if (n.nodeName === 'BR') out += ' ';
      else out += n.textContent;
    });
    return out.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  }
  function toHTML(text) {
    return esc(text).replace(/(^|\s)\/([a-z0-9-]+)/g, function (m, pre, c) { return find(c) ? pre + chipHTML(c) : m; });
  }
  function syncSend() { send.disabled = !serialize(input); }

  // ---------- slash menu ----------
  var matches = [], mi = 0, open = false;
  function showMenu(q) {
    matches = CMDS.filter(function (c) { return c.cmd.indexOf(q) === 0; }).concat(CMDS.filter(function (c) { return q && c.cmd.indexOf(q) > 0; }));
    mi = 0; open = true;
    renderMenu();
    menu.classList.add('open');
  }
  function renderMenu() {
    if (!matches.length) { menu.innerHTML = '<div class="slash-empty">No matching command</div>'; return; }
    menu.innerHTML = matches.slice(0, 7).map(function (c, i) {
      return '<div class="slash-item' + (i === mi ? ' sel' : '') + '" data-i="' + i + '" role="option"><span class="sw chip" data-kind="' + c.kind + '" style="padding:0">' + GLYPH[c.kind] + '</span><span class="nm">' + chipLabel(c.cmd) + '</span><kbd>' + c.hint + '</kbd></div>';
    }).join('');
  }
  function hideMenu() { open = false; menu.classList.remove('open'); }
  function pick(c) {
    var info = caretInfo(); if (!info) return;
    var m = /\/([a-z0-9-]*)$/.exec(info.before);
    if (m) replaceWithChip(info, m[0].length, c.cmd);
    hideMenu(); syncSend();
  }
  menu.addEventListener('pointerdown', function (e) {
    var it = e.target.closest('.slash-item'); if (!it) return;
    e.preventDefault(); pick(matches[+it.dataset.i]);
  });
  menu.addEventListener('pointermove', function (e) {
    var it = e.target.closest('.slash-item'); if (!it || +it.dataset.i === mi) return;
    mi = +it.dataset.i; renderMenu();
  });

  input.addEventListener('input', function (e) {
    var info = caretInfo();
    if (info) {
      // "/command" + space → chip
      var m = /(^|[\s ])\/([a-z0-9-]+)[  ]$/.exec(info.before);
      if (m && find(m[2])) { replaceWithChip(info, m[2].length + 2, m[2]); hideMenu(); syncSend(); return; }
      var q = /(^|[\s ])\/([a-z0-9-]*)$/.exec(info.before);
      if (q) showMenu(q[2]); else hideMenu();
    } else hideMenu();
    if (!input.textContent.trim() && !$('.chip', input)) input.innerHTML = '';
    syncSend();
  });
  input.addEventListener('keydown', function (e) {
    if (open && matches.length) {
      if (e.key === 'ArrowDown') { mi = (mi + 1) % Math.min(7, matches.length); renderMenu(); e.preventDefault(); return; }
      if (e.key === 'ArrowUp') { mi = (mi + Math.min(7, matches.length) - 1) % Math.min(7, matches.length); renderMenu(); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { pick(matches[mi]); e.preventDefault(); return; }
    }
    if (e.key === 'Escape') { hideMenu(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  input.addEventListener('blur', function () { setTimeout(hideMenu, 120); });
  input.addEventListener('paste', function (e) {
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, t.replace(/\s+/g, ' '));
  });
  send.addEventListener('click', function () { submit(); });

  // ---------- panel ----------
  function setExpanded(v) {
    ask.classList.toggle('expanded', v);
    head.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v && !thread.children.length) suggestions();
  }
  head.addEventListener('click', function () { setExpanded(!ask.classList.contains('expanded')); });

  function suggestions() {
    var box = h('div', { class: 'msg bot' });
    box.innerHTML = '<span class="av">' + spark(18) + '</span>';
    var a = h('div', { class: 'answer' });
    a.innerHTML = '<h4>Try one of these</h4>';
    var acts = h('div', { class: 'a-actions' });
    [
      'What caused the drop-off from authorized to /successful-payments',
      'Which /in-store location is leading',
      '/forecast /gross-volume for the next 30 days',
      'How is /retention trending'
    ].forEach(function (q) {
      var b = h('button', { type: 'button' }, toHTML(q));
      b.addEventListener('click', function () { run(q); });
      acts.appendChild(b);
    });
    a.appendChild(acts); box.appendChild(a); thread.appendChild(box);
  }

  function spark(sz) { return '<svg viewBox="0 0 26 26" width="' + sz + '" height="' + sz + '" fill="#5b6472"><path d="M10 4.5c.75 4.6 2.4 6.25 7 7-4.6.75-6.25 2.4-7 7-.75-4.6-2.4-6.25-7-7 4.6-.75 6.25-2.4 7-7Z"/><path d="M19.5 1.5c.4 2.2 1.1 2.9 3.3 3.3-2.2.4-2.9 1.1-3.3 3.3-.4-2.2-1.1-2.9-3.3-3.3 2.2-.4 2.9-1.1 3.3-3.3Z"/><path d="M19.5 16.5c.4 2.2 1.1 2.9 3.3 3.3-2.2.4-2.9 1.1-3.3 3.3-.4-2.2-1.1-2.9-3.3-3.3 2.2-.4 2.9-1.1 3.3-3.3Z"/></svg>'; }

  function submit() {
    var q = serialize(input);
    if (!q) return;
    input.innerHTML = ''; hideMenu(); syncSend();
    run(q);
  }

  function scrollDown() { thread.scrollTo({ top: thread.scrollHeight, behavior: u.reduced ? 'auto' : 'smooth' }); }
  function run(q) {
    setExpanded(true);
    var um = h('div', { class: 'msg user' }, '<div class="bubble">' + toHTML(q) + '</div>');
    thread.appendChild(um);
    var bm = h('div', { class: 'msg bot' }, '<span class="av">' + spark(18) + '</span><div class="answer"><span class="typing"><i></i><i></i><i></i></span></div>');
    thread.appendChild(bm);
    setTimeout(scrollDown, 60);
    setTimeout(function () {
      var a = answer(q);
      $('.answer', bm).innerHTML = '<h4>' + a.head + '</h4>' + (a.sub ? '<div class="sub">' + a.sub + '</div>' : '') + (a.vis || '');
      if (a.actions) {
        var acts = h('div', { class: 'a-actions' });
        a.actions.forEach(function (x) { var b = h('button', { type: 'button' }, x[0]); b.addEventListener('click', x[1]); acts.appendChild(b); });
        $('.answer', bm).appendChild(acts);
      }
      scrollDown();
    }, 750 + Math.random() * 350);
  }

  // ---------- answer engine ----------
  function deltaTxt(d) { return '<em class="' + (d >= 0 ? 'up-t' : 'down-t') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(d * 100)) + '%</em>'; }
  function tiles(arr) {
    return '<div class="a-tiles">' + arr.map(function (t) { return '<div class="a-tile"><small>' + t[0] + '</small><b>' + t[1] + '</b>' + (t[2] != null ? deltaTxt(t[2]) : '') + '</div>'; }).join('') + '</div>';
  }
  function sparkSvg(vals, color, fc) {
    var W = 600, H = 86, mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var n = vals.length + (fc ? fc.length : 0) - 1;
    function pt(v, i) { return [(i / n) * W, H - 6 - (v - mn * 0.9) / (mx * 1.05 - mn * 0.9) * (H - 12)]; }
    if (fc) { mx = Math.max(mx, Math.max.apply(null, fc.map(function (f) { return f[2]; }))); mn = Math.min(mn, Math.min.apply(null, fc.map(function (f) { return f[1]; }))); }
    var pts = vals.map(pt), d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var gid = 'sg' + Math.random().toString(36).slice(2, 7);
    var svg = '<svg class="a-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + ' L' + pts[pts.length - 1][0] + ' ' + H + ' L0 ' + H + ' Z" fill="url(#' + gid + ')"/>' +
      '<path class="ln" pathLength="1" d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
    if (fc) {
      var off = vals.length - 1, last = pts[pts.length - 1];
      var up = fc.map(function (f, i) { return pt(f[2], off + i + 1); }), lo = fc.map(function (f, i) { return pt(f[1], off + i + 1); }), mid = fc.map(function (f, i) { return pt(f[0], off + i + 1); });
      svg += '<path d="M' + last.join(' ') + ' L' + up.map(function (p) { return p.join(' '); }).join(' L') + ' L' + lo.slice().reverse().map(function (p) { return p.join(' '); }).join(' L') + ' Z" fill="' + color + '" opacity=".12"/>' +
        '<path d="M' + last.join(' ') + ' L' + mid.map(function (p) { return p.join(' '); }).join(' L') + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="#fff" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/>';
    }
    return svg + '</svg>';
  }

  function answer(q) {
    var m = P.app.model(), c = m.cur, p = m.cmp, lq = q.toLowerCase();
    var cmds = (q.match(/\/([a-z0-9-]+)/g) || []).map(function (x) { return x.slice(1); });
    function has(x) { return cmds.indexOf(x) >= 0; }
    var store = D.STORES.filter(function (s) { return lq.indexOf(s.name.toLowerCase()) >= 0; })[0];

    if (has('forecast') || /forecast|predict|project|next \d+ days|next month/.test(lq)) {
      var last = D.N - 1, hist = D.series({ from: last - 89, to: last }, function (d) { return d.onlineRev + d.subsRev + d.storeRev; }, 30);
      var vals = hist.map(function (x) { return x.value; });
      var n = vals.length, xm = (n - 1) / 2, ym = vals.reduce(function (a, b) { return a + b; }, 0) / n, num = 0, den = 0;
      vals.forEach(function (v, i) { num += (i - xm) * (v - ym); den += (i - xm) * (i - xm); });
      var slope = num / den, fc = [];
      for (var k = 1; k <= 10; k++) { var v = ym + slope * (n - 1 - xm + k); fc.push([v, v * (1 - 0.03 - k * 0.006), v * (1 + 0.03 + k * 0.006)]); }
      var next30 = fc.reduce(function (a, f) { return a + f[0]; }, 0) * 3, prev30 = D.slice({ from: last - 29, to: last }).reduce(function (a, d) { return a + d.onlineRev + d.subsRev + d.storeRev; }, 0);
      return {
        head: 'Next 30 days: about <b>' + u.money(next30) + '</b> in gross volume',
        sub: 'Based on the last 90 days · ' + deltaTxt(next30 / prev30 - 1) + ' vs. the last 30 days',
        vis: sparkSvg(vals, '#1a75fb', fc) + tiles([['Projected volume', u.money(next30)], ['Low case', u.money(next30 * 0.94)], ['High case', u.money(next30 * 1.06)]])
      };
    }
    if (has('in-store') || store || /store|location|shop|retail/.test(lq)) {
      var st = c.stores.slice().sort(function (a, b) { return b.rev - a.rev; }), mx = st[0].rev, focus = store ? store.id : st[0].store.id;
      var f = c.stores.filter(function (s) { return s.store.id === focus; })[0], fp = p.stores.filter(function (s) { return s.store.id === focus; })[0];
      return {
        head: '<b>' + f.store.name + '</b> ' + (store ? 'brought in ' : 'leads in-store with ') + '<b>' + u.money(f.rev) + '</b> — ' + Math.round(f.rev / c.storeRev * 100) + '% of store sales',
        sub: f.store.city + ' · ' + u.int(f.tx) + ' orders · ' + deltaTxt(u.pctDelta(f.rev, fp.rev)) + ' vs. compared period',
        vis: '<div class="a-bars">' + st.map(function (s, i) {
          var on = s.store.id === focus;
          return '<div class="a-bar"><span style="' + (on ? 'color:#111;font-weight:500' : '') + '">' + s.store.name + '</span><span class="tr"><i style="width:' + (s.rev / mx * 100) + '%;background:' + (on ? 'repeating-linear-gradient(-55deg,#f36a9f 0 4.2px,#ffbdd6 4.2px 6px)' : '#f5c3d7') + ';animation-delay:' + i * 60 + 'ms"></i></span><b>' + u.money(s.rev) + '</b></div>';
        }).join('') + '</div>'
      };
    }
    if (/drop|fail|declin|cause|why|lost/.test(lq) || has('successful-payments') || has('authorized-payments')) {
      var cols = ['#1d55ea', '#2879fa', '#5d98f7', '#9dbff7', '#cfe0fa'];
      var tot = c.failed, top = c.declines.slice().sort(function (a, b) { return b.count - a.count; })[0];
      return {
        head: '<b>' + u.int(tot) + '</b> authorized payments didn’t settle — <b>' + top.reason.name.toLowerCase() + '</b> leads at ' + Math.round(top.count / tot * 100) + '%',
        sub: 'Authorized → successful conversion: ' + Math.round(c.successful / c.authorized * 100) + '% · ' + deltaTxt((c.successful / c.authorized) / (p.successful / p.authorized) - 1) + ' vs. compared period',
        vis: '<div class="a-stack">' + c.declines.map(function (d, i) { return '<i style="flex:' + d.count + ';background:' + cols[i] + ';animation-delay:' + i * 70 + 'ms" title="' + d.reason.name + '"></i>'; }).join('') + '</div>' +
          '<div class="a-legend">' + c.declines.map(function (d, i) { return '<span><i style="background:' + cols[i] + '"></i>' + d.reason.name + ' <b>' + u.compact(d.count) + '</b></span>'; }).join('') + '</div>',
        actions: [['Enable smart retries', function () { P.ui.toast('Smart retries enabled for soft declines'); }], ['Highlight in funnel', function () { setExpanded(false); P.charts.funnel.setSel(2); }]]
      };
    }
    if (has('retention') || has('customers') || /retention|churn|returning|repeat|loyal/.test(lq)) {
      var rs = D.retentionSeries(m.range, 'monthly', 'returning', 12);
      return {
        head: 'Returning customers drive <b>' + Math.round(c.returning * 100) + '%</b> of activity, ' + ((c.returning - p.returning) >= 0 ? 'up ' : 'down ') + Math.abs(Math.round((c.returning - p.returning) * 100)) + ' pts',
        vis: sparkSvg(rs.map(function (x) { return x.value; }), '#ee2f7e') +
          tiles([['Returning rate', Math.round(c.returning * 100) + '%', c.returning / p.returning - 1], ['Subscriber renewal', Math.round(c.subRet * 100) + '%', c.subRet / p.subRet - 1], ['New customers', u.int(c.cust('all')), u.pctDelta(c.cust('all'), p.cust('all'))]])
      };
    }
    var chan = has('online') ? 'online' : has('subscriptions') ? 'subs' : (/online|web|ecom/.test(lq) ? 'online' : /subscri|recurring|renewal/.test(lq) ? 'subs' : null);
    if (chan) {
      var key = chan === 'online' ? 'onlineRev' : 'subsRev', col = chan === 'online' ? '#12a62c' : '#1a75fb', name = chan === 'online' ? 'Online' : 'Subscriptions';
      var orders = c.tx(chan), porders = p.tx(chan);
      var ser = D.series(m.range, function (d) { return chan === 'online' ? d.onlineRev : d.subsRev; }, 32);
      return {
        head: '<b>' + name + '</b> brought in <b>' + u.money(c[key]) + '</b>, ' + deltaTxt(u.pctDelta(c[key], p[key])) + ' vs. compared period',
        vis: sparkSvg(ser.map(function (x) { return x.value; }), col) +
          tiles([['Volume', u.money(c[key]), u.pctDelta(c[key], p[key])], [chan === 'online' ? 'Orders' : 'Renewals', u.compact(orders), u.pctDelta(orders, porders)], ['Avg. order', '$' + (c[key] / orders).toFixed(2), (c[key] / orders) / (p[key] / porders) - 1]])
      };
    }
    // overview / compare
    var g = D.series(m.range, function (d) { return d.onlineRev + d.subsRev + d.storeRev; }, 32);
    return {
      head: 'Gross volume is <b>' + u.money(c.gross) + '</b>, ' + deltaTxt(u.pctDelta(c.gross, p.gross)) + ' vs. ' + u.fmtRange(m.cmpRange),
      vis: sparkSvg(g.map(function (x) { return x.value; }), '#1a75fb') +
        tiles([['Gross volume', u.money(c.gross), u.pctDelta(c.gross, p.gross)], ['Transactions', u.compact(c.tx('all')), u.pctDelta(c.tx('all'), p.tx('all'))], ['New customers', u.int(c.cust('all')), u.pctDelta(c.cust('all'), p.cust('all'))]])
    };
  }

  syncSend();
  P.ask = { run: run, expand: setExpanded };
})();
