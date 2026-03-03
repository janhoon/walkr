# Changelog

## [0.4.0](https://github.com/janhoon/walkr/compare/core-v0.3.0...core-v0.4.0) (2026-03-03)


### Features

* **core:** add cursor preset names to shape union ([9e90422](https://github.com/janhoon/walkr/commit/9e9042230c7a2ef21f63c6a5665d4d424e3a64e7))

## [0.3.0](https://github.com/janhoon/walkr/compare/core-v0.2.0...core-v0.3.0) (2026-03-03)


### Features

* add --port flag and deterministic step IDs ([#471](https://github.com/janhoon/walkr/issues/471), [#472](https://github.com/janhoon/walkr/issues/472)) ([#24](https://github.com/janhoon/walkr/issues/24)) ([903eac2](https://github.com/janhoon/walkr/commit/903eac25d5dce6abfc68d00c4536f40652c31538))
* add audio narration step ([#469](https://github.com/janhoon/walkr/issues/469)) ([#23](https://github.com/janhoon/walkr/issues/23)) ([a6edf42](https://github.com/janhoon/walkr/commit/a6edf42e6b1a0ea4cd0707b2db78ef640ae90bb8))
* add drag step type definitions ([ff0add6](https://github.com/janhoon/walkr/commit/ff0add68856c802e9bf01830e0be3cac0a0bcf4d))
* add drag() step builder function ([6abb341](https://github.com/janhoon/walkr/commit/6abb341b44d2c3da00398b616bc4bcb6d447b297))
* add tooltip/annotation step ([#468](https://github.com/janhoon/walkr/issues/468)) ([#22](https://github.com/janhoon/walkr/issues/22)) ([1efa638](https://github.com/janhoon/walkr/commit/1efa638fc288ef56e7bbbe3e7c9336e1b28914e7))
* add waitForSelector and waitForNavigation steps ([#463](https://github.com/janhoon/walkr/issues/463)) ([#18](https://github.com/janhoon/walkr/issues/18)) ([99f55e7](https://github.com/janhoon/walkr/commit/99f55e74f0f1e5463c73049d9939182242a9b0b3))

## [0.2.0](https://github.com/janhoon/walkr/compare/core-v0.1.0...core-v0.2.0) (2026-02-28)


### Features

* [#437](https://github.com/janhoon/walkr/issues/437) @walkr/core scripting API — moveTo, click, type, scroll, zoom, pan, highlight, sequence, parallel ([6b5f083](https://github.com/janhoon/walkr/commit/6b5f083ff01966c4eee6e6eb5f6af9c810a1a246))
* [#438](https://github.com/janhoon/walkr/issues/438) @walkr/engine — cursor overlay, bezier movement, step executor, WalkrPlayer ([#1](https://github.com/janhoon/walkr/issues/1)) ([0f323d1](https://github.com/janhoon/walkr/commit/0f323d184122279667a08504c441680bd06158dd))
* [#439](https://github.com/janhoon/walkr/issues/439) @walkr/studio — React timeline viewer, step blocks, playback controls, step editor panel ([#2](https://github.com/janhoon/walkr/issues/2)) ([d3d0689](https://github.com/janhoon/walkr/commit/d3d068924931b1349b35477251260fd29ce2acbc))
* **@walkr/engine,@walkr/core:** zoom+follow, pan easing, cursor config — shape/color/size/svg/scroll indicator ([9030ae4](https://github.com/janhoon/walkr/commit/9030ae4463a73a9dbc917111976a6b780012985f))
* **@walkr/engine,@walkr/playwright:** spotlight highlight with backdrop, enhanced iframe embed player ([f941d45](https://github.com/janhoon/walkr/commit/f941d4579f31b7b57d164fe4acb2afb3f3aa6c8f))
* add clearCache step type and replace cursor with pointer SVG ([e057952](https://github.com/janhoon/walkr/commit/e057952ee7d7999b03282a0089ad2b64c00082c1))
* monorepo scaffold — pnpm workspaces, 5 packages, TypeScript config ([5fab145](https://github.com/janhoon/walkr/commit/5fab1453bd94099a6b36ec0a6c056c8b4fe25fea))
* npm publish prep — @walkr/core and @walkr/cli READMEs, create-walkr scaffold, root README ([1c9b9a9](https://github.com/janhoon/walkr/commit/1c9b9a91013197cb1ade38ea38e4d8039744e8ba))
* replace ESLint/Prettier with Biome, add Knip for dead code detection ([18cc154](https://github.com/janhoon/walkr/commit/18cc1549d7b89983467ba2e5d0e30b4bce187f3c))
* selector-based element targeting, live HMR updates, dev workflow ([f964434](https://github.com/janhoon/walkr/commit/f964434e34cf8e38481a79ff6d489958accdff0d))
* viewport scaling, reverse proxy for same-origin iframe, ace-demo example ([ad89f01](https://github.com/janhoon/walkr/commit/ad89f011c39f8087a646cee149399d3702c30962))
* wire up Export button dropdown and add cursor hotspot offset ([82b894b](https://github.com/janhoon/walkr/commit/82b894b405110d71eb1543177707cccdf8f661e4))
