# Public source coverage

Checked 2026-10-20. Directory: 23 supervised exchange houses in the linked BCP register. Automatic adapters: 12 houses, not every branch or every currency at every location. No inaccessible source is represented by synthetic prices.

## Automatic prices

Norte, Bonanza, Alberdi, Fe, Ita, Fénix, Fortuna, Uno, Valor, Río Paraná, Triple C and Mercosur.

Each adapter preserves branch, city, published update text and retrieval time. Missing, conflicting, malformed or unverified rows are omitted. Río Paraná, Triple C and Mercosur additionally omit fully dated records older than four days or materially in the future. This filter is not a guarantee of execution price or cash availability.

## Official links only

- Chaco, La Moneda, Yrendague and Mundial: public retrieval was blocked. No access restriction was bypassed.
- Euro: no quote table found on the examined public page.
- MaxiCambios: the public text representation mixes city tabs and duplicate instrument rows; no safe city-specific adapter yet.
- M & D: some currency identities are lost in the text representation.
- Oriente: public widget and branch labels need a reliable mapping before assigning rates to cities.
- Santa Rita: maintenance/loading placeholders, not usable rates.
- Ceteg: the inspected quote flow requires an application-token header; no token-dependent request was made.
- Más Cambios: a public endpoint exists, but browser transport and publication-time interpretation need verification.

Official URLs and verified city-location sources are in `providers.js`. Directory presence means a verified house/location, not an automatic quote. Unsupported branches remain on the official source website. The page does not claim to cover all informal street traders or guarantee the best price in the country.
