# Decision-first iteration · 2026-10-20

Research preceded implementation. The goal is to answer “where should I change this amount?” without requiring users to remember rates or confuse a personally selected reference with the best available quote.

- [Nielsen Norman Group, usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): user-language operations, visible loading/source state, recognition rather than recall. Applied to Recibís/Pagás, local input validation and progressive results.
- [Baymard, comparison features](https://baymard.com/research-articles/provide-comparison-features): compare common attributes side by side. Applied to total, difference, relevant rate and location in each compact row.
- [Wise, comparison](https://wise.com/gb/compare/): focus on outcome rather than a rate alone. Our sources do not expose reliable fees, so totals explicitly remain estimates before commissions, not guaranteed net proceeds.
- [Luke Wroblewski, Mobile First](https://www.lukew.com/mobilefirst/02-introduction/index.html): prioritize the primary task on small screens. Unified controls precede results; mobile rows keep labels and use two columns without horizontal scrolling.
- [Monzo, tone of voice](https://monzo.com/tone-of-voice): familiar, direct wording instead of unexplained institutional terms. House compra/venta remains secondary explanation.

Green/cream identity retained. Price quality is communicated with a textual best badge, not color alone. Native controls, visible focus, semantic table headers and collapsed details preserve keyboard/screen-reader access. Source timestamps remain distinguishable from provider update times. Optional reference calculations never enter the ranking. No ads or tracking added.

Location provenance lives beside each exact branch entry. Links are provider-published; unsupported branches fall back to official pages, never synthesized pins or presumed headquarters.
