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
    var targets = document.querySelectorAll('.section, .hero');

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


  /* Footer year, so it never goes stale. */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
