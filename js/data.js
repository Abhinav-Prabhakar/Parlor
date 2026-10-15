/* Parlor — synthetic but internally consistent commerce dataset.
   One record per day, Jan 01 2025 → Oct 14 2026, for a multi-location
   consumer brand selling online, through subscriptions and in its stores.
   Seeded so every load (and every shared link) shows the same numbers. */
(function () {
  var P = (window.P = window.P || {});

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20261015);
  function gauss() {
    var u = 0, v = 0;
    while (!u) u = rnd();
    while (!v) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var DAY = 864e5;
  var START = Date.UTC(2025, 0, 1);
  var END = Date.UTC(2026, 9, 14);
  var N = Math.round((END - START) / DAY) + 1;

  var STORES = [
    { id: 'soho', name: 'SoHo', city: 'New York', w: 0.31 },
    { id: 'wburg', name: 'Williamsburg', city: 'Brooklyn', w: 0.22 },
    { id: 'silver', name: 'Silver Lake', city: 'Los Angeles', w: 0.19 },
    { id: 'soco', name: 'South Congress', city: 'Austin', w: 0.16 },
    { id: 'fulton', name: 'Fulton Market', city: 'Chicago', w: 0.12 }
  ];

  var DECLINES = [
    { id: 'funds', name: 'Insufficient funds', w: 0.37 },
    { id: 'honor', name: 'Do not honor', w: 0.23 },
    { id: '3ds', name: '3DS abandoned', w: 0.19 },
    { id: 'expired', name: 'Expired card', w: 0.12 },
    { id: 'fraud', name: 'Fraud screen', w: 0.09 }
  ];

  // index by getUTCDay(): Sun..Sat
  var DOW_TX = [0.86, 0.93, 1.0, 1.17, 1.07, 1.03, 0.94];
  var DOW_STORE = [1.04, 0.86, 0.92, 1.0, 0.96, 1.0, 1.1];
  var DOW_CUST = [0.86, 0.92, 0.98, 1.05, 1.21, 1.04, 0.95];
  var SEASON = [0.9, 0.88, 0.96, 1.0, 1.02, 1.0, 0.98, 1.0, 1.02, 1.06, 1.12, 1.3];

  var days = new Array(N);
  var drift = 0, retWalk = 0;
  for (var i = 0; i < N; i++) {
    var t = START + i * DAY, dt = new Date(t);
    var dow = dt.getUTCDay(), mon = dt.getUTCMonth();
    var doy = Math.round((t - Date.UTC(dt.getUTCFullYear(), 0, 1)) / DAY);
    var g = 1 + 0.34 * i / 365;
    // Black Friday / Cyber Monday bump around Nov 28, holiday run-up into Dec 22
    var s = SEASON[mon] + 0.6 * Math.exp(-Math.pow(doy - 331, 2) / 18) + 0.25 * Math.exp(-Math.pow(doy - 350, 2) / 40);
    drift = drift * 0.9 + gauss() * 0.02;
    var n = Math.exp(gauss() * 0.06 + drift);

    var initiated = Math.round(216 * g * DOW_TX[dow] * s * n);
    var authRate = clamp(0.8 + 0.055 * i / N + gauss() * 0.007, 0.7, 0.95);
    var authorized = Math.round(initiated * authRate);
    var successful = Math.round(authorized * clamp(0.886 + gauss() * 0.006, 0.8, 0.95));
    var payouts = Math.round(successful * clamp(0.79 + gauss() * 0.007, 0.7, 0.9));
    var completed = Math.round(payouts * clamp(0.86 + gauss() * 0.007, 0.78, 0.94));
    var onlineAov = 61 + 7 * (s - 1) + gauss() * 1.4;

    var subscribers = Math.round(1380 * (1 + 0.62 * i / N));
    var renewals = Math.max(0, Math.round(subscribers / 30 * (1 + gauss() * 0.09)));
    var subsAov = 38 + gauss() * 0.6;

    var storeByLoc = STORES.map(function (st) {
      return Math.max(0, Math.round(150 * g * DOW_STORE[dow] * s * st.w * Math.exp(gauss() * 0.09)));
    });
    var storeTx = storeByLoc.reduce(function (a, b) { return a + b; }, 0);
    var storeAov = 31 + 3 * (s - 1) + gauss() * 0.8;

    var cust = Math.max(0, Math.round(4.25 * g * DOW_CUST[dow] * s * Math.exp(gauss() * 0.22)));
    var custOnline = Math.round(cust * 0.57), custSubs = Math.round(cust * 0.17);

    retWalk = retWalk * 0.97 + gauss() * 0.011;
    var returning = clamp(0.315 + 0.06 * Math.sin(2 * Math.PI * (doy - 20) / 365) + 0.03 * i / N + retWalk + gauss() * 0.01, 0.12, 0.6);
    var subRet = clamp(0.895 + 0.03 * i / N + gauss() * 0.006 - 0.02 * Math.exp(-Math.pow(doy - 12, 2) / 60), 0.8, 0.99);

    var amO = 0.43 + gauss() * 0.02, amS = 0.58 + gauss() * 0.02, amT = 0.36 + gauss() * 0.02;
    days[i] = {
      i: i, t: t, dow: dow,
      initiated: initiated, authorized: authorized, successful: successful, payouts: payouts, completed: completed,
      onlineRev: successful * onlineAov,
      subscribers: subscribers, renewals: renewals, subsRev: renewals * subsAov,
      storeTx: storeTx, storeRev: storeTx * storeAov, storeByLoc: storeByLoc,
      storeRevByLoc: storeByLoc.map(function (c) { return c * storeAov; }),
      tx: { online: successful, subs: renewals, store: storeTx },
      txAm: { online: Math.round(successful * amO), subs: Math.round(renewals * amS), store: Math.round(storeTx * amT) },
      cust: { online: custOnline, subs: custSubs, store: cust - custOnline - custSubs },
      custAm: { online: Math.round(custOnline * 0.46), subs: Math.round(custSubs * 0.52), store: Math.round((cust - custOnline - custSubs) * 0.34) },
      returning: returning, subRet: subRet,
      active: successful + storeTx * 0.8 + renewals
    };
  }

  // ---------- helpers ----------
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function idxOf(y, m, d) { return Math.round((Date.UTC(y, m, d) - START) / DAY); }
  function dateOf(i) { return new Date(START + i * DAY); }
  function slice(r) { return days.slice(Math.max(0, r.from), Math.min(N - 1, r.to) + 1); }
  function sum(arr, f) { var s = 0; for (var k = 0; k < arr.length; k++) s += f(arr[k]); return s; }
  function chSum(obj, ch) { return ch === 'all' ? obj.online + obj.subs + obj.store : obj[ch]; }

  function totals(r) {
    var d = slice(r);
    var o = {
      days: d.length,
      initiated: sum(d, function (x) { return x.initiated; }),
      authorized: sum(d, function (x) { return x.authorized; }),
      successful: sum(d, function (x) { return x.successful; }),
      payouts: sum(d, function (x) { return x.payouts; }),
      completed: sum(d, function (x) { return x.completed; }),
      onlineRev: sum(d, function (x) { return x.onlineRev; }),
      subsRev: sum(d, function (x) { return x.subsRev; }),
      storeRev: sum(d, function (x) { return x.storeRev; }),
      renewals: sum(d, function (x) { return x.renewals; }),
      storeTx: sum(d, function (x) { return x.storeTx; }),
      subscribers: d.length ? d[d.length - 1].subscribers : 0,
      stores: STORES.map(function (st, k) {
        return { store: st, tx: sum(d, function (x) { return x.storeByLoc[k]; }), rev: sum(d, function (x) { return x.storeRevByLoc[k]; }) };
      })
    };
    o.gross = o.onlineRev + o.subsRev + o.storeRev;
    o.tx = function (ch) { return sum(d, function (x) { return chSum(x.tx, ch); }); };
    o.cust = function (ch) { return sum(d, function (x) { return chSum(x.cust, ch); }); };
    var act = sum(d, function (x) { return x.active; });
    o.returning = act ? sum(d, function (x) { return x.returning * x.active; }) / act : 0;
    o.subRet = d.length ? sum(d, function (x) { return x.subRet; }) / d.length : 0;
    o.failed = o.authorized - o.successful;
    o.declines = DECLINES.map(function (dc, k) {
      var wob = 1 + 0.08 * Math.sin(r.from * 0.37 + k * 1.7);
      return { reason: dc, w: dc.w * wob };
    });
    var wsum = o.declines.reduce(function (a, b) { return a + b.w; }, 0);
    o.declines.forEach(function (x) { x.count = Math.round(o.failed * x.w / wsum); });
    return o;
  }

  // Split a range into time buckets at a granularity.
  function buckets(r, gran) {
    var out = [], cur = null;
    for (var i = Math.max(0, r.from); i <= Math.min(N - 1, r.to); i++) {
      var dt = dateOf(i), key;
      if (gran === 'monthly') key = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
      else if (gran === 'weekly') key = Math.floor((i + 2) / 7); // weeks start Monday (Jan 1 2025 was Wed)
      else key = i;
      if (!cur || cur.key !== key) { cur = { key: key, from: i, to: i }; out.push(cur); }
      else cur.to = i;
    }
    return out;
  }

  // Merge buckets so there are at most `max`, keeping them contiguous.
  function mergeTo(bs, max) {
    if (bs.length <= max) return bs;
    var out = [], per = bs.length / max;
    for (var k = 0; k < max; k++) {
      var a = bs[Math.floor(k * per)], b = bs[Math.min(bs.length - 1, Math.floor((k + 1) * per) - 1)];
      out.push({ from: a.from, to: b.to });
    }
    return out;
  }

  function retentionSeries(r, gran, metric, maxSteps) {
    return mergeTo(buckets(r, gran), maxSteps).map(function (b) {
      var d = slice(b), v;
      if (metric === 'subscribers') v = sum(d, function (x) { return x.subRet; }) / d.length;
      else {
        var a = sum(d, function (x) { return x.active; });
        v = sum(d, function (x) { return x.returning * x.active; }) / a;
      }
      return { from: b.from, to: b.to, value: v };
    });
  }

  // Distribution used by the dot matrices: 7 groups, each split into two halves.
  function distribution(r, gran, kind, ch) {
    var key = kind === 'cust' ? 'cust' : 'tx', amKey = kind === 'cust' ? 'custAm' : 'txAm';
    var d = slice(r), groups = [];
    if (gran === 'daily') {
      [1, 2, 3, 4, 5, 6, 0].forEach(function (dw) {
        var dd = d.filter(function (x) { return x.dow === dw; });
        var all = sum(dd, function (x) { return chSum(x[key], ch); });
        var am = sum(dd, function (x) { return chSum(x[amKey], ch); });
        var nd = dd.length || 1;
        groups.push({ label: DOWS[dw], long: DOWS[dw] + 'days', parts: [am, all - am], norm: [am / nd, (all - am) / nd], total: all, partNames: ['AM', 'PM'] });
      });
    } else {
      var bs = buckets(r, gran).slice(-7);
      bs.forEach(function (b) {
        var dd = slice(b), mid = Math.floor((b.from + b.to) / 2);
        var first = sum(dd.filter(function (x) { return x.i <= mid; }), function (x) { return chSum(x[key], ch); });
        var all = sum(dd, function (x) { return chSum(x[key], ch); });
        var dt = dateOf(b.from);
        var label = gran === 'monthly' ? MONTHS[dt.getUTCMonth()] : MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCDate();
        var n1 = mid - b.from + 1, n2 = Math.max(1, b.to - mid);
        groups.push({ label: label, long: gran === 'monthly' ? label : 'Week of ' + label, parts: [first, all - first], norm: [first / n1, (all - first) / n2], total: all, avg: all / (b.to - b.from + 1), partNames: ['1st half', '2nd half'] });
      });
    }
    return groups;
  }

  function series(r, f, maxPts) {
    return mergeTo(buckets(r, 'daily'), maxPts || 40).map(function (b) {
      var d = slice(b); return { from: b.from, to: b.to, value: sum(d, f) / d.length };
    });
  }

  P.data = {
    DAY: DAY, START: START, N: N, days: days, STORES: STORES, DECLINES: DECLINES,
    MONTHS: MONTHS, DOWS: DOWS,
    idxOf: idxOf, dateOf: dateOf, slice: slice, totals: totals, buckets: buckets,
    retentionSeries: retentionSeries, distribution: distribution, series: series,
    today: N // the day after the last record ("today")
  };
})();
