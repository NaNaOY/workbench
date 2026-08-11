# Design QA — 期货面板指数布局、六氟入口与日 K

- source visual truth: `.design-qa/futures-watchlist-overflow-source.png`
- implementation screenshot: `.design-qa/futures-kline.png`
- focused implementation screenshots: `.design-qa/futures-watchlist-fixed.png`, `.design-qa/futures-kline-panel.png`
- combined comparison artifact: `.design-qa/futures-watchlist-comparison.png`
- viewport: Electron desktop content viewport `1440 x 816` CSS px at Windows `1.25` device scale
- pixels and normalization: full implementation `1800 x 1020` px; focused source `288 x 82` px and focused implementation `322 x 97` px are shown at native scale in a `700 x 160` px side-by-side canvas
- state: 新能源指数 `000941` selected, real daily K tab selected, live quote loaded

## Full-view comparison evidence

- The full Electron capture confirms the status bar, seven-contract watchlist, selected market chart and risk rail remain in the existing WorkBench three-column terminal.
- At 1440 CSS px the terminal measured `1134.8 x 572.6` px; all seven rows rendered and document-level horizontal overflow was false.
- At 1080 CSS px the terminal collapsed to one column, the watchlist became two columns and document-level horizontal overflow remained false.
- The daily K state shows `120` real trading days, candle bodies, price axis, threshold lines and summary values without shifting the surrounding layout.

## Focused-region comparison evidence

- Layout: the before/after artifact shows `000941` previously crossing the left edge; after the grid and code-chip adjustments, both code and price bounds are fully contained in the row.
- Typography: the six-digit index code now uses a compact 10 px weight and controlled letter spacing; the contract name and quote retain their original scan hierarchy.
- Spacing: the watch row uses a content-sized code column, flexible contract-copy column and a minimum 64 px quote column; no text overlaps or clips.
- Colors: the amber code chip, indigo selected outline and red/green quote semantics remain mapped to the existing futures palette with readable contrast.
- Image quality: the changed area has no photographic assets; existing Lucide icons are retained and no placeholder illustration was added.
- Copy: the new `六氟价格` action names its destination and exposes a descriptive title; the daily tab clearly states `120 个真实交易日`.

## Primary interactions tested

- Loaded 7/7 quotes through the Electron main-process API.
- Selected 新能源指数 and verified `000941` plus the quote are fully contained in the selected row.
- Selected `日 K` and verified `120` candle bodies and the chart SVG rendered.
- Verified the `六氟价格` action is present with title `查看上海有色网六氟磷酸锂现货价格`.
- Switched contracts, opened the custom alert form and verified the primary flow still works.
- Checked 1440 and 1080 layouts for horizontal overflow.
- Checked renderer console output; only Electron's expected unpackaged CSP warning appeared.

## Findings

- No actionable P0, P1 or P2 visual, interaction, accessibility or responsive issues found.
- P3: the existing production bundle remains above Vite's 500 kB advisory threshold; route-level lazy loading can be handled later.

## Comparison history

1. The supplied issue screenshot identified a P1 watch-row overflow: `000941` extended beyond its chip/card.
2. The watch-row grid, code-chip sizing and price-column constraints were corrected.
3. The revised selected row was captured and placed with the source in `.design-qa/futures-watchlist-comparison.png`; the code and price bounds are now contained.
4. A final Electron pass verified the real daily K state, six-fluorine price action, contract switching and responsive layouts.

final result: passed