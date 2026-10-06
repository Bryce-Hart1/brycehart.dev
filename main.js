/* Progressive enhancement only — the site is fully readable with JS disabled. */

(function () {
  'use strict';

  /* Hairline under the header, but only once the page has scrolled. */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.setAttribute('data-scrolled', '');
      else header.removeAttribute('data-scrolled');
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* Fade sections in on first view. Skipped entirely when the visitor has asked
     for reduced motion, and never applied if IntersectionObserver is missing. */
  var wantsMotion = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (wantsMotion && 'IntersectionObserver' in window) {
    /* Chapters reveal their contents, not the section itself, so the colored
       backgrounds are already in place as you scroll into them. */
    var targets = document.querySelectorAll('.section, .hero, .chapter__grid');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }


  /* Track which chapter crosses the middle of the viewport: light its dot on
     the rail, and tint the mobile browser chrome to that chapter's --bg. */
  var rail = document.querySelector('[data-rail]');
  var chapters = document.querySelectorAll('.chapter');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var defaultTheme = themeMeta ? themeMeta.getAttribute('content') : null;

  if (chapters.length && 'IntersectionObserver' in window) {
    var current = null;

    var setActive = function (chapter) {
      current = chapter;
      if (rail) {
        if (chapter) rail.setAttribute('data-active', '');
        else rail.removeAttribute('data-active');
        rail.querySelectorAll('a').forEach(function (a) {
          if (chapter && a.getAttribute('href') === '#' + chapter.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
      if (themeMeta) {
        var bg = chapter && getComputedStyle(chapter).getPropertyValue('--bg').trim();
        themeMeta.setAttribute('content', bg || defaultTheme);
      }
    };

    /* A zero-height band at mid-screen: at most one chapter is in it. */
    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target);
        else if (entry.target === current) setActive(null);
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    chapters.forEach(function (el) { chapterObserver.observe(el); });
    if (rail) rail.setAttribute('data-ready', '');
  }


  /* Footer year, so it never goes stale. */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
