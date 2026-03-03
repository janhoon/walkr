# Changelog

## [0.4.2](https://github.com/janhoon/walkr/compare/engine-v0.4.1...engine-v0.4.2) (2026-03-03)


### Bug Fixes

* **cli:** rebuild with cursor preset support from engine ([ed0cf33](https://github.com/janhoon/walkr/commit/ed0cf33fa4b2722a56b6af8f8a13db2180193511))
* **engine:** use CursorShape type alias from core ([3e14079](https://github.com/janhoon/walkr/commit/3e14079645d8be56ca96142332ee7b57a2ed0d25))
* **recorder:** rebuild with cursor preset support from engine ([638bf2a](https://github.com/janhoon/walkr/commit/638bf2a544824bea5e222f5e56edb678f364152e))
* **studio:** rebuild with cursor preset support from engine ([5b83589](https://github.com/janhoon/walkr/commit/5b835894c7ba19ad56d480b0927950657fb3f001))

## [0.4.1](https://github.com/janhoon/walkr/compare/engine-v0.4.0...engine-v0.4.1) (2026-03-03)


### Bug Fixes

* **engine:** unexport unused CursorPreset interface ([501280c](https://github.com/janhoon/walkr/commit/501280c236a02d3565e31518839ae4c64fbb6780))

## [0.4.0](https://github.com/janhoon/walkr/compare/engine-v0.3.0...engine-v0.4.0) (2026-03-03)


### Features

* **engine:** add cursor preset registry with tests ([f913991](https://github.com/janhoon/walkr/commit/f9139913ea9f15325f9eedcb780c316e8954870e))
* **engine:** wire cursor presets into rendering pipeline ([b295cd6](https://github.com/janhoon/walkr/commit/b295cd6a0c9869f8b0fe31dd6670c4ed085d4a24))

## [0.3.0](https://github.com/janhoon/walkr/compare/engine-v0.2.1...engine-v0.3.0) (2026-03-03)


### Features

* add audio narration step ([#469](https://github.com/janhoon/walkr/issues/469)) ([#23](https://github.com/janhoon/walkr/issues/23)) ([a6edf42](https://github.com/janhoon/walkr/commit/a6edf42e6b1a0ea4cd0707b2db78ef640ae90bb8))
* add step error reporting and debug mode ([#465](https://github.com/janhoon/walkr/issues/465)) ([#20](https://github.com/janhoon/walkr/issues/20)) ([0b36d84](https://github.com/janhoon/walkr/commit/0b36d84ec474ed5686c1738828eaacc23a64b7a1))
* add tooltip/annotation step ([#468](https://github.com/janhoon/walkr/issues/468)) ([#22](https://github.com/janhoon/walkr/issues/22)) ([1efa638](https://github.com/janhoon/walkr/commit/1efa638fc288ef56e7bbbe3e7c9336e1b28914e7))
* add waitForSelector and waitForNavigation steps ([#463](https://github.com/janhoon/walkr/issues/463)) ([#18](https://github.com/janhoon/walkr/issues/18)) ([99f55e7](https://github.com/janhoon/walkr/commit/99f55e74f0f1e5463c73049d9939182242a9b0b3))
* implement executeDrag in engine ([2f764aa](https://github.com/janhoon/walkr/commit/2f764aa6331487096c2e93b586a742693b025527))
* re-export drag types from engine ([82c9646](https://github.com/janhoon/walkr/commit/82c96461034071518102e42c4c6a39be38f3ffb1))

## [0.2.1](https://github.com/janhoon/walkr/compare/engine-v0.2.0...engine-v0.2.1) (2026-02-28)


### Bug Fixes

* **engine:** normalize core dependency to workspace:^ for caret-range publishing ([8597ad7](https://github.com/janhoon/walkr/commit/8597ad712208fc50501315b9c36bfdb46d185fbb))

## [0.2.0](https://github.com/janhoon/walkr/compare/engine-v0.1.0...engine-v0.2.0) (2026-02-28)


### Features

* [#438](https://github.com/janhoon/walkr/issues/438) @walkr/engine — cursor overlay, bezier movement, step executor, WalkrPlayer ([#1](https://github.com/janhoon/walkr/issues/1)) ([0f323d1](https://github.com/janhoon/walkr/commit/0f323d184122279667a08504c441680bd06158dd))
* **@walkr/engine,@walkr/core:** zoom+follow, pan easing, cursor config — shape/color/size/svg/scroll indicator ([9030ae4](https://github.com/janhoon/walkr/commit/9030ae4463a73a9dbc917111976a6b780012985f))
* **@walkr/engine,@walkr/playwright:** spotlight highlight with backdrop, enhanced iframe embed player ([f941d45](https://github.com/janhoon/walkr/commit/f941d4579f31b7b57d164fe4acb2afb3f3aa6c8f))
* **@walkr/engine:** cursor overlay, bezier movement, click ripple, RAF playback engine ([f6ef959](https://github.com/janhoon/walkr/commit/f6ef9593d067361f67b0d1c8ce0695da49fb6868))
* add clearCache step type and replace cursor with pointer SVG ([e057952](https://github.com/janhoon/walkr/commit/e057952ee7d7999b03282a0089ad2b64c00082c1))
* monorepo scaffold — pnpm workspaces, 5 packages, TypeScript config ([5fab145](https://github.com/janhoon/walkr/commit/5fab1453bd94099a6b36ec0a6c056c8b4fe25fea))
* replace ESLint/Prettier with Biome, add Knip for dead code detection ([18cc154](https://github.com/janhoon/walkr/commit/18cc1549d7b89983467ba2e5d0e30b4bce187f3c))
* selector-based element targeting, live HMR updates, dev workflow ([f964434](https://github.com/janhoon/walkr/commit/f964434e34cf8e38481a79ff6d489958accdff0d))
* viewport scaling, reverse proxy for same-origin iframe, ace-demo example ([ad89f01](https://github.com/janhoon/walkr/commit/ad89f011c39f8087a646cee149399d3702c30962))
* wire up Export button dropdown and add cursor hotspot offset ([82b894b](https://github.com/janhoon/walkr/commit/82b894b405110d71eb1543177707cccdf8f661e4))


### Bug Fixes

* resolve all type-check, lint, and dead code issues ([bf55046](https://github.com/janhoon/walkr/commit/bf55046d15515de4ce94a511bda793f85aea060b))
