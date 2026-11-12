(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var DATA_URL = 'data/system-map.json';

  /* ---------- визуален език ---------- */
  var TYPES = {
    skill:      { label: 'Умение',                       color: '#5B3FA0', icon: 'slash' },
    automation: { label: 'Сценарий в Make',              color: '#B5541C', icon: 'gear' },
    task:       { label: 'Насрочена задача',             color: '#6B7A1F', icon: 'clock' },
    data:       { label: 'Таблица, документ, шаблон',    color: '#2E6DB4', icon: 'rows' },
    folder:     { label: 'Папка в Drive',                color: '#8A6D1F', icon: null },
    channel:    { label: 'Канал за публикуване',         color: '#A83A66', icon: 'waves' },
    page:       { label: 'Уеб страница',                 color: '#1F7A8C', icon: 'globe' },
    rule:       { label: 'Правило или стандарт',         color: '#2F7D4F', icon: 'check' },
    tool:       { label: 'Външен инструмент',            color: '#1F7A8C', icon: 'wrench' },
    rubric:     { label: 'Рубрика (формат съдържание)',  color: '#A83A66', icon: 'quotes' },
    project:    { label: 'Проект в Claude',              color: '#5B3FA0', icon: 'star' }
  };
  var STATUSES = {
    works:   { label: 'Работи',                 short: 'Работи' },
    testing: { label: 'В тест / в подготовка',  short: 'В тест' },
    paused:  { label: 'На пауза',               short: 'На пауза' },
    idea:    { label: 'Идея',                   short: 'Идеи' }
  };
  var STATUS_ORDER = ['works', 'testing', 'paused', 'idea'];
  var DOT = '#E07B00';

  var ICONS = {
    slash: 'M9.5 19.5L14.5 4.5',
    gear: 'M12 8.2a3.8 3.8 0 1 0 0 7.6a3.8 3.8 0 0 0 0-7.6z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1',
    clock: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2',
    rows: 'M6 7.5h12 M6 12h12 M6 16.5h8',
    waves: 'M8.2 8.2a5.4 5.4 0 0 0 0 7.6 M15.8 8.2a5.4 5.4 0 0 1 0 7.6 M5 5a9.8 9.8 0 0 0 0 14 M19 5a9.8 9.8 0 0 1 0 14 M12 10.8a1.2 1.2 0 1 0 0.01 0',
    globe: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z M3.5 12h17 M12 3.5c-3 3-3 14 0 17 M12 3.5c3 3 3 14 0 17',
    check: 'M6.5 12.5l3.8 3.8L17.5 8.5',
    wrench: 'M14.5 5.5a4.2 4.2 0 0 0-4.8 5.4L4.5 16.1a1.8 1.8 0 0 0 2.5 2.5l5.2-5.2a4.2 4.2 0 0 0 5.4-4.8l-2.6 2.6-2.4-.6-.6-2.4z',
    quotes: 'M10.5 8C8 8 6.5 9.6 6.5 12v4h4v-4H8.2 M18 8c-2.5 0-4 1.6-4 4v4h4v-4h-2.3',
    star: 'M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 17l-5.3 3 1.1-6L3.4 9.8l6-.8z'
  };

  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function tint(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = 0.16;
    function m(c) { return Math.round(255 - (255 - c) * t); }
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function styleFor(type, status) {
    var c = TYPES[type].color;
    if (status === 'works') return { fill: c, stroke: c, ink: '#fff', dash: null, cap: 'butt' };
    if (status === 'testing') return { fill: tint(c), stroke: c, ink: c, dash: null, cap: 'butt' };
    if (status === 'paused') return { fill: '#EEEDF2', stroke: '#8B8799', ink: '#8B8799', dash: '5 3', cap: 'butt' };
    return { fill: '#fff', stroke: c, ink: c, dash: '1.5 3.6', cap: 'round' }; // idea
  }

  /* фигура около 30 px, центрирана в (0,0) */
  function shape(type, status) {
    var st = styleFor(type, status);
    var g = svg('g');
    function body(tag, attrs) {
      var e = svg(tag, attrs);
      e.setAttribute('fill', st.fill);
      e.setAttribute('stroke', st.stroke);
      e.setAttribute('stroke-width', '2');
      e.setAttribute('stroke-linejoin', 'round');
      e.setAttribute('stroke-linecap', st.cap);
      if (st.dash) e.setAttribute('stroke-dasharray', st.dash);
      g.appendChild(e);
      return e;
    }
    function line(d, w) {
      var e = svg('path', { d: d, fill: 'none', stroke: st.ink, 'stroke-width': w || 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      g.appendChild(e);
    }
    var ix = 0, iy = 0, is = 15;
    switch (type) {
      case 'skill': body('rect', { x: -15, y: -11, width: 30, height: 22, rx: 7 }); break;
      case 'automation': body('polygon', { points: '-15,0 -7.5,-13 7.5,-13 15,0 7.5,13 -7.5,13' }); is = 14; break;
      case 'task': body('circle', { r: 14.5 }); break;
      case 'data': body('path', { d: 'M-11,-15 H4 L11,-8 V15 H-11 Z' }); line('M4,-15 V-8 H11', 1.5); iy = 3.5; is = 12; break;
      case 'folder': body('path', { d: 'M-15,-8 Q-15,-12 -11,-12 H-4 L-1,-8 H11 Q15,-8 15,-4 V8 Q15,12 11,12 H-11 Q-15,12 -15,8 Z' }); break;
      case 'channel': body('rect', { x: -15, y: -10, width: 30, height: 20, rx: 10 }); is = 15; break;
      case 'page': body('rect', { x: -15, y: -12, width: 30, height: 24, rx: 3 }); line('M-15,-5.5 H15', 1.6); iy = 3; is = 13; break;
      case 'rule': body('path', { d: 'M0,-15 L13,-10 V0 Q13,10 0,15 Q-13,10 -13,0 V-10 Z' }); iy = -0.5; is = 14; break;
      case 'tool': body('rect', { x: -14, y: -14, width: 28, height: 28, rx: 2 });
        g.appendChild(svg('rect', { x: -10, y: -10, width: 20, height: 20, fill: 'none', stroke: st.ink, 'stroke-width': 1.1, 'stroke-dasharray': st.dash ? '2 2' : '' }));
        is = 12; break;
      case 'rubric': body('path', { d: 'M-8,-13 H8 Q15,-13 15,-6 V3 Q15,10 8,10 H-3 L-10,15 V10 H-8 Q-15,10 -15,3 V-6 Q-15,-13 -8,-13 Z' }); iy = -1.5; is = 14; break;
      case 'project': body('rect', { x: -14, y: -14, width: 28, height: 28, rx: 9 }); is = 16; break;
    }
    var icon = TYPES[type].icon;
    if (icon) {
      var s = is / 24;
      g.appendChild(svg('path', {
        d: ICONS[icon], fill: 'none', stroke: st.ink, 'stroke-width': (1.7 / s).toFixed(2),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        transform: 'translate(' + (ix - is / 2) + ',' + (iy - is / 2) + ') scale(' + s.toFixed(4) + ')'
      }));
    }
    if (status === 'testing') g.appendChild(svg('circle', { cx: 12, cy: -12, r: 4.6, fill: DOT, stroke: '#fff', 'stroke-width': 1.6 }));
    return g;
  }
  function shapeSvg(type, status, px) {
    var s = svg('svg', { viewBox: '-19 -19 38 38', width: px, height: px, 'aria-hidden': 'true' });
    s.appendChild(shape(type, status));
    return s;
  }

  /* ---------- състояние ---------- */
  var data, nodeById = {}, branchById = {}, adj = {};
  var nodeEls = {}, edgeEls = [], hubEls = {};
  var state = { view: 'map', hiddenTypes: {}, hiddenStatuses: {}, query: '', hover: null, selected: null };
  var T = { k: 1, x: 0, y: 0 }, fitT = null, bbox = null;
  var mapEl, vp, stage, tip, panel;

  function $(id) { return document.getElementById(id); }
  function warn(m) { if (window.console) console.warn('[ЕРА карта] ' + m); }

  /* ---------- зареждане ---------- */
  function load() {
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(init)
      .catch(function (err) { showFallback(err); });
  }
  function showFallback() {
    var f = $('fallback');
    f.hidden = false;
    f.innerHTML = '';
    f.appendChild(h('p', null, 'Браузърът не позволява четене на data/system-map.json, когато файлът е отворен направо от диска. Отвори страницата през GitHub Pages или избери файла ръчно.'));
    var inp = h('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.addEventListener('change', function () {
      var file = inp.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () { try { f.hidden = true; init(JSON.parse(rd.result)); } catch (e) { f.hidden = false; warn('Невалиден JSON'); } };
      rd.readAsText(file);
    });
    f.appendChild(inp);
  }

  function init(d) {
    data = d;
    nodeById = {}; branchById = {}; adj = {};
    data.branches.forEach(function (b) { branchById[b.id] = b; });
    data.nodes = data.nodes.filter(function (n) {
      if (!branchById[n.branch]) { warn('Възел ' + n.id + ' сочи към несъществуващ клон ' + n.branch); return false; }
      if (!TYPES[n.type] || !STATUSES[n.status]) { warn('Възел ' + n.id + ' има непознат тип или статус'); return false; }
      return true;
    });
    data.nodes.forEach(function (n) { nodeById[n.id] = n; adj[n.id] = {}; });
    data.nodes.forEach(function (n) {
      (n.links || []).forEach(function (t) {
        if (!nodeById[t]) { warn('Връзка от ' + n.id + ' към несъществуващ ' + t); return; }
        adj[n.id][t] = true; adj[t][n.id] = true;
      });
    });
    function chk(list, where) {
      (list || []).forEach(function (it) { if (!nodeById[it.node]) warn(where + ': несъществуващ възел ' + it.node); });
    }
    chk(data.daily, 'daily');
    (data.week || []).forEach(function (d2) { chk(d2.items, 'week/' + d2.day); });

    mapEl = $('map'); stage = $('stage'); tip = $('tip'); panel = $('panel');
    $('stamp').textContent = 'Състояние към ' + fmtDate(data.updated);
    buildCounts();
    buildLegend();
    buildMap();
    buildWeek();
    bindUI();
    setView('map');
    window.eraMap = { urlFor: function (id) { return buildUrl(nodeById[id]); }, nodes: nodeById, T: function () { return T; } };
  }
  function fmtDate(s) { var p = (s || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : (s || ''); }

  /* ---------- линк към ЕРА Система ---------- */
  function relatedOf(id) {
    return Object.keys(adj[id] || {}).map(function (k) { return nodeById[k]; })
      .sort(function (a, b) { return data.nodes.indexOf(a) - data.nodes.indexOf(b); });
  }
  function buildUrl(n) {
    var rel = relatedOf(n.id).map(function (r) { return r.name; });
    var lines = [];
    lines.push('Работим по: ' + branchById[n.branch].name + ' → ' + n.name);
    lines.push('Тип: ' + TYPES[n.type].label + ' · Статус: ' + STATUSES[n.status].label);
    lines.push('Какво е: ' + n.description);
    if (n.trigger || n.result) lines.push('Повод → резултат: ' + (n.trigger && n.result ? n.trigger + ' → ' + n.result : (n.trigger || n.result)));
    if (n.schedule) lines.push('Кога: ' + n.schedule);
    lines.push('Свързано с: ' + (rel.length ? rel.join(', ') : 'няма'));
    var text = lines.join('\n') + '\n\nПреди да предлагаш промени, прочети „Правила“ и текущото състояние на тази част.\n\nМоето искане: ';
    var url = 'https://claude.ai/new?project=' + encodeURIComponent(data.projectId) + '&q=' + encodeURIComponent(text);
    if (url.length > 6000) warn('Линкът за ' + n.id + ' е ' + url.length + ' знака (над 6000)');
    return url;
  }
  function openNode(n) { window.open(buildUrl(n), '_blank', 'noopener'); }

  /* ---------- карта-подсказка ---------- */
  function card(n) {
    var c = h('div', 'card');
    var head = h('div', 'card-head');
    head.appendChild(shapeSvg(n.type, n.status, 34));
    var t = h('div');
    t.appendChild(h('div', 'card-name', n.name));
    t.appendChild(h('div', 'card-meta', TYPES[n.type].label + ' · ' + STATUSES[n.status].label));
    head.appendChild(t);
    c.appendChild(head);
    c.appendChild(h('p', null, n.description));
    if (n.trigger || n.result) {
      var p = h('p'); p.appendChild(h('span', 'k', 'Повод → резултат: '));
      p.appendChild(document.createTextNode(n.trigger && n.result ? n.trigger + ' → ' + n.result : (n.trigger || n.result)));
      c.appendChild(p);
    }
    if (n.schedule) {
      var p2 = h('p'); p2.appendChild(h('span', 'k', 'Кога: ')); p2.appendChild(document.createTextNode(n.schedule)); c.appendChild(p2);
    }
    var rel = relatedOf(n.id);
    if (rel.length) {
      var p3 = h('p'); p3.appendChild(h('span', 'k', 'Свързано с:')); c.appendChild(p3);
      var ul = h('ul');
      rel.forEach(function (r) {
        var li = h('li'); li.appendChild(shapeSvg(r.type, r.status, 16)); li.appendChild(document.createTextNode(r.label)); ul.appendChild(li);
      });
      c.appendChild(ul);
    }
    return c;
  }
  function isTouchMode() { return window.matchMedia('(hover: none)').matches; }
  function showTip(n, anchor) {
    if (isTouchMode()) return;
    tip.innerHTML = ''; tip.appendChild(card(n)); tip.hidden = false;
    var r = anchor.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var x = r.right + 12; if (x + tw > vw - 8) x = r.left - tw - 12; if (x < 8) x = Math.max(8, Math.min(vw - tw - 8, r.left));
    var y = r.top + r.height / 2 - th / 2; y = Math.max(8, Math.min(vh - th - 8, y));
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }
  function showPanel(n) {
    panel.innerHTML = '';
    panel.appendChild(card(n));
    var b = h('div', 'btns');
    var go = h('button', 'go', 'Отвори в ЕРА Система'); go.addEventListener('click', function () { openNode(n); });
    var cl = h('button', null, 'Затвори'); cl.addEventListener('click', closePanel);
    b.appendChild(go); b.appendChild(cl); panel.appendChild(b); panel.hidden = false;
  }
  function closePanel() { panel.hidden = true; state.selected = null; setHover(null); }

  /* ---------- подредба ---------- */
  var CH = 6.6, LH = 14, LABEL_MAX = 16;
  function wrap(text, max) {
    var toks = [];
    text.split(' ').forEach(function (w, wi) {
      w.split(/(?<=[-–])/).forEach(function (s, si) { toks.push({ s: s, sp: si === 0 && wi > 0 }); });
    });
    var lines = [], cur = '';
    toks.forEach(function (t) {
      var joined = cur ? cur + (t.sp ? ' ' : '') + t.s : t.s;
      if (cur && joined.length > max) { lines.push(cur); cur = t.s; } else cur = joined;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function overlap(a, b, pad) { return !(a.x1 + pad <= b.x0 || b.x1 + pad <= a.x0 || a.y1 + pad <= b.y0 || b.y1 + pad <= a.y0); }
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); }

  function layout() {
    var RX = 300, RY = 190, N = data.branches.length, boxes = [];
    var rootR = 58;
    boxes.push({ x0: -rootR - 4, y0: -rootR - 4, x1: rootR + 4, y1: rootR + 4 });
    var hubs = data.branches.map(function (b, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / N;
      var x = RX * Math.cos(a), y = RY * Math.sin(a);
      var lines = wrap(b.name, 17), mx = 0; lines.forEach(function (l) { mx = Math.max(mx, l.length); });
      var w = mx * 7.4 + 26, hh = lines.length * 16 + 14;
      var ang = Math.atan2(y, x), L = Math.hypot(x, y);
      var o = { b: b, x: x, y: y, w: w, h: hh, lines: lines, ang: ang, ux: x / L, uy: y / L };
      boxes.push({ x0: x - w / 2, y0: y - hh / 2, x1: x + w / 2, y1: y + hh / 2 });
      return o;
    });
    var byBranch = {}; hubs.forEach(function (hb) { byBranch[hb.b.id] = hb; hb.items = []; });
    data.nodes.forEach(function (n) { byBranch[n.branch].items.push(n); });
    var maxLen = 0; hubs.forEach(function (hb) { maxLen = Math.max(maxLen, hb.items.length); });

    var pos = {};
    for (var k = 0; k < maxLen; k++) {
      hubs.forEach(function (hb) {
        var n = hb.items[k]; if (!n) return;
        var lines = wrap(n.label, LABEL_MAX), mx = 0; lines.forEach(function (l) { mx = Math.max(mx, l.length); });
        var w = Math.max(36, mx * CH + 6), bottom = 29 + (lines.length - 1) * LH + 5;
        var best = null, bestCost = Infinity;
        for (var r = 70; r < 1000; r += 8) {
          for (var a = 0; a < 360; a += 6) {
            var rad = a * Math.PI / 180, px = hb.x + r * Math.cos(rad), py = hb.y + r * Math.sin(rad);
            var dot = Math.cos(rad) * hb.ux + Math.sin(rad) * hb.uy;
            var cost = r - 30 * dot + (dot < 0 ? -dot * 120 : 0);
            var dOther = Infinity;
            for (var q = 0; q < hubs.length; q++) if (hubs[q] !== hb) dOther = Math.min(dOther, Math.hypot(px - hubs[q].x, py - hubs[q].y));
            if (dOther < r) cost += (r - dOther) + 60;
            var ad = angDiff(Math.atan2(py, px), hb.ang);
            if (ad > 0.4) cost += (ad - 0.4) * 450;
            if (cost >= bestCost) continue;
            var box = { x0: px - w / 2, x1: px + w / 2, y0: py - 18, y1: py + bottom };
            var ok = true;
            for (var i = 0; i < boxes.length; i++) if (overlap(box, boxes[i], 5)) { ok = false; break; }
            if (ok) { bestCost = cost; best = { x: px, y: py, box: box }; }
          }
        }
        if (!best) { best = { x: hb.x, y: hb.y + 200, box: { x0: hb.x - w / 2, x1: hb.x + w / 2, y0: hb.y + 182, y1: hb.y + 200 + bottom } }; warn('Не е намерено място за ' + n.id); }
        boxes.push(best.box);
        pos[n.id] = { x: best.x, y: best.y, w: w, lines: lines, bottom: bottom };
      });
    }
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    boxes.forEach(function (b) { x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); });
    bbox = { x0: x0 - 14, y0: y0 - 14, x1: x1 + 14, y1: y1 + 14 };
    return { hubs: hubs, pos: pos, rootR: rootR };
  }

  /* ---------- рисуване на картата ---------- */
  function buildMap() {
    mapEl.innerHTML = '';
    vp = svg('g', { id: 'vp' });
    mapEl.appendChild(vp);
    var L = layout();
    var gEdges = svg('g'), gHubs = svg('g'), gNodes = svg('g');
    vp.appendChild(gEdges); vp.appendChild(gHubs); vp.appendChild(gNodes);
    nodeEls = {}; edgeEls = []; hubEls = {};

    // връзки между елементи (двете посоки, без дубликати)
    var seen = {};
    data.nodes.forEach(function (n) {
      Object.keys(adj[n.id]).forEach(function (t) {
        var key = n.id < t ? n.id + '|' + t : t + '|' + n.id;
        if (seen[key]) return; seen[key] = 1;
        var a = L.pos[n.id], b = L.pos[t], m = nodeById[t];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var cx = mx * 0.62, cy = my * 0.62;
        var p = svg('path', { d: 'M' + a.x + ',' + a.y + ' Q' + cx + ',' + cy + ' ' + b.x + ',' + b.y, class: 'edge link' + (m.branch === n.branch ? ' same' : '') });
        gEdges.appendChild(p);
        edgeEls.push({ el: p, a: n.id, b: t, kind: 'link' });
      });
    });
    // клон → елемент
    L.hubs.forEach(function (hb) {
      var tr = svg('line', { x1: 0, y1: 0, x2: hb.x, y2: hb.y, class: 'edge trunk' });
      gEdges.appendChild(tr);
      hb.items.forEach(function (n) {
        var p = L.pos[n.id];
        var ln = svg('line', { x1: hb.x, y1: hb.y, x2: p.x, y2: p.y, class: 'edge tree' });
        gEdges.appendChild(ln);
        edgeEls.push({ el: ln, a: n.id, b: null, kind: 'tree', branch: hb.b.id });
      });
    });
    // клонове
    L.hubs.forEach(function (hb) {
      var g = svg('g', { class: 'hub', transform: 'translate(' + hb.x + ',' + hb.y + ')' });
      g.appendChild(svg('rect', { x: -hb.w / 2, y: -hb.h / 2, width: hb.w, height: hb.h, rx: 13, fill: '#250E62' }));
      var t = svg('text', { y: -(hb.lines.length - 1) * 8 + 4.5 });
      hb.lines.forEach(function (l, i) { var s = svg('tspan', { x: 0, dy: i ? 16 : 0 }); s.textContent = l; t.appendChild(s); });
      g.appendChild(t);
      gHubs.appendChild(g);
      hubEls[hb.b.id] = g;
      g.addEventListener('pointerenter', function () { setHover('hub:' + hb.b.id); });
      g.addEventListener('pointerleave', function () { setHover(null); });
    });
    // център
    var root = svg('g', { class: 'root' });
    root.appendChild(svg('circle', { r: L.rootR, fill: '#250E62', stroke: '#C8102E', 'stroke-width': 4 }));
    var rt = svg('text', { y: -4 });
    wrap(data.root, 9).forEach(function (l, i) { var s = svg('tspan', { x: 0, dy: i ? 18 : 0 }); s.textContent = l; rt.appendChild(s); });
    root.appendChild(rt);
    gHubs.appendChild(root);

    // възли
    data.nodes.forEach(function (n) {
      var p = L.pos[n.id];
      var g = svg('g', { class: 'node st-' + n.status, transform: 'translate(' + p.x + ',' + p.y + ')', tabindex: 0, role: 'link',
        'aria-label': n.name + '. ' + TYPES[n.type].label + ', ' + STATUSES[n.status].label + '. Отвори в ЕРА Система.' });
      g.appendChild(svg('rect', { x: -p.w / 2 - 2, y: -18, width: p.w + 4, height: p.bottom + 18, fill: 'transparent' }));
      g.appendChild(svg('circle', { r: 21, class: 'halo' }));
      g.appendChild(svg('circle', { r: 20, class: 'focus-ring' }));
      g.appendChild(shape(n.type, n.status));
      var t = svg('text', { class: 'label', y: 29 });
      p.lines.forEach(function (l, i) { var s = svg('tspan', { x: 0, dy: i ? LH : 0 }); s.textContent = l; t.appendChild(s); });
      g.appendChild(t);
      gNodes.appendChild(g);
      nodeEls[n.id] = g;
      g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; setHover(n.id); showTip(n, g); });
      g.addEventListener('pointerleave', function (e) { if (e.pointerType === 'touch') return; setHover(null); hideTip(); });
      g.addEventListener('focus', function () { setHover(n.id); showTip(n, g); });
      g.addEventListener('blur', function () { setHover(null); hideTip(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNode(n); } });
      g.addEventListener('click', function (e) {
        e.stopPropagation();
        if (dragMoved) return;
        if (isTouchMode()) {
          if (state.selected === n.id) { openNode(n); return; }
          state.selected = n.id; setHover(n.id); showPanel(n);
        } else openNode(n);
      });
    });
    computeFit();
    applyFit();
    applyFilters();
  }

  /* ---------- изглед: мащаб и местене ---------- */
  function stageSize() { var r = stage.getBoundingClientRect(); return { w: r.width, h: r.height }; }
  function computeFit() {
    var s = stageSize(), bw = bbox.x1 - bbox.x0, bh = bbox.y1 - bbox.y0;
    var k = Math.min(s.w / bw, s.h / bh);
    fitT = { k: k, x: (s.w - bw * k) / 2 - bbox.x0 * k, y: (s.h - bh * k) / 2 - bbox.y0 * k };
  }
  function applyT() { vp.setAttribute('transform', 'translate(' + T.x + ',' + T.y + ') scale(' + T.k + ')'); }
  function applyFit() { computeFit(); T = { k: fitT.k, x: fitT.x, y: fitT.y }; applyT(); }
  function zoomAt(cx, cy, f) {
    var nk = Math.max(fitT.k * 0.5, Math.min(fitT.k * 8, T.k * f)); f = nk / T.k;
    T.x = cx - (cx - T.x) * f; T.y = cy - (cy - T.y) * f; T.k = nk; applyT();
  }
  var dragMoved = false;
  function bindPanZoom() {
    var ptrs = {}, last = null, startPt = null, pinch = null;
    mapEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = mapEl.getBoundingClientRect();
      var f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      zoomAt(e.clientX - r.left, e.clientY - r.top, f);
    }, { passive: false });
    mapEl.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      dragMoved = false;
      if (ids.length === 1) { startPt = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY }; }
      if (ids.length === 2) { pinch = pinchState(); dragMoved = true; }
    });
    mapEl.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (ids.length >= 2) {
        var ns = pinchState();
        if (pinch && pinch.d > 0) {
          var r = mapEl.getBoundingClientRect();
          zoomAt(ns.cx - r.left, ns.cy - r.top, ns.d / pinch.d);
          T.x += ns.cx - pinch.cx; T.y += ns.cy - pinch.cy; applyT();
        }
        pinch = ns; return;
      }
      if (!startPt) return;
      if (!dragMoved && Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y) < 5) return;
      if (!dragMoved) { dragMoved = true; try { mapEl.setPointerCapture(e.pointerId); } catch (x) {} mapEl.classList.add('dragging'); hideTip(); }
      T.x += e.clientX - last.x; T.y += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; applyT();
    });
    function end(e) {
      delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length < 2) pinch = null;
      if (!Object.keys(ptrs).length) { startPt = null; mapEl.classList.remove('dragging'); setTimeout(function () { dragMoved = false; }, 0); }
    }
    mapEl.addEventListener('pointerup', end);
    mapEl.addEventListener('pointercancel', end);
    function pinchState() {
      var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; });
      return { cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) };
    }
    mapEl.addEventListener('click', function () { if (!dragMoved && !panel.hidden) closePanel(); });
    $('fit').addEventListener('click', applyFit);
    window.addEventListener('resize', function () { if (state.view === 'map') { var was = T.k === (fitT && fitT.k); computeFit(); if (was) applyFit(); } });
  }

  /* ---------- открояване ---------- */
  function setHover(id) {
    state.hover = id;
    var rel = null, hubB = null;
    if (id && id.indexOf('hub:') === 0) { hubB = id.slice(4); rel = {}; data.nodes.forEach(function (n) { if (n.branch === hubB) rel[n.id] = 1; }); }
    else if (id) { rel = { }; rel[id] = 1; Object.keys(adj[id]).forEach(function (k) { rel[k] = 1; }); }
    data.nodes.forEach(function (n) { nodeEls[n.id].classList.toggle('dim', !!rel && !rel[n.id]); });
    Object.keys(hubEls).forEach(function (b) { hubEls[b].classList.toggle('dim', !!rel && b !== hubB); });
    edgeEls.forEach(function (e) {
      var hot = false, dim = false;
      if (rel) {
        if (e.kind === 'link') { hot = hubB ? false : (e.a === id || e.b === id); dim = !hot; if (hubB) dim = true; }
        else { dim = !(hubB ? e.branch === hubB : (e.a === id)); }
      }
      e.el.classList.toggle('hot', hot);
      e.el.classList.toggle('dim', dim);
    });
  }

  /* ---------- филтри, търсене, броячи ---------- */
  function visible(n) { return !state.hiddenTypes[n.type] && !state.hiddenStatuses[n.status]; }
  function matches(n) {
    var q = state.query; if (!q) return true;
    return (n.name + ' ' + n.label + ' ' + n.description).toLowerCase().indexOf(q) !== -1;
  }
  function applyFilters() {
    data.nodes.forEach(function (n) {
      var g = nodeEls[n.id];
      g.classList.toggle('is-hidden', !visible(n));
      var m = matches(n);
      g.classList.toggle('nomatch', !!state.query && !m);
      g.classList.toggle('match', !!state.query && m);
    });
    edgeEls.forEach(function (e) {
      var hidden = !visible(nodeById[e.a]) || (e.b && !visible(nodeById[e.b]));
      e.el.classList.toggle('is-hidden', !!hidden);
    });
    document.querySelectorAll('.wk-row').forEach(function (b) {
      var n = nodeById[b.dataset.node]; if (!n) return;
      b.classList.toggle('is-hidden', !visible(n));
      b.style.opacity = state.query && !matches(n) ? 0.3 : '';
    });
    document.querySelectorAll('.chip[data-type]').forEach(function (c) { c.setAttribute('aria-pressed', String(!state.hiddenTypes[c.dataset.type])); });
    document.querySelectorAll('.chip[data-status]').forEach(function (c) { c.setAttribute('aria-pressed', String(!state.hiddenStatuses[c.dataset.status])); });
    var only = STATUS_ORDER.every(function (s) { return (s === 'idea') === !state.hiddenStatuses[s]; });
    var ob = $('onlyIdeas'); if (ob) ob.setAttribute('aria-pressed', String(only));
  }
  function buildCounts() {
    var c = { works: 0, testing: 0, paused: 0, idea: 0 };
    data.nodes.forEach(function (n) { c[n.status]++; });
    var box = $('counts'); box.innerHTML = '';
    STATUS_ORDER.forEach(function (s, i) {
      if (i) box.appendChild(h('span', 'sep', '·'));
      var sp = h('span'); sp.appendChild(document.createTextNode(STATUSES[s].short + ' ')); sp.appendChild(h('b', null, String(c[s]))); box.appendChild(sp);
    });
  }
  function buildLegend() {
    var lg = $('legend'); lg.innerHTML = '';
    lg.appendChild(h('h2', null, 'Типове'));
    Object.keys(TYPES).forEach(function (t) {
      var b = h('button', 'chip'); b.type = 'button'; b.dataset.type = t; b.setAttribute('aria-pressed', 'true');
      b.appendChild(shapeSvg(t, 'works', 24)); b.appendChild(document.createTextNode(TYPES[t].label));
      b.addEventListener('click', function () { state.hiddenTypes[t] = !state.hiddenTypes[t]; applyFilters(); });
      lg.appendChild(b);
    });
    lg.appendChild(h('h2', null, 'Статус'));
    STATUS_ORDER.forEach(function (s) {
      var b = h('button', 'chip'); b.type = 'button'; b.dataset.status = s; b.setAttribute('aria-pressed', 'true');
      b.appendChild(shapeSvg('skill', s, 24)); b.appendChild(document.createTextNode(STATUSES[s].label));
      b.addEventListener('click', function () { state.hiddenStatuses[s] = !state.hiddenStatuses[s]; applyFilters(); });
      lg.appendChild(b);
    });
    var only = h('button', 'only-ideas', 'Само идеи'); only.type = 'button'; only.id = 'onlyIdeas'; only.setAttribute('aria-pressed', 'false');
    only.addEventListener('click', function () {
      var on = only.getAttribute('aria-pressed') === 'true';
      STATUS_ORDER.forEach(function (s) { state.hiddenStatuses[s] = on ? false : s !== 'idea'; });
      applyFilters();
    });
    lg.appendChild(only);
  }

  /* ---------- седмица ---------- */
  function weekRow(it) {
    var n = nodeById[it.node];
    var b = h('button', 'wk-row'); b.type = 'button'; b.dataset.node = it.node;
    var tb = h('span', 'tb'); tb.appendChild(h('span', 'tm', it.time)); tb.appendChild(h('span', 'tx', it.text));
    if (!n) { b.disabled = true; b.appendChild(tb); return b; }
    b.appendChild(shapeSvg(n.type, n.status, 24));
    b.appendChild(tb);
    b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') showTip(n, b); });
    b.addEventListener('pointerleave', hideTip);
    b.addEventListener('focus', function () { showTip(n, b); });
    b.addEventListener('blur', hideTip);
    b.addEventListener('click', function () {
      if (isTouchMode()) { if (state.selected === n.id) { openNode(n); return; } state.selected = n.id; showPanel(n); }
      else openNode(n);
    });
    return b;
  }
  function buildWeek() {
    var w = $('week'); w.innerHTML = '';
    var daily = h('div', 'daily'); daily.appendChild(h('span', 'k', 'Всеки ден'));
    (data.daily || []).forEach(function (it) { daily.appendChild(weekRow(it)); });
    w.appendChild(daily);
    var cols = h('div', 'cols');
    var today = (new Date().getDay() + 6) % 7;
    (data.week || []).forEach(function (d, i) {
      var day = h('div', 'day' + (i === today ? ' today open' : ''));
      var head = h('button', 'dayhead'); head.type = 'button';
      head.appendChild(h('span', null, d.day)); head.appendChild(h('span', 'chev', '▾'));
      head.addEventListener('click', function () { day.classList.toggle('open'); });
      day.appendChild(head);
      var body = h('div', 'daybody');
      d.items.forEach(function (it) { body.appendChild(weekRow(it)); });
      if (d.noPost) body.appendChild(h('div', 'nopost', 'без пост'));
      day.appendChild(body); cols.appendChild(day);
    });
    w.appendChild(cols);
  }

  /* ---------- общи връзки ---------- */
  function setView(v) {
    state.view = v;
    $('map').style.display = v === 'map' ? '' : 'none';
    $('fit').hidden = v !== 'map';
    $('week').hidden = v !== 'week';
    $('tab-map').setAttribute('aria-selected', String(v === 'map'));
    $('tab-week').setAttribute('aria-selected', String(v === 'week'));
    hideTip();
    if (v === 'map') { computeFit(); applyFit(); }
  }
  var uiBound = false;
  function bindUI() {
    if (uiBound) return; uiBound = true;
    $('tab-map').addEventListener('click', function () { setView('map'); });
    $('tab-week').addEventListener('click', function () { setView('week'); });
    $('search').addEventListener('input', function (e) { state.query = e.target.value.trim().toLowerCase(); applyFilters(); });
    $('filtersToggle').addEventListener('click', function () {
      var l = $('legend'), o = l.classList.toggle('open'); this.setAttribute('aria-expanded', String(o));
    });
    bindPanZoom();
  }

  load();
})();
