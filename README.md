# brycehart.dev

Personal site and project gateway. Plain HTML, CSS, and JavaScript — no build step,
no dependencies, no `npm install`.

```
index.html      all the content and copy
styles.css      all the styling (tokens at the top)
main.js         scroll reveal, sticky-header hairline, chapter rail, footer year
assets/         favicon, résumé PDF, OG image
```

## Working on it

Open `index.html` in a browser. Edit, save, refresh. That's the whole loop.

If you want live reload:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Filling it in

Every spot that needs your words is marked `TODO` — search the files for it.
In rough priority order:

1. **Hero headline and intro** (`index.html`, `.hero`) — the only text most visitors read.
2. **Project descriptions** — one concrete technical detail each. A number or a
   specific hard problem lands better than adjectives. Delete the chapters for
   projects you don't want to show.
3. **`<title>` and `<meta name="description">`** — this is what Google displays.
4. **`assets/resume.pdf`** — drop it in, or delete the Résumé button.
5. **LinkedIn URL** in the contact section — recruiters look for it.

## Project chapters

Each project is a full-width `<section class="chapter chapter--x">` with its own palette
and one decorative visual (`aria-hidden`; the real content stays in the text column).
A chapter restyles itself by redefining the color tokens on its `.chapter--x` class
(sections 7a–7e of `styles.css`), so links, tags and buttons pick up its palette
without extra CSS. Chapters alternate sides automatically.

To add one:

1. Copy a `<section class="chapter">` block in `index.html`; give it a new `id` and
   `.chapter--x` modifier, and bump the `NN / 05` numbers.
2. Add a `.chapter--x { --bg: …; --text: …; --accent: … }` block to `styles.css`.
   Keep body text and `--accent` at 4.5:1 or better on `--bg`.
3. Add a link to the hero index (`.hero__index`) and the rail (`.rail`).
4. If the visual animates, add it to the `prefers-reduced-motion` list at the bottom
   of `styles.css`, and make sure its resting state looks complete.

Still to fill in: real EM instructions in the CPU Emulator listing, and the LinkedIn
post link in the castle+ chapter (both marked `TODO`).

## Restyling

Everything visual is driven by the custom properties at the top of `styles.css`.
Changing `--accent` recolors the site. `--font-sans` and `--font-mono` currently use
the system stack, which costs nothing to load; swap in a webfont if you want more
personality.

The palette is midnight on cream and there is exactly one of it — no light/dark toggle.
Cream paper background, midnight-blue text and accent, moss-green status dot. Two things
keep it coherent if you start changing colors:

- Nothing is a true grey. Every text and border neutral carries a blue cast, so a stock
  `#888` will look conspicuously dead next to them.
- Shadows are tinted with the midnight from `--text`, not black. Pure black over cream
  paper turns into a grey smudge.

`color-scheme: light` is declared so browsers don't render scrollbars and form controls
in dark chrome for visitors whose OS is set to dark mode.

If you change `--bg`, also update the `theme-color` meta tag in `index.html` — it colors
the browser UI on mobile. (While a chapter is on screen, `main.js` swaps it to that
chapter's `--bg`, and restores it afterwards.)

The midnight palette is the frame (hero, About, Contact). The project chapters are the
exception on purpose: each one wears its own palette.

## Deploying

The site is static, so any host works. Nothing here assumes a particular one.

**GitHub Pages** — push to a repo named `Bryce-Hart1.github.io` and it's live at that
URL. For a custom domain, add a `CNAME` file containing just the domain, then point a
`CNAME` DNS record at `bryce-hart1.github.io`.

**Vercel / Netlify / Cloudflare Pages** — connect the repo, leave the build command
empty, set the output directory to the project root.

Before you point a domain at it, set the real URL in the `<link rel="canonical">` and
`og:url` tags in `index.html`. They currently say `example.com`.

## Checks worth running before you share the link

- Open it on your phone. The layout is responsive but your copy might not be.
- Tab through the page — focus rings should be visible on every link and button.
- Paste the URL into Slack or iMessage to see the link preview. If it looks bare,
  add `assets/og-image.png` (1200×630) and uncomment the `og:image` tag.
