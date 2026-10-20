# Cambio Claro · Best Exchange Rates Paraguay

A lightweight Spanish-language exchange-rate reference for Asunción. Plain HTML, CSS and JavaScript modules; no build step, production dependencies, tracking, advertising or secret API keys.

## Run and test

Requires Node 22.22.2+, 24.15+ or 26+ for tests; Python 3 for the local server.

```sh
npm ci
npm run check
npm start
# Open http://localhost:8000 (ES modules need HTTP, not file://).
```

`npm run check` checks JS syntax and the Node test suite. Tests use captured public-source fixtures, never silently fall back to made-up production data. Fixture values are historical test inputs, not current rates.

Optional browser regression: install Playwright in the development environment, start the local server, then run `node tests/browser.cjs`. The harness intercepts source requests with fixtures and tests buy/sell calculations, four currencies, invalid amounts, interrupted requests, errors, previous-session readings, recovery and mobile overflow. Set `BROWSER_EXECUTABLE` to the Chromium executable if not using Playwright's bundled browser. This does not send calculator amounts to an external site.

## Data model and reliability

- Preserves the newer `gh-pages` Norte Cambios integration, replacing its USD-only, first-row parser with verified currency-specific endpoints: `https://www.nortecambios.com.py/currency/USD` (also EUR, BRL and ARS).
- Only the explicitly named **Asunción** row is used. The homepage defaults to Pedro Juan Caballero and is not a valid substitute for Asunción. The earlier homepage parser is retained with regression tests but is not used by the app.
- Jina Reader provides a browser-readable public-page representation. The full HTTPS target URL is preserved. Proxy caching, downtime and future source-layout changes remain dependencies; an approved first-party API or backend should replace this before a serious commercial launch.
- Paraguayan rates use periods for thousands and commas for decimals. `7.300` means 7300 PYG, not 7.3. Malformed, negative, zero, ambiguous, duplicate, cross-currency and inverted quotes fail closed.
- “Compra” means the house buys the user's foreign currency; “Venta” means the house sells it. Both amounts in the calculator are foreign-currency units, multiplied by the applicable PYG/unit rate. Fees are not included.
- Retrieval time and source update text are distinct. Missing publication time is explicitly unknown. No timestamp is fabricated. A successful fetch does **not** prove a quote is up to date.
- On failure, a same-currency prior reading may remain visibly labeled for this tab's session, but cannot automatically drive the calculator. An explicitly labeled manual-rate mode remains available offline. No rates are persisted to local storage. Switching currencies aborts the older request; late responses cannot replace the selected currency.
- Current source warning: [Norte's notice](https://www.nortecambios.com.py/centro-de-avisos/1) says its site is in testing and Asunción quotes may be affected. The UI prominently repeats this and advises confirmation with the cashier.
- One active house is **not a best-price market comparison**. Placeholder Continental/Casa de Cambio adapters from master are removed from execution, not replaced with fabricated data. Original code remains in Git history.

## Privacy and commercial readiness

The amount is processed only locally. Rate retrieval connects the visitor's browser to Jina Reader; standard connection information, including IP address, may be visible to that provider. Source pages and links follow their own policies. No analytics, ad scripts or automatically loaded third-party iframes are embedded.

Before monetization: verify source reuse/terms and commercial data access, add more verified Asunción providers, establish uptime/source freshness monitoring, review privacy disclosures against the exact deployment, and configure any advertising account/consent implementation separately. No advertising approval or revenue is promised. Do not insert fake publisher IDs, claims of guaranteed best rates, or stale sample rates as live data.

## Repository and release

The actual source branch is `master`. Existing GitHub Pages publishes the independent, orphan-history `gh-pages` branch. Do not merge these unrelated histories or force-push. For an authorized release, commit source to master, then copy the four production files (`index.html`, `style.css`, `script.js`, `rates.js`) onto the existing gh-pages history and commit normally. Do not publish fixtures or development tooling to the site. Verify live file hashes after Pages builds before reporting deployment complete.

The UI is usable without external CSS/font/CDN requests. JavaScript and the rate-source request are required for live calculations.
