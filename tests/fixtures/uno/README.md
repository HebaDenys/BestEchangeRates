# Uno official public branch snapshots

Captured 2026-10-20 around 11:31–11:33 UTC.

- home-2026-10-20.html: https://unocambios.com.py/
- branches-2026-10-20.html: https://unocambios.com.py/sucursales
- branch-N.html: https://unocambios.com.py/modelos.php?cotizacion&id_sucursal=N, obtained through the existing Reader transport with X-Return-Format: html. This exact public GET is used by the official homepage selector.

Sixteen selector IDs and eight city mappings are verified by the official homepage and branch directory. Seven real quote response snapshots are saved (1, 2, 3, 7, 8, 15, 18). Other requests returned HTTP 429 during capture; this fixture set does NOT prove successful live retrieval of every branch. No missing fixtures or prices were fabricated. Browser CORS OPTIONS preflight for the HTML transport returned HTTP 200 and explicitly allowed x-return-format.

The branch quote fragments do not expose publication dates. The homepage date remains unchanged when selecting PJC even though its prices differ materially from Matriz; therefore all branch response quotes deliberately use unknown publication dates, not the homepage date or retrieval timestamp. Branch 7 publishes only USD and BRL in its saved response; absent EUR/ARS quotes must stay absent.

Homepage and directory evidence is intentionally sanitized: only the official selector and visible directory text are retained. External scripts, tracking embeds, forms and API-key-bearing map code are not part of these fixtures.
