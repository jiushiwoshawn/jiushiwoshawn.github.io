/* ============================================================
   APT 官网 - 全局交互脚本（原生 JavaScript，零依赖）
   ------------------------------------------------------------
   职责：
   1. 滚动淡入（IntersectionObserver）
   2. 导航栏滚动状态（Hero 深色区 → 内容区切换）
   3. 移动端导航抽屉
   4. 当前年份自动填充（页脚版权）
   5. 滚动进度条（顶部细线，可选增强）
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 滚动淡入（支持 data-reveal-delay 自定义错峰延时） ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target); // 一次性
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el, i) {
      // 优先用元素自身的 data-reveal-delay，否则按同屏序号做轻微错峰
      var custom = el.getAttribute('data-reveal-delay');
      el.style.transitionDelay = custom ? custom + 'ms' : (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 2. 导航栏滚动状态 ---------- */
  var nav = document.querySelector('.site-nav');
  var heroEnd = document.querySelector('#hero-end'); // Hero 结束锚点
  if (nav && heroEnd) {
    var onScroll = function () {
      var past = window.scrollY > heroEnd.getBoundingClientRect().top - 10;
      nav.classList.toggle('is-scrolled', past);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. 移动端导航抽屉 ---------- */
  var burger = document.querySelector('.nav-burger');
  var drawer = document.querySelector('.nav-drawer');
  var drawerMask = document.querySelector('.nav-drawer-mask');
  var drawerLinks = drawer ? drawer.querySelectorAll('a') : [];

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (drawerMask) drawerMask.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openDrawer() {
    if (drawer) drawer.classList.add('open');
    if (drawerMask) drawerMask.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    if (drawerMask) drawerMask.addEventListener('click', closeDrawer);
    drawerLinks.forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ---------- 4. 页脚年份 ---------- */
  var yearEls = document.querySelectorAll('[data-year]');
  var year = String(new Date().getFullYear());
  yearEls.forEach(function (el) { el.textContent = year; });

  /* ---------- 5. 顶部滚动进度条 ---------- */
  var progress = document.querySelector('.scroll-progress');
  if (progress) {
    var updateProgress = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progress.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- 6. 回到顶部按钮 ---------- */
  var toTop = document.querySelector('.scroll-top');
  if (toTop) {
    var toggleTop = function () {
      toTop.classList.toggle('show', window.scrollY > 520);
    };
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 7. 导航当前区块高亮（scrollspy） ---------- */
  var spyLinks = document.querySelectorAll('[data-spy-link]');
  var spyTargets = document.querySelectorAll('[data-spy]');
  if (spyLinks.length && spyTargets.length && 'IntersectionObserver' in window) {
    var spyIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('data-spy');
          spyLinks.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('data-spy-link') === id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach(function (t) { spyIo.observe(t); });
  }

  /* ---------- 8. 学情可视化图形（雷达 / 七维留存 / 留存曲线 / 上课周期，照搬 App 样式与动效） ---------- */
  (function renderInsights() {
    var section = document.getElementById('insights');
    if (!section) return;

    var SVGNS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) {
      var e = document.createElementNS(SVGNS, name);
      if (attrs) for (var k in attrs) { e.setAttribute(k, attrs[k]); }
      return e;
    }
    function setupGrow(node) {
      try {
        var len = node.getTotalLength();
        node.style.strokeDasharray = len;
        node.style.strokeDashoffset = prefersReduced ? 0 : len;
      } catch (e) { /* 不支持时直接显示 */ }
    }
    function easeOutBack(t) {
      var s = 1.2, c3 = s + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
    }
    function statusClass(v) {
      if (v >= 0.4) return 'is-success';
      if (v >= 0.3) return 'is-warning';
      return 'is-error';
    }
    function statusVar(v) {
      if (v >= 0.4) return 'var(--c-success)';
      if (v >= 0.3) return 'var(--c-warning)';
      return 'var(--c-error)';
    }

    /* ===== 1. 能力雷达图（App 同款：grow 从中心向外生长 + 顶点/百分比逐个点亮） ===== */
    var radarSvg = section.querySelector('.insight-radar');
    var RADAR = [
      { name: '节奏',     v: 0.82 },
      { name: '音高',     v: 0.74 },
      { name: '调与音阶', v: 0.68 },
      { name: '和弦',     v: 0.79 },
      { name: '音程',     v: 0.61 },
      { name: '音乐综合', v: 0.85 },
      { name: '术语符号', v: 0.70 }
    ];
    var radarRefs = null;
    function buildRadar() {
      if (!radarSvg) return;
      var W = 360, H = 300, cx = 180, cy = 150, R = 92;
      var n = RADAR.length, step = 2 * Math.PI / n, start = -Math.PI / 2;
      function pt(i, r) { var a = start + i * step; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
      var i, p;
      for (var ring = 1; ring <= 4; ring++) {
        var r = R * ring / 4, pts = [];
        for (i = 0; i < n; i++) { p = pt(i, r); pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
        radarSvg.appendChild(el('polygon', { points: pts.join(' '), class: 'radar-grid' + (ring === 4 ? ' outer' : '') }));
      }
      for (i = 0; i < n; i++) {
        p = pt(i, R);
        radarSvg.appendChild(el('line', { x1: cx, y1: cy, x2: p[0].toFixed(1), y2: p[1].toFixed(1), class: 'radar-axis' }));
      }
      var area = el('polygon', { class: 'radar-area' });
      var outline = el('polygon', { class: 'radar-outline' });
      radarSvg.appendChild(area); radarSvg.appendChild(outline);
      var dots = [], pcts = [];
      RADAR.forEach(function (d, idx) {
        var lp = pt(idx, R + 20);
        var anc = (lp[0] < cx - 4) ? 'end' : (lp[0] > cx + 4 ? 'start' : 'middle');
        var dot = el('circle', { r: 3.2, class: 'radar-dot' });
        radarSvg.appendChild(dot); dots.push(dot);
        var lbl = el('text', { x: lp[0].toFixed(1), y: (lp[1] + 4).toFixed(1), class: 'radar-label', 'text-anchor': anc });
        lbl.textContent = d.name; radarSvg.appendChild(lbl);
        var pct = el('text', { x: lp[0].toFixed(1), y: (lp[1] - 8).toFixed(1), class: 'radar-pct', 'text-anchor': anc });
        radarSvg.appendChild(pct); pcts.push(pct);
      });
      radarRefs = { cx: cx, cy: cy, R: R, n: n, step: step, start: start, area: area, outline: outline, dots: dots, pcts: pcts };
    }
    function renderRadar(g) {
      if (!radarRefs) return;
      var cx = radarRefs.cx, cy = radarRefs.cy, R = radarRefs.R, step = radarRefs.step, start = radarRefs.start;
      function pos(i, v) { var a = start + i * step; return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)]; }
      var dpts = RADAR.map(function (d, i) { var q = pos(i, d.v * g); return q[0].toFixed(1) + ',' + q[1].toFixed(1); });
      radarRefs.area.setAttribute('points', dpts.join(' '));
      radarRefs.outline.setAttribute('points', dpts.join(' '));
      RADAR.forEach(function (d, i) {
        var q = pos(i, d.v * g);
        var dot = radarRefs.dots[i];
        dot.setAttribute('cx', q[0].toFixed(1));
        dot.setAttribute('cy', q[1].toFixed(1));
        var localP = Math.min(Math.max(g * RADAR.length - i, 0), 1);
        dot.setAttribute('r', (3.2 * (0.3 + 0.7 * localP)).toFixed(2));
        dot.style.opacity = localP;
        var pct = radarRefs.pcts[i];
        pct.textContent = Math.round(d.v * 100 * g) + '%';
        pct.style.opacity = localP;
      });
    }
    function animateRadar() {
      if (!radarRefs) return;
      if (prefersReduced) { renderRadar(1); return; }
      var dur = 1000, t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        renderRadar(easeOutBack(p));
        if (p < 1) requestAnimationFrame(frame);
        else renderRadar(1);
      }
      requestAnimationFrame(frame);
    }

    /* ===== 2. 七维记忆留存（水平条 + count-up + 弹簧填充） ===== */
    var retEl = section.querySelector('[data-retention]');
    var RET = [
      { name: '节奏',     covered: 9, total: 10, v: 0.82 },
      { name: '音高',     covered: 8, total: 10, v: 0.74 },
      { name: '调与音阶', covered: 7, total: 9,  v: 0.68 },
      { name: '和弦',     covered: 6, total: 8,  v: 0.79 },
      { name: '音程',     covered: 5, total: 9,  v: 0.61 },
      { name: '音乐综合', covered: 9, total: 10, v: 0.85 },
      { name: '术语符号', covered: 6, total: 9,  v: 0.70 }
    ];
    var retRows = [];
    function buildRetention() {
      if (!retEl) return;
      RET.forEach(function (m) {
        var row = document.createElement('div'); row.className = 'retention-row';
        var head = document.createElement('div'); head.className = 'retention-head';
        var name = document.createElement('span'); name.className = 'retention-name'; name.textContent = m.name;
        var count = document.createElement('span');
        count.className = 'retention-count ' + (m.covered === m.total ? 'is-full' : 'is-partial');
        count.textContent = m.covered + '/' + m.total;
        var pct = document.createElement('span'); pct.className = 'retention-pct ' + statusClass(m.v);
        pct.textContent = '0%';
        head.appendChild(name); head.appendChild(count); head.appendChild(pct);
        var track = document.createElement('div'); track.className = 'retention-track';
        var fill = document.createElement('div'); fill.className = 'retention-fill ' + statusClass(m.v);
        track.appendChild(fill);
        row.appendChild(head); row.appendChild(track);
        retEl.appendChild(row);
        retRows.push({ fill: fill, pct: pct, v: m.v });
      });
    }
    function animateRetention() {
      if (!retRows.length) return;
      retRows.forEach(function (r) { r.fill.style.width = Math.round(r.v * 100) + '%'; });
      if (prefersReduced) {
        retRows.forEach(function (r) { r.pct.textContent = Math.round(r.v * 100) + '%'; });
        return;
      }
      var dur = 900, t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        retRows.forEach(function (r) { r.pct.textContent = Math.round(r.v * 100 * e) + '%'; });
        if (p < 1) requestAnimationFrame(frame);
        else retRows.forEach(function (r) { r.pct.textContent = Math.round(r.v * 100) + '%'; });
      }
      requestAnimationFrame(frame);
    }

    /* ===== 3. 记忆留存曲线（艾宾浩斯 + 可拖动时间游标） ===== */
    var curveSvg = section.querySelector('.insight-curve');
    var curveRefs = null;
    var CURVE = {
      halfLife: 4, interval: 7,
      kp: [
        { days: 1,  retention: 0.86 }, { days: 2,  retention: 0.74 },
        { days: 4,  retention: 0.58 }, { days: 6,  retention: 0.70 },
        { days: 9,  retention: 0.42 }, { days: 12, retention: 0.30 },
        { days: 16, retention: 0.52 }, { days: 20, retention: 0.34 },
        { days: 25, retention: 0.28 }, { days: 30, retention: 0.46 }
      ]
    };
    function retentionAt(days) { return Math.pow(0.5, days / CURVE.halfLife); }
    function buildCurve() {
      if (!curveSvg) return;
      var W = 340, H = 240, padL = 12, padR = 12, padT = 16, padB = 24;
      var plotW = W - padL - padR, plotH = H - padT - padB, maxDays = 35;
      function cx(d) { return padL + d / maxDays * plotW; }
      function cy(r) { return padT + (1 - r) * plotH; }
      curveSvg.appendChild(el('line', { x1: padL, y1: cy(0.4).toFixed(1), x2: W - padR, y2: cy(0.4).toFixed(1), class: 'curve-threshold' }));
      if (CURVE.interval > 0 && CURVE.interval <= maxDays) {
        curveSvg.appendChild(el('line', { x1: cx(CURVE.interval).toFixed(1), y1: padT, x2: cx(CURVE.interval).toFixed(1), y2: (padT + plotH).toFixed(1), class: 'curve-interval' }));
      }
      var dStr = '';
      for (var i = 0; i <= 90; i++) {
        var d = i / 90 * maxDays;
        dStr += (i === 0 ? 'M' : 'L') + cx(d).toFixed(1) + ' ' + cy(retentionAt(d)).toFixed(1) + ' ';
      }
      var area = el('path', { d: dStr + 'L' + (W - padR).toFixed(1) + ' ' + (padT + plotH).toFixed(1) + ' L' + padL.toFixed(1) + ' ' + (padT + plotH).toFixed(1) + ' Z', class: 'curve-area' });
      area.style.opacity = prefersReduced ? 1 : 0;
      curveSvg.appendChild(area);
      var line = el('path', { d: dStr.trim(), class: 'curve-line grow-stroke' });
      curveSvg.appendChild(line);
      setupGrow(line);
      var kpEls = [];
      CURVE.kp.forEach(function (k) {
        var d = Math.min(k.days, maxDays);
        var dot = el('circle', { cx: cx(d).toFixed(1), cy: cy(k.retention).toFixed(1), r: 4, class: 'curve-kp' });
        dot.style.fill = statusVar(k.retention);
        dot.style.opacity = prefersReduced ? 1 : 0;
        curveSvg.appendChild(dot);
        kpEls.push({ d: d, retention: k.retention, el: dot });
      });
      var cursor = el('line', { y1: padT, y2: (padT + plotH).toFixed(1), class: 'curve-cursor' });
      curveSvg.appendChild(cursor);
      var inter = el('circle', { r: 5 });
      inter.style.fill = 'var(--c-accent)';
      inter.style.stroke = 'var(--c-ink)';
      inter.style.strokeWidth = '1.5';
      curveSvg.appendChild(inter);
      var knob = el('circle', { r: 7, class: 'curve-knob' });
      curveSvg.appendChild(knob);
      var hit = el('rect', { x: 0, y: 0, width: W, height: H, class: 'curve-hit' });
      curveSvg.appendChild(hit);
      curveRefs = { W: W, padL: padL, plotW: plotW, maxDays: maxDays, cx: cx, cy: cy, padT: padT, plotH: plotH,
                    cursor: cursor, inter: inter, knob: knob, kpEls: kpEls, line: line, area: area };
      attachDrag(hit, knob);
      updateCursor(CURVE.interval);
    }
    function updateCursor(day) {
      if (!curveRefs) return;
      var R = curveRefs;
      var x = R.cx(day);
      R.cursor.setAttribute('x1', x.toFixed(1));
      R.cursor.setAttribute('x2', x.toFixed(1));
      var ret = retentionAt(day), yInt = R.cy(ret);
      R.inter.setAttribute('cx', x.toFixed(1));
      R.inter.setAttribute('cy', yInt.toFixed(1));
      R.knob.setAttribute('cx', x.toFixed(1));
      R.knob.setAttribute('cy', R.padT);
      var snap = 2.5, near = 0, low = 0;
      R.kpEls.forEach(function (k) {
        var isNear = Math.abs(k.d - day) <= snap;
        k.el.classList.toggle('is-near', isNear);
        k.el.setAttribute('r', isNear ? 6 : 4);
        if (isNear) { near++; if (k.retention < 0.4) low++; }
      });
      var dayEl = section.querySelector('[data-curve-day]');
      var retEl2 = section.querySelector('[data-curve-ret]');
      var nearEl = section.querySelector('[data-curve-near]');
      var lowEl = section.querySelector('[data-curve-low]');
      if (dayEl) dayEl.textContent = '第 ' + Math.round(day) + ' 天';
      if (retEl2) retEl2.textContent = '理论留存 ' + Math.round(ret * 100) + '%';
      if (nearEl) nearEl.textContent = '临近 ' + near + ' 个知识点';
      if (lowEl) lowEl.textContent = near === 0 ? '—' : (low + ' 个低于阈值');
    }
    function attachDrag(hit, knob) {
      if (!curveRefs) return;
      var svg = curveSvg, dragging = false;
      function dayFromEvent(ev) {
        var rect = svg.getBoundingClientRect();
        var x = (ev.clientX - rect.left) / rect.width * curveRefs.W;
        var d = (x - curveRefs.padL) / curveRefs.plotW * curveRefs.maxDays;
        return Math.min(curveRefs.maxDays, Math.max(0, d));
      }
      function move(ev) { curveRefs.cursor.classList.add('dragging'); updateCursor(dayFromEvent(ev)); }
      function start(ev) { dragging = true; move(ev); ev.preventDefault(); }
      function end() { dragging = false; curveRefs.cursor.classList.remove('dragging'); }
      [hit, knob].forEach(function (n) { n.addEventListener('pointerdown', start); });
      window.addEventListener('pointermove', function (ev) { if (dragging) move(ev); });
      window.addEventListener('pointerup', end);
    }
    function animateCurve() {
      if (!curveRefs) return;
      curveRefs.line.style.strokeDashoffset = 0;
      curveRefs.area.style.opacity = 1;
      curveRefs.kpEls.forEach(function (k, i) {
        setTimeout(function () { k.el.style.opacity = 1; }, prefersReduced ? 0 : 200 + i * 40);
      });
    }

    /* ===== 4. 上课周期分析（节律柱 + 试卷小旗） ===== */
    var rhythmEl = section.querySelector('[data-rhythm]');
    var RHYTHM = [
      { label: '3月', lessons: 3, exam: false, completion: 0.70 },
      { label: '4月', lessons: 5, exam: true,  completion: 0.85 },
      { label: '5月', lessons: 4, exam: false, completion: 0.60 },
      { label: '6月', lessons: 6, exam: true,  completion: 0.90 },
      { label: '7月', lessons: 2, exam: false, completion: 0.50 },
      { label: '8月', lessons: 5, exam: true,  completion: 0.82 }
    ];
    var rhythmBars = [];
    function buildRhythm() {
      if (!rhythmEl) return;
      var maxL = Math.max.apply(null, RHYTHM.map(function (m) { return m.lessons; }).concat([1]));
      RHYTHM.forEach(function (m) {
        var col = document.createElement('div'); col.className = 'rhythm-col';
        var bar = document.createElement('div'); bar.className = 'rhythm-bar';
        if (m.lessons === 0) bar.classList.add('is-empty');
        else if (m.completion >= 0.8) bar.classList.add('is-success');
        else if (m.completion < 0.6) bar.classList.add('is-warning');
        if (m.exam) {
          var flag = document.createElement('span'); flag.className = 'rhythm-flag';
          flag.innerHTML = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2 1 L2 11 M2 1.5 L9 3 L2 4.5 Z" style="fill:var(--c-accent)"></path></svg>';
          bar.appendChild(flag);
        }
        var lbl = document.createElement('span'); lbl.className = 'rhythm-label'; lbl.textContent = m.label;
        col.appendChild(bar); col.appendChild(lbl);
        rhythmEl.appendChild(col);
        rhythmBars.push({ bar: bar, lessons: m.lessons, maxL: maxL });
      });
    }
    function animateRhythm() {
      if (!rhythmBars.length) return;
      rhythmBars.forEach(function (r) {
        r.bar.style.height = (r.lessons === 0) ? '6px' : (18 + r.lessons / r.maxL * 120).toFixed(0) + 'px';
      });
    }

    /* ===== 构建 + 进入视口触发各自动画 ===== */
    buildRadar(); buildRetention(); buildCurve(); buildRhythm();
    var animateMap = { radar: animateRadar, retention: animateRetention, curve: animateCurve, rhythm: animateRhythm };
    var animCards = section.querySelectorAll('[data-animate]');
    if ('IntersectionObserver' in window && !prefersReduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var fn = animateMap[en.target.getAttribute('data-animate')];
            if (fn) fn();
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.2 });
      animCards.forEach(function (c) { io.observe(c); });
    } else {
      animateRadar(); animateRetention(); animateCurve(); animateRhythm();
    }
  })();
})();
