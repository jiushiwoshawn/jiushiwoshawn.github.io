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

  /* ---------- 1. 滚动淡入 ---------- */
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
      // 同屏元素做轻微错峰，避免僵硬齐排
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
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
})();
