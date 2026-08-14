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
})();
