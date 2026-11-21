# 100% Juice — static site

Plain HTML/CSS/JS. No frameworks, no build step. Everything the site serves lives in
this `docs/` folder, so the repo root keeps its `data/`, `artwork/`, and `scripts/`
directories untouched.

```
docs/
  index.html            # landing page (banner: img/juice-banner.png)
  products.html         # sticker grid + cart + checkout
  projects.html         # projects showcase
  donate.html           # Venmo QR
  rename.html           # PRIVATE rename tool — sticker name contact sheet (not in the nav)
  css/style.css         # shared styles (dark vaporwave theme — see palette notes below)
  js/app.js             # shared nav / cart / checkout logic
  js/products-data.js   # product list (PLACEHOLDER names, $0.00 prices — edit me!)
  js/rename.js          # rename tool logic for rename.html
  img/juice-banner.png  # home hero banner artwork (5:1 shirt print)
  img/juice-banner-alt.png # alternate banner artwork
  img/venmo-qr.png      # Venmo QR image
  img/products/*.png    # one proof image per artwork uuid
```

## Theme / palette

The site uses a **dark vaporwave** palette defined as CSS variables at the top of
`css/style.css`. There is no light theme any more — everything is neon-on-near-black:

| Token      | Value     | Use                                  |
| ---------- | --------- | ------------------------------------ |
| `--bg`     | `#0d0221` | page background (near-black purple)  |
| `--text`   | `#f0f0f5` | body copy (kept light for contrast)  |
| `--pink`   | `#ff2bd6` | primary neon accent / buttons        |
| `--pink-soft` | `#ff71ce` | headings, hover glows             |
| `--cyan`   | `#01cdfe` | secondary accent, links, borders     |
| `--purple` | `#b967ff` | gradients, card borders              |
| `--yellow` | `#f5d300` | sparing highlight (badges, totals)   |

Neon colours are used for borders, glows, headings, and button fills only — never
for body text — so contrast stays readable. A faint CSS perspective grid and a
hero sunburst glow give the retro look without any images.


## Publish with GitHub Pages

1. Push this repo to GitHub.
2. Open the repo → **Settings** → **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set the branch to **main** and the folder to **/docs**, then **Save**.
5. After a minute your site is live at `https://<username>.github.io/<repo>/`.

## Custom domain (fixes the browser "Not secure" warning)

The "not secure" warning happens when the site is served over plain `http://` or when
GitHub Pages hasn't finished issuing the TLS certificate. Do both steps below, then turn
on HTTPS.

### DNS records to add in GoDaddy (apex domain, e.g. `100percentjuice.com`)

Add four **A** records, all with host/name `@`, pointing at GitHub Pages:

| Type | Name | Value             |
| ---- | ---- | ----------------- |
| A    | @    | 185.199.108.153   |
| A    | @    | 185.199.109.153   |
| A    | @    | 185.199.110.153   |
| A    | @    | 185.199.111.153   |

Add one **CNAME** record for the `www` subdomain:

| Type  | Name | Value                     |
| ----- | ---- | ------------------------- |
| CNAME | www  | `<username>.github.io`    |

> Replace `<username>` with your actual GitHub username. In GoDaddy, "Name" is
> sometimes shown as "Host" — enter `@` for the root and `www` for the subdomain.

### Custom domain + HTTPS inside GitHub

1. Settings → **Pages** → **Custom domain**: enter your domain and **Save**
   (this writes a `CNAME` file and starts certificate provisioning).
2. Wait for DNS to propagate and GitHub to issue the certificate (can take up to 24h).
3. Once it's ready, tick **Enforce HTTPS**. This is the fix for the
   "not secure" warning in the browser — it forces all traffic to `https://`.

## Editing products

`js/products-data.js` is auto-generated from the original StickerMule orders. The
**names are placeholders** and every **price is `$0.00`**. Two ways to edit:

1. Open `js/products-data.js` and change `displayName`, `description`, and `price`
   by hand. `img` points at `img/products/<uuid>.png`; keep the uuid the same
   unless you also rename the image.
2. Or use the **private rename tool** at `rename.html`. It shows every sticker
   image next to its current name, lets you type the real name/description, and
   generates a corrected `products-data.js` you can copy and paste back over the
   file. It is intentionally **not linked in the site nav** — just open
   `rename.html` directly (e.g. `http://localhost:8931/rename.html`).
