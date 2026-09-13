# brycehart.dev

Personal site and project gateway. Plain HTML, CSS, and JavaScript — no build step,
no dependencies, no `npm install`.

```
index.html      all the content and copy
styles.css      all the styling (tokens at the top)
main.js         scroll reveal, sticky-header hairline, footer year
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
   specific hard problem lands better than adjectives. Delete the cards for
   projects you don't want to show.
3. **`<title>` and `<meta name="description">`** — this is what Google displays.
4. **`assets/resume.pdf`** — drop it in, or delete the Résumé button.
5. **LinkedIn URL** in the contact section — recruiters look for it.

Two things to know about the project cards:

- **Multithreaded Search** links to `github.com/Bryce-Hart1/multithread_Search`, which
  doesn't exist yet — that local repo has no remote. Push it or delete the card.
- Projects with no repo at all (`hackNC2025`, `swiftPin`, `learnRust`, `bstd`,
  `randomFileGenerator`) aren't on the site. Push the good ones and copy a card.

## Restyling

Everything visual is driven by the custom properties at the top of `styles.css`.
Changing `--accent` recolors the site. `--font-sans` and `--font-mono` currently use
the system stack, which costs nothing to load; swap in a webfont if you want more
personality.

The palette is earthy and there is exactly one of it — no light/dark toggle. Warm paper
background, umber text, terracotta accent, moss-green status dot. Two things keep it
coherent if you start changing colors:

- Nothing is a true grey. Every neutral carries a warm cast, so a stock `#888` will look
  conspicuously dead next to them.
- Shadows are tinted with the umber from `--text`, not black. Pure black over warm paper
  turns into a grey smudge.

`color-scheme: light` is declared so browsers don't render scrollbars and form controls
in dark chrome for visitors whose OS is set to dark mode.

If you change `--bg`, also update the `theme-color` meta tag in `index.html` — it colors
the browser UI on mobile.

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
