# Deluxe Locksmiths MD

Static HTML website for Deluxe Locksmiths, a locksmith service business serving Maryland.

## Structure

```
.
├── index.html            # Home page
├── main.js               # Site JavaScript
├── styles.css            # Site styles
├── about/                # About page
├── faq/                  # FAQ page
├── blog/                 # Blog posts
├── services/             # Service pages
├── service-areas/        # Location/service-area pages
├── privacy-policy/       # Privacy policy page
├── terms-of-service/     # Terms of service page
├── assets/               # Images and static assets
├── lib/                  # Third-party libraries
├── sitemap.xml           # XML sitemap
├── robots.txt            # Crawler rules
└── .htaccess             # Apache server config
```

## Development

This is a static site with no build step. Open `index.html` directly in a browser, or serve the directory with any static file server, e.g.:

```
npx serve .
```

### Local server

Site runs at **http://localhost:47821**.

A `serve-deluxe` shell alias is set up (in `~/.zshrc`) with live-reload via browser-sync — it watches `.html`, `.css`, and `.js` files and auto-refreshes the browser on save:

```
serve-deluxe
```

Press `Ctrl+C` to stop it. To start it manually without the alias:

```
cd /Users/cliftoncanady/web-apps/Yanir-websites/Websites/deluxe-locksmiths-md
npx --yes browser-sync start --server --files "**/*.html, **/*.css, **/*.js" --port 47821 --no-open
```
