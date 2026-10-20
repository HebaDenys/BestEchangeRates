# Cambio Claro · Best Exchange Rates Paraguay

A city-first Spanish exchange-rate comparison and calculator. Plain HTML/CSS/JS, no build step, production dependencies, ads, tracking or secret keys.

## Run and test

Node 22.22.2+, 24.15+ or 26+; Python3 for local HTTP.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:8000. Fixtures are historical test data, never production fallback quotes.

### Real-browser E2E

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright starts a separate HTTP server on 127.0.0.1:8766 and runs the deterministic Chromium journeys on desktop and mobile, using the real app modules and browser events. The browser sandbox stays enabled. A restricted executor that cannot launch sandboxed Chromium must use a supported runner, not disable browser or OS security. The GitHub Actions workflow runs the unit/JSDOM checks and real-browser suite separately with read-only repository permissions; failure screenshots/traces are retained for seven days.

The deterministic suite intercepts every provider request, so the deterministic job never hits live rate providers. A separate bounded browser transport smoke makes one public request per new source. It exercises the original and expanded adapters, four currencies, city isolation, buy/sell sorting, ties, tiny differences, invalid/fractional/large amounts, manual references, cache and forced refresh, previous readings, failures/recovery, request races, keyboard controls, official-link safety and 320px layouts. Date alone is fixed to the fixture capture period; timers are real. Alberdi branch variants are explicitly synthetic routing fixtures, not evidence of real branch prices. No mocked rate becomes a production fallback.

Optional bounded published-site smoke: `npm run test:e2e:live`. This performs one initial Asunción lookup, checks that loading settles without JavaScript errors and accepts an honestly displayed provider outage. It does not assert that current rates equal historical fixtures. Local browser reports are in `playwright-report/` (ignored by git).

## Coverage and data

- `providers.js` contains the 23 houses in the BCP supervised-entity register dated 2026-03-20, with official URLs and conservatively verified city coverage. This is not a census of informal traders or a guarantee of exhaustive branches. Source URLs accompany city records.
- City selection filters both real quote rows and the official-link directory. Houses without automatic prices appear only in the directory, not as fake rate rows.
- Norte uses currency-specific public pages and seven explicitly named city rows. Salto/Saltos del Guairá is normalized to the same city; the branch label preserves the source.
- Bonanza, Alberdi, Fe, Ita, Fénix, Fortuna, Valor, Río Paraná, Triple C, Mercosur and Uno adapters retain branch-specific quotes and published source labels. Sixteen automatic house adapters including Norte are configured, plus four bank adapters; the directory includes 23 registered houses and 16 banks. Availability varies by city/currency and source response. Paraná Country maps to Hernandarias, not Ciudad del Este. Distinct branches within the same city remain distinct.
- Most public pages are read through Jina Reader; Más uses its public CORS-enabled JSON endpoint. Source caches, availability, publication dates and layouts are external dependencies. Retrieval time is never claimed as source update time. No bypasses or private endpoints are used.
- PYG periods group thousands and commas mark decimals: `7.300` means 7300, not 7.3. Non-positive, malformed, duplicate, crossed-currency and inverted prices fail closed.
- Compra means the house buys the user's currency; Venta means it sells. Cards are sorted by highest buy or lowest sell among available readings, not a market-wide best-price guarantee.
- A 60-second in-memory raw-page cache reduces repeated Jina reads when changing city/currency. Cached quotes keep the actual network retrieval timestamp. Explicit Actualizar bypasses this cache; errors are not cached.
- Three source workers run concurrently, with 12-second per-source and 45-second overall time limits. Río Paraná, Triple C and Mercosur reject timestamps older than four days or materially in the future, and Mercosur conflicting duplicate rows are omitted rather than guessed.
- Rates render progressively as sources respond. Request generation and abort handling prevent older city/currency requests replacing the current selection. Previous readings are isolated by provider/currency/city and visibly labeled; they do not drive automatic calculations after refresh failure. No rate data is persisted between sessions.
- Manual calculator rates are explicitly user-entered and reset on city/currency/operation changes. Calculation happens locally and excludes fees.

See [DATA-SOURCES.md](DATA-SOURCES.md) for remaining provider-specific limitations.

## Privacy and methodology

No ads or analytics. The amount is calculated locally and not sent to quote providers. A user-created share URL contains the amount and filters; recipients and the site host can see that URL. Only city and currency preferences are stored locally. Public-page retrieval sends ordinary browser connection metadata to Jina. Source/methodology/privacy explanations are collapsed under the footer details, rather than repeated warning banners. Norte's testing notice is linked there. Before commercial monetization, source terms and data access must be reviewed.

## Release

`master` and `gh-pages` have independent existing histories. Commit source on master and production assets on existing gh-pages as normal fast-forward commits, without force-push, new branches or unrelated-history merges. Production assets: root HTML/CSS, application JS modules, `ciudades/*.html`, `sitemap.xml`, and `robots.txt`. Do not publish fixtures or dev tooling. Verify remote heads, Pages build and live hashes for all assets before reporting deployment complete.

## Decision-first comparison

City, currency, operation and amount are entered before the results. The best published available quote is calculated independently from the optional reference calculator. Every comparison row includes the amount, difference from best and relevant house-side rate. Equal rates are explicitly tied; failed-source previous readings never compete. Changing amount or operation does not fetch data. Amounts and differences are displayed to at most two decimals; nonzero differences below 0.01 PYG are labeled rather than displayed as zero. Fees are unknown and not included in the estimates.

`branch-locations.js` matches exact source, branch and city identities. It contains selective official branch addresses and official map/directions URLs; unsupported branches link to the official source instead. Search-index-only addresses are not rendered. No location permission, map embed or guessed pin is used. Include `comparison.js` and `branch-locations.js` in production assets.

## Expanded coverage and channels

New house adapters: Oriente (8 identified branch boards), Maxi and M&D (Asunción/CDE city boards only), Más (15 explicitly mapped branch endpoints; availability varies). These publishers do not explicitly identify the execution channel, so their quotes remain `unspecified`, not assumed cash. Euro has a tested parser but no active browser-compatible transport; it is not counted as an automatic feed.

Atlas, Ueno, Familiar and Solar retain each source's explicit channel, null/N/A sides and unknown publication times. Bank publications have no city assigned and rank separately from local houses. App, online, cash, transfer, cheque, combined cheque/transfer and unspecified channels never share a ranking. Ueno only publishes USD/EUR in the validated source.

`selection.js` validates share filters; explicit valid URL parameters override saved city/currency, then defaults. Amount/operation/channel are not persisted. `ciudades/build.mjs` regenerates three static city guides from verified directory data; `node --test ciudades/test.mjs` checks metadata, links and directory coverage. These guides contain no hardcoded current prices.

Fixture contracts name expected branches/currencies, including known missing or stale rows, and test deliberate removal mutations. They detect parser/fixture drift, not perpetual completeness of live providers. The bounded live transport smoke checks browser CORS and public content separately, with no fixed price assertions. External outages fail that smoke honestly. The static app still depends on third-party rate limits and cannot guarantee all sources respond in one lookup.
