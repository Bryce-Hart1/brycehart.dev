/* The scroll tour on /agil/. Loaded only by index.html, and only after
   vendor/anime.umd.min.js — the help page and the redirect stubs never pull the
   animation engine at all.

   Everything here is an enhancement. The section it drives is fully laid out,
   fully readable and fully populated by CSS alone; this file's entire job is to
   add one class (`js-stage`) and then swap a screenshot as each talking point
   reaches the middle of the screen. If anime failed to load, if the browser has
   no sticky, if the viewport is small, or if the visitor asked for reduced
   motion, we return early and the CSS fallback is what everyone sees. There is
   no state in which content ends up hidden because a script didn't finish.

   Design note — why the swap is TRIGGERED and not SCRUBBED. The obvious
   scrollytelling move is to scrub a crossfade against scroll position. It's
   wrong for this: there are three discrete screenshots, so a scrubbed crossfade
   means the phone shows a ghosted double image for most of the scroll (reads as
   a rendering bug), and it makes the fade duration a function of scroll
   velocity, so a trackpad flick and a mouse wheel produce visibly different
   pages. So: scrub the things that are genuinely continuous (the rail, the coin
   counter), trigger the things that are discrete (the screenshot). */

(function () {
  'use strict';

  var stage = document.querySelector('[data-stage]');
  if (!stage) return;

  /* Covers every way the engine can be missing: a 404, a blocked request, an
     ad blocker, a CSP rule, a truncated file. Any of them and we stay in the
     fallback rather than throwing halfway through setup. */
  var anime = globalThis.anime;
  if (typeof anime !== 'object' || anime === null || typeof anime.animate !== 'function') return;

  if (!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'))) return;

  var root = document.documentElement;

  /* Scoped to the frame stack on purpose. `data-shot` appears TWICE in the
     markup with two different meanings: on a <figure> it means "I am this
     screen", and on a beat it means "I want that screen shown". A bare
     [data-shot] query matches both, which would put the six beats into the
     frames array — and since the frames array is what gets aria-hidden toggled,
     that would hide every word of the tour from screen readers on the first
     swap. Keep the `>` combinator: it is what makes the two meanings distinct. */
  var frames = Array.prototype.slice.call(stage.querySelectorAll('[data-stage-frames] > [data-shot]'));
  var beats  = Array.prototype.slice.call(stage.querySelectorAll('[data-beat]'));
  if (!frames.length || !beats.length) return;

  /* Every ScrollObserver we create, so they can be re-measured after late
     layout shifts. There is no ScrollObserver.refreshAll() in v4.2.2 — only the
     per-instance .refresh() — so we have to keep our own list. */
  var observers = [];


  /* ---- when the tour is allowed to run ----------------------------------- */

  /* The three conditions, as live queries.
       - wide, because a sticky panel eating half a phone viewport is the most
         complained-about pattern in scrollytelling, and a phone screenshot
         inside a phone at 300px isn't legible anyway;
       - tall, because on a ~620px-tall laptop viewport the pinned phone and the
         sticky site header together leave the copy no room;
       - motion, because a panel that holds still while its contents change
         under a moving page is exactly the class of effect that preference
         exists to suppress. The fallback is a good layout, not a punishment. */
  var conditions = [
    matchMedia('(min-width: 48rem)'),
    matchMedia('(min-height: 40rem)'),
    matchMedia('(prefers-reduced-motion: no-preference)')
  ];

  function engaged() {
    for (var i = 0; i < conditions.length; i++) if (!conditions[i].matches) return false;
    return true;
  }

  /* The `js-stage` class is managed here rather than in the anime scope's
     teardown. The scope re-runs its constructor when a query flips, but it does
     NOT reliably invoke the cleanup a constructor returns — verified by
     resizing a real page: the class survived a desktop-to-mobile flip and only
     the CSS guard unwound the pin. Owning the class with a plain listener is
     three lines and has no such ambiguity. */
  function syncEngagement() {
    if (engaged()) {
      root.classList.add('js-stage');
    } else {
      root.classList.remove('js-stage');
      resetFrames();
    }
    refreshAll();   /* offsets move when the layout does */
  }

  function resetFrames() {
    current = 0;
    frames.forEach(function (f) {
      f.removeAttribute('aria-hidden');
      f.style.opacity = '';
      f.style.transform = '';
    });
    beats.forEach(function (b) { b.removeAttribute('data-current'); });
    delete stage.dataset.shot;
  }

  conditions.forEach(function (mq) {
    /* addEventListener on MediaQueryList is the modern form; addListener is the
       Safari <14 fallback and costs one line. */
    if (mq.addEventListener) mq.addEventListener('change', syncEngagement);
    else if (mq.addListener) mq.addListener(syncEngagement);
  });

  /* Belt and braces on top of the media-query listeners. Not every environment
     dispatches MediaQueryList `change` — a viewport driven by devtools or by an
     automation harness can resize without it, which leaves the class saying one
     thing while the queries say another. syncEngagement is idempotent and
     trivial, so calling it on resize too costs nothing and makes the class
     honest everywhere. (Behaviour never depended on it: showShot() reads the
     live queries, and the CSS unwinds the pin on its own. This just keeps the
     DOM from lying about which mode it is in.) */
  addEventListener('resize', syncEngagement, { passive: true });
  addEventListener('orientationchange', syncEngagement, { passive: true });


  /* ---- the swap --------------------------------------------------------- */

  /* Starts at 0, not -1: the CSS already shows frame 0, so 0 is the truthful
     initial state and showShot(0) correctly does nothing. */
  var current = 0;

  function showShot(next) {
    /* Observers outlive a resize, so this guard is what stops a scroll from
       stamping inline opacity onto the unpinned layout and hiding two of the
       three screenshots.

       BOTH conditions, deliberately. The class is the contract between the CSS
       and this file — only under `.js-stage` does the CSS stack the frames and
       hide all but one, so only then is it safe to drive opacity. The live
       queries are checked too, in case a resize left the class stale (some
       environments never dispatch `resize` or MediaQueryList `change`). Either
       one alone is safe in one direction and unsafe in the other; together they
       fail closed, and failing closed here means "every screenshot visible",
       which is the fallback we want anyway. */
    if (!root.classList.contains('js-stage') || !engaged()) return;
    if (next === current || !frames[next]) return;

    var incoming = frames[next];
    var outgoing = frames[current];
    current = next;

    /* Exactly one frame in the accessibility tree at a time, so a screen reader
       never reads three conflicting descriptions of "the screen". */
    frames.forEach(function (f, i) {
      f.setAttribute('aria-hidden', i === next ? 'false' : 'true');
    });

    /* Promote the following screenshot out of lazy loading one beat early, so
       the next swap never lands on an image that hasn't started downloading. */
    var upcoming = frames[next + 1] && frames[next + 1].querySelector('img');
    if (upcoming) upcoming.loading = 'eager';

    /* Only opacity and transform — both composited, neither triggers layout or
       paint. Nothing in this function READS layout, so it cannot thrash. */
    anime.animate(incoming, { opacity: 1, scale: [1.02, 1], duration: 320, ease: 'outQuad' });
    if (outgoing) anime.animate(outgoing, { opacity: 0, duration: 220, ease: 'linear' });

    /* Observable state, for debugging in the wild and for the automated checks
       (an end-state assertion alone can't tell "every swap fired in order" from
       "only the last one did"). */
    stage.dataset.shot = String(next);
    stage.dispatchEvent(new CustomEvent('agil:shot', { bubbles: true, detail: { index: next } }));
  }


  /* ---- scope: builds when it should, tears itself down when it shouldn't -- */

  /* The scope's media queries are live, so anime re-runs this constructor when
     one flips and reverts the animations it previously created. That is what
     the scope is used for here — the `js-stage` class and the frames' inline
     styles are managed by syncEngagement() above, because the scope's own
     cleanup hook proved unreliable on a flip. */
  anime.createScope({
    root: stage,
    mediaQueries: {
      wide:     '(min-width: 48rem)',
      tall:     '(min-height: 40rem)',
      motionOK: '(prefers-reduced-motion: no-preference)'
    }
  })
  .add(function (self) {
    var m = self.matches;

    /* Narrow, short, or motion-averse: build nothing, stay in the fallback.
       See the `conditions` array above for why each one disqualifies the tour. */
    if (!m.wide || !m.tall || !m.motionOK) return;

    beats.forEach(function (beat) {
      var wants = parseInt(beat.getAttribute('data-shot'), 10) || 0;

      /* 'center start' / 'center end' means: active exactly while the
         viewport's centre line is inside this beat. Precisely one beat is
         active at any scroll position, and onEnter fires in BOTH directions —
         so scrolling back up restores the earlier screenshot for free. */
      observers.push(anime.onScroll({
        target: beat,
        enter: 'center start',
        leave: 'center end',
        onEnter: function () {
          showShot(wants);
          beats.forEach(function (b) { b.removeAttribute('data-current'); });
          beat.setAttribute('data-current', '');
        }
      }));

      /* The copy itself: a one-shot rise as the beat comes up. repeat:false
         makes the observer revert itself after the first leave, so a beat you
         have already read costs nothing to scroll past again.

         TRANSFORM ONLY — deliberately no opacity. anime applies an animation's
         `from` value the moment it is created, so `opacity: [0, 1]` would set
         the text to invisible immediately and leave it there for as long as the
         engine doesn't tick. That is not hypothetical: rAF doesn't run in a
         background tab, and an observer whose beat is already past the viewport
         on load (a restored scroll position, a #fragment deep link) may never
         fire at all. Animating only `y` means the worst case is text sitting
         14px lower than it should — nobody can tell, and nothing is ever
         unreadable. Never put copy behind a JS-driven opacity. */
      var lines = beat.querySelectorAll('[data-beat-line]');
      if (lines.length) {
        anime.animate(lines, {
          y: [14, 0],
          delay: anime.stagger(80),
          duration: 600,
          ease: 'out(3)',
          autoplay: anime.onScroll({ target: beat, enter: 'bottom top', repeat: false, sync: 'play' })
        });
      }
    });

    /* The genuinely continuous parts, scrubbed. A fractional `sync` is a lerped
       scrub — anime eases toward the scroll position each frame rather than
       snapping to it, which is what keeps a trackpad flick from looking like a
       jump cut. */
    var rail = stage.querySelector('[data-stage-rail]');
    if (rail) {
      anime.animate(rail, {
        '--rail': [0, 1],
        ease: 'linear',
        autoplay: anime.onScroll({ target: stage, sync: 0.35 })
      });
    }

    /* The coin count in the consistency beat is the one number on the page that
       genuinely IS a function of scroll position, so it earns its scrub. See
       .beat__count in the CSS for why it can't reflow the sentence.

       The range runs from the beat first appearing at the bottom of the
       viewport ('end start') to the beat sitting dead centre ('center
       center'), so the ladder has already topped out at 100 by the time you
       are actually reading the sentence. Anything that finishes later than
       centre means the number is still climbing while the beat is on its way
       off the top, which reads as broken. */
    var count = stage.querySelector('[data-count]');
    if (count) {
      var countBeat = count.closest('[data-beat]');
      anime.animate(count, {
        innerHTML: [0, parseInt(count.getAttribute('data-count'), 10) || 100],
        modifier: anime.utils.round(0),
        ease: 'linear',
        autoplay: anime.onScroll({
          target: countBeat || stage,
          enter: 'end start',
          leave: 'center center',
          sync: 0.35
        })
      });
    }

    /* The ghost outline draws itself on in the privacy beat. createDrawable
       only works on stroked geometry, which is why this icon is inline SVG and
       the filled chess pieces below are CSS masks instead. */
    var ghost = stage.querySelector('[data-draw] path:not([stroke="none"])');
    if (ghost && typeof anime.createDrawable === 'function') {
      var ghostBeat = ghost.closest('[data-beat]');
      anime.animate(anime.createDrawable(ghost), {
        draw: ['0 0', '0 1'],
        duration: 900,
        ease: 'inOutQuad',
        autoplay: anime.onScroll({
          target: ghostBeat || stage, enter: 'bottom top', repeat: false, sync: 'play'
        })
      });
    }

    /* The rank ladder climbs as the last beat arrives. Transform only, for the
       same reason as the beat copy above. */
    var ladder = stage.querySelectorAll('[data-ladder] li');
    if (ladder.length) {
      var ladderBeat = ladder[0].closest('[data-beat]');
      anime.animate(ladder, {
        scale: [0.6, 1],
        y: [10, 0],
        delay: anime.stagger(90),
        duration: 520,
        ease: 'out(2)',
        autoplay: anime.onScroll({
          target: ladderBeat || stage, enter: 'bottom top', repeat: false, sync: 'play'
        })
      });
    }

    /* Offered to anime for its own bookkeeping. Do NOT move the class or the
       inline-style reset in here — this hook is not reliably called on a media
       query flip, which is exactly the bug syncEngagement() exists to route
       around. Keep the two independent. */
    return function () {
      observers.length = 0;
    };
  });

  /* Set the initial state, now that everything is wired. */
  syncEngagement();


  /* ---- keep the tripwires honest ---------------------------------------- */

  /* Scroll offsets are measured once at construction. Anything that settles
     later — web font metrics, text-wrap: balance rewrapping a headline, an
     image finally decoding — would leave every threshold a few pixels off. Two
     cheap re-measures cover it. (There is no ScrollObserver.refreshAll() in
     v4.2.2, so we walk our own list.) */
  function refreshAll() {
    observers.forEach(function (o) { if (o && typeof o.refresh === 'function') o.refresh(); });
  }

  addEventListener('load', refreshAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAll);
})();
