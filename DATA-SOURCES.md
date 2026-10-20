# Public source coverage

Checked 2026-10-20. Directory: 23 supervised exchange houses in the linked BCP register. Automatic adapters: 16 houses plus four banks, not every branch or every currency at every location. No inaccessible source is represented by synthetic prices.

## Automatic prices

Norte, Bonanza, Alberdi, Fe, Ita, Fénix, Fortuna, Uno, Valor, Río Paraná, Triple C, Mercosur, Oriente, Maxi, M&D and Más.

Each adapter preserves branch, city, published update text and retrieval time. Missing, conflicting, malformed or unverified rows are omitted. Río Paraná, Triple C and Mercosur additionally omit fully dated records older than four days or materially in the future. This filter is not a guarantee of execution price or cash availability.

## Official links only

- Chaco, La Moneda, Yrendague and Mundial: public retrieval was blocked. No access restriction was bypassed.
- Euro: public per-currency JSON parser tested; cross-origin POST transport is not integrated. Remains official link only.
- Santa Rita: maintenance/loading placeholders, not usable rates.
- Ceteg: inspected quote flow requires an application-token header; no token-dependent request was made.

## Newly integrated source limits

- Oriente: eight mapped quote boards across four cities; Vendome directory entry has no board.
- Maxi and M&D: Asunción/CDE city boards only, not every office or directory city.
- Más: fifteen mapped endpoints queried in city-filtered bounded batches. Response time is not publication time, which remains unknown.
- All four new houses retain unspecified channel; no assumed cash classification.
- Oriente/Maxi dates omit timezone. Their conservative cutoff considers the possible civil-time range; publication labels explicitly retain timezone uncertainty.
- Banks Atlas/Ueno/Familiar/Solar are public bank publications without verified city-specific prices. Channels remain distinct and N/A prices remain unavailable. No publication time is invented. The 16-bank directory is separate from these four feeds.
- House directory now includes 26 verified cities, but this is not 26 cities with automatic prices. Uno extra cities and offices are directory evidence only. Additional Alberdi/Norte/Triple C branch coverage remains unresolved, not silently filled.

Official URLs and verified city-location sources are in `providers.js`. Directory presence means a verified house/location, not an automatic quote. Unsupported branches remain on the official source website. The page does not claim to cover all informal street traders or guarantee the best price in the country.

## Visual audit follow-up

Uno: 16 mapped individual branch endpoints in eight cities, not a shared headquarters rate. Seven authentic branch-response snapshots tested; other transport responses are not assumed successful. Unknown publication times remain explicit.

Geographic inventory: 26 house-directory cities plus 51 bank-directory cities, 56 distinct selector cities. Bank cities are presence/service evidence only. Current house adapters are configured for 16 cities; absent/stale/zero source quotes remain excluded.

The visual audit observed intermittent missing sources and older Reader snapshots. Documented Reader freshness headers, longer bounded timeouts, fair scheduling and per-source diagnostics now address these failure modes; they do not guarantee external-source uptime. Triple C's San Miguel/Shopping Dubai city mapping remains unresolved; Norte direct visual navigation was unavailable during the audit, so no exhaustive visual certification is claimed.
