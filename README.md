# Cambio Claro · Best Exchange Rates Paraguay

A city-first Spanish exchange-rate comparison and calculator. Plain HTML/CSS/JS, no build step, production dependencies, ads, tracking or secret keys.

## Run and test

Node 22.22.2+, 24.15+ or 26+; Python3 for local HTTP.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:8000. Optional Playwright browser regression: `node tests/browser.cjs` with `BROWSER_EXECUTABLE` if using system Chromium. Fixtures are historical test data, never production fallback quotes.

## Coverage and data

- `providers.js` contains the 23 houses in the BCP supervised-entity register dated 2026-03-20, with official URLs and conservatively verified city coverage. This is not a census of informal traders or a guarantee of exhaustive branches. Source URLs accompany city records.
- City selection filters both real quote rows and the official-link directory. Houses without automatic prices appear only in the directory, not as fake rate rows.
- Norte uses currency-specific public pages and seven explicitly named city rows. Salto/Saltos del Guairá is normalized to the same city; the branch label preserves the source.
- Bonanza, Alberdi, Fe, Ita, Fénix, Fortuna, Valor, Río Paraná, Triple C, Mercosur and Uno adapters retain branch-specific quotes and published source labels. Twelve automatic providers including Norte are configured; the directory includes all 23 registered houses. Availability varies by city/currency and source response. Paraná Country maps to Hernandarias, not Ciudad del Este. Distinct branches within the same city remain distinct.
- Public pages are read through Jina Reader. Source caches, availability, publication dates and layouts are external dependencies. Retrieval time is never claimed as source update time. No bypasses or private endpoints are used.
- PYG periods group thousands and commas mark decimals: `7.300` means 7300, not 7.3. Non-positive, malformed, duplicate, crossed-currency and inverted prices fail closed.
- Compra means the house buys the user's currency; Venta means it sells. Cards are sorted by highest buy or lowest sell among available readings, not a market-wide best-price guarantee.
- A 60-second in-memory raw-page cache reduces repeated Jina reads when changing city/currency. Cached quotes keep the actual network retrieval timestamp. Explicit Actualizar bypasses this cache; errors are not cached.
- Three source workers run concurrently, with 12-second per-source and 45-second overall time limits. Río Paraná, Triple C, Mercosur and Uno reject timestamps older than four days or materially in the future, and Mercosur conflicting duplicate rows are omitted rather than guessed.
- Rates render progressively as sources respond. Request generation and abort handling prevent older city/currency requests replacing the current selection. Previous readings are isolated by provider/currency/city and visibly labeled; they do not drive automatic calculations after refresh failure. No rate data is persisted between sessions.
- Manual calculator rates are explicitly user-entered and reset on city/currency/operation changes. Calculation happens locally and excludes fees.

See [DATA-SOURCES.md](DATA-SOURCES.md) for remaining provider-specific limitations.

## Privacy and methodology

No ads or analytics. The calculator amount is never sent externally. Public-page retrieval sends ordinary browser connection metadata to Jina. Source/methodology/privacy explanations are collapsed under the footer details, rather than repeated warning banners. Norte's testing notice is linked there. Before commercial monetization, source terms and data access must be reviewed.

## Release

`master` and `gh-pages` have independent existing histories. Commit source on master and production assets on existing gh-pages as normal fast-forward commits, without force-push, new branches or unrelated-history merges. Production assets: `index.html`, `style.css`, `script.js`, `rates.js`, `providers.js`, `adapters.js`, `source-fetch.js`, `adapters-extra.js`. Do not publish fixtures or dev tooling. Verify remote heads, Pages build and live hashes for all assets before reporting deployment complete.

## Decision-first comparison

City, currency, operation and amount are entered before the results. The best published available quote is calculated independently from the optional reference calculator. Every comparison row includes the amount, difference from best and relevant house-side rate. Equal rates are explicitly tied; failed-source previous readings never compete. Changing amount or operation does not fetch data. Amounts and differences are displayed to at most two decimals; nonzero differences below 0.01 PYG are labeled rather than displayed as zero. Fees are unknown and not included in the estimates.

`branch-locations.js` matches exact source, branch and city identities. It contains selective official branch addresses and official map/directions URLs; unsupported branches link to the official source instead. Search-index-only addresses are not rendered. No location permission, map embed or guessed pin is used. Include `comparison.js` and `branch-locations.js` in production assets.
