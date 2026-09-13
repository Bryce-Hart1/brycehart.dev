/* The launch countdown on /agil/. Loaded after vendor/anime.umd.min.js.

   Same contract as agil-scroll.js: everything is additive. With JS off the
   hero shows the written launch date and the countdown stays hidden. With JS on
   but anime missing, or with reduced motion, the countdown still ticks — the
   digits just snap instead of rolling. Nothing readable is ever left behind a
   JS-driven opacity.

   Each digit is a window onto a strip of 0–9 repeated twice. Showing digit d
   means sliding the strip up d ems. A countdown mostly steps d → d-1 (the strip
   slides down); when it wraps 0 → 9 we first jump invisibly to the second copy
   of the old digit (d + 10) and slide down from there, so every change rolls in
   the same direction. */

(function () {
  'use strict';

  var hero = document.querySelector('.launch[data-launch]');
  if (!hero) return;

  var target = Date.parse(hero.getAttribute('data-launch'));

  /* Local testing only: ?launch=15 launches 15 seconds after page load. */
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    var debug = new URLSearchParams(location.search).get('launch');
    if (debug !== null && !isNaN(+debug)) target = Date.now() + +debug * 1000;
  }
  if (isNaN(target)) return;

  var root = document.documentElement;
  var anime = globalThis.anime;
  var hasAnime = typeof anime === 'object' && anime !== null && typeof anime.animate === 'function';
  var motion = hasAnime && matchMedia('(prefers-reduced-motion: no-preference)').matches;

  var countdown = hero.querySelector('[data-countdown]');
  var summary   = hero.querySelector('[data-countdown-summary]');
  var ring      = hero.querySelector('[data-ring]');
  var burst     = hero.querySelector('[data-burst]');
  var units = {};
  ['days', 'hours', 'minutes', 'seconds'].forEach(function (name) {
    units[name] = { el: hero.querySelector('[data-unit="' + name + '"]'), digits: [] };
  });

  root.classList.add('js-countdown');


  /* ---- time ------------------------------------------------------------- */

  function parts(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor(s / 3600) % 24,
      minutes: Math.floor(s / 60) % 60,
      seconds: s % 60
    };
  }

  function pad(n, width) {
    var str = String(n);
    while (str.length < width) str = '0' + str;
    return str;
  }


  /* ---- digits ----------------------------------------------------------- */

  function place(strip, index) {
    if (motion) anime.utils.set(strip, { y: -index + 'em' });
    else strip.style.transform = 'translateY(' + -index + 'em)';
  }

  function buildDigits(unit, width) {
    unit.el.textContent = '';
    unit.digits = [];
    for (var i = 0; i < width; i++) {
      var slot = document.createElement('span');
      slot.className = 'digit';
      var strip = document.createElement('span');
      strip.className = 'digit__strip';
      for (var k = 0; k < 20; k++) {
        var n = document.createElement('span');
        n.textContent = k % 10;
        strip.appendChild(n);
      }
      slot.appendChild(strip);
      unit.el.appendChild(slot);
      unit.digits.push({ strip: strip, value: 0 });
      place(strip, 0);
    }
  }

  function setDigit(digit, next, animate) {
    if (digit.value === next) return;
    var prev = digit.value;
    digit.value = next;

    if (!animate || !motion) { place(digit.strip, next); return; }

    anime.utils.remove(digit.strip);
    if (next > prev) place(digit.strip, prev + 10);   /* wrap: same glyph, second copy */
    anime.animate(digit.strip, { y: -next + 'em', duration: 520, ease: 'out(3)' });
  }

  function render(p, animate) {
    Object.keys(units).forEach(function (name) {
      var unit = units[name];
      var str = pad(p[name], 2);
      if (str.length !== unit.digits.length) buildDigits(unit, str.length);
      for (var i = 0; i < str.length; i++) setDigit(unit.digits[i], +str[i], animate);
    });
  }


  /* ---- screen reader summary, at most once a minute ---------------------- */

  var lastSummary = '';
  function announce(p, launched) {
    var text = launched
      ? 'Agil has launched.'
      : p.days + ' days, ' + p.hours + ' hours and ' + p.minutes + ' minutes until launch.';
    if (text !== lastSummary) summary.textContent = lastSummary = text;
  }


  /* ---- the tick --------------------------------------------------------- */

  var timer = null;
  var launched = false;

  function tick(animate) {
    clearTimeout(timer);   /* one loop, however tick() was reached */
    var remaining = target - Date.now();
    var p = parts(remaining);
    render(p, animate);

    if (remaining <= 0) { launch(animate); return; }
    announce(p, false);

    if (animate && motion && ring) {
      var final = remaining < 10500;
      anime.animate(ring, { opacity: [final ? 0.9 : 0.45, 0], scale: [1, final ? 1.35 : 1.12], duration: 900, ease: 'out(2)' });
      if (final) anime.animate(ring.parentNode, { scale: [1.08, 1], duration: 600, ease: 'out(3)' });
    }

    /* Aligned to the wall-clock second, recomputed from Date.now() every time,
       so a sleeping laptop or a throttled tab can't drift the display. */
    timer = setTimeout(function () { tick(true); }, 1000 - (Date.now() % 1000) + 15);
  }

  document.addEventListener('visibilitychange', function () {
    if (launched) return;
    clearTimeout(timer);
    if (!document.hidden) tick(false);   /* snap, don't roll through what we missed */
  });


  /* ---- launch ------------------------------------------------------------ */

  function launch(animate) {
    if (launched) return;
    launched = true;
    clearTimeout(timer);
    hero.setAttribute('data-state', 'launched');
    announce(null, true);

    hero.querySelectorAll('[data-launched-text]').forEach(function (el) {
      el.textContent = el.getAttribute('data-launched-text');
    });
    hero.querySelectorAll('[data-prelaunch]').forEach(function (el) { el.hidden = true; });
    var shown = hero.querySelectorAll('[data-launched]');
    shown.forEach(function (el) { el.hidden = false; });

    if (!animate || !motion) return;

    anime.animate(countdown.querySelectorAll('.countdown__unit'), {
      scale: [1, 1.12, 1],
      delay: anime.stagger(70),
      duration: 700,
      ease: 'out(3)'
    });
    anime.animate(hero.querySelector('.launch__title'), { scale: [0.9, 1], duration: 900, ease: 'outElastic(1, .6)' });
    anime.animate(shown, { y: [16, 0], scale: [0.9, 1], duration: 700, ease: 'out(3)' });

    /* Confetti: decorative, removed when done. */
    if (burst) {
      for (var i = 0; i < 36; i++) burst.appendChild(document.createElement('span'));
      var bits = burst.querySelectorAll('span');
      anime.animate(bits, {
        x: function () { return anime.utils.random(-340, 340); },
        y: function () { return anime.utils.random(-260, 200); },
        rotate: function () { return anime.utils.random(-540, 540); },
        scale: [{ from: 0, to: 1.2, duration: 250 }, { to: 0.4, duration: 1100 }],
        opacity: [{ from: 1, to: 1, duration: 800 }, { to: 0, duration: 550 }],
        delay: anime.stagger(12),
        ease: 'out(3)',
        onComplete: function () { burst.textContent = ''; }
      });
    }
  }


  /* ---- first paint -------------------------------------------------------- */

  if (motion) {
    /* Reels spin in from 9s down to the real time, units staggered. Transform
       only on anything with text in it. */
    var start = parts(target - Date.now());
    render({ days: 99, hours: 99, minutes: 99, seconds: 99 }, false);
    Object.keys(units).forEach(function (name) {
      units[name].digits.forEach(function (d) { place(d.strip, 19); d.value = 19; });
    });

    var tl = anime.createTimeline({ defaults: { ease: 'out(3)' } });
    tl.add(hero.querySelectorAll('[data-intro]'), {
      y: [18, 0],
      duration: 700,
      delay: anime.stagger(70)
    })
    .add(hero.querySelector('.launch__mark'), { scale: [0.6, 1], rotate: [-12, 0], duration: 900, ease: 'outElastic(1, .55)' }, 0)
    .add(hero.querySelectorAll('[data-intro-unit]'), {
      y: [30, 0],
      scale: [0.92, 1],
      duration: 700,
      delay: anime.stagger(90)
    }, 150);

    var i = 0;
    Object.keys(units).forEach(function (name) {
      var str = pad(start[name], 2);
      if (str.length !== units[name].digits.length) buildDigits(units[name], str.length);
      units[name].digits.forEach(function (d, k) {
        var v = +str[k];
        anime.utils.set(d.strip, { y: '-19em' });
        d.value = v;
        tl.add(d.strip, { y: -v + 'em', duration: 1400, ease: 'out(4)' }, 250 + i++ * 70);
      });
    });

    tl.then(function () { tick(false); });

    /* Ambient drift. Paused while the tab is hidden. */
    var drift = [];
    hero.querySelectorAll('.launch__orb').forEach(function (orb, n) {
      drift.push(anime.animate(orb, {
        x: anime.utils.random(-60, 60) + 'px',
        y: anime.utils.random(-50, 50) + 'px',
        scale: [1, 1.15 + n * 0.05],
        duration: 6000 + n * 1700,
        ease: 'inOutSine',
        alternate: true,
        loop: true
      }));
    });
    document.addEventListener('visibilitychange', function () {
      drift.forEach(function (a) { document.hidden ? a.pause() : a.play(); });
    });
  } else {
    tick(false);
  }
})();
