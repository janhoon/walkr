# Changelog

## [0.2.1](https://github.com/janhoon/walkr/compare/studio-v0.2.0...studio-v0.2.1) (2026-02-28)


### Bug Fixes

* **studio:** rename to @walkrstudio/studio to match existing npm scope ([818945e](https://github.com/janhoon/walkr/commit/818945e0c520431f6ff73f8bce42904d201fe27f))

## [0.2.0](https://github.com/janhoon/walkr/compare/studio-v0.1.0...studio-v0.2.0) (2026-02-28)


### Features

* [#439](https://github.com/janhoon/walkr/issues/439) @walkr/studio — React timeline viewer, step blocks, playback controls, step editor panel ([#2](https://github.com/janhoon/walkr/issues/2)) ([d3d0689](https://github.com/janhoon/walkr/commit/d3d068924931b1349b35477251260fd29ce2acbc))
* **@walkr/studio:** React + Vite studio app — timeline viewer, step blocks, playback controls, sidebar ([b3131fb](https://github.com/janhoon/walkr/commit/b3131fbd06627a012eca51800c515aa4054fd509))
* **@walkr/studio:** timeline editing — drag resize, drag reorder, CLI watcher, hot reload ([1a83b07](https://github.com/janhoon/walkr/commit/1a83b071a73c7467c43ff574c717ecebea7c6275))
* add clearCache step type and replace cursor with pointer SVG ([e057952](https://github.com/janhoon/walkr/commit/e057952ee7d7999b03282a0089ad2b64c00082c1))
* monorepo scaffold — pnpm workspaces, 5 packages, TypeScript config ([5fab145](https://github.com/janhoon/walkr/commit/5fab1453bd94099a6b36ec0a6c056c8b4fe25fea))
* replace ESLint/Prettier with Biome, add Knip for dead code detection ([18cc154](https://github.com/janhoon/walkr/commit/18cc1549d7b89983467ba2e5d0e30b4bce187f3c))
* selector-based element targeting, live HMR updates, dev workflow ([f964434](https://github.com/janhoon/walkr/commit/f964434e34cf8e38481a79ff6d489958accdff0d))
* viewport scaling, reverse proxy for same-origin iframe, ace-demo example ([ad89f01](https://github.com/janhoon/walkr/commit/ad89f011c39f8087a646cee149399d3702c30962))
* wire up Export button dropdown and add cursor hotspot offset ([82b894b](https://github.com/janhoon/walkr/commit/82b894b405110d71eb1543177707cccdf8f661e4))


### Bug Fixes

* **cli:** add studio as dependency and make it publishable ([dcbf1d3](https://github.com/janhoon/walkr/commit/dcbf1d344846fa5a3574fa126e4dd77e54c6e0d5))
* dismiss cookie popup in ace-demo, inject base tag for proxied SPAs ([5944dd8](https://github.com/janhoon/walkr/commit/5944dd8193c8bc4a56d0075d3bdd831a579c84fc))
* resolve all type-check, lint, and dead code issues ([bf55046](https://github.com/janhoon/walkr/commit/bf55046d15515de4ce94a511bda793f85aea060b))
* **studio:** animate timeline scrubber during playback and sync with step highlight ([51814c8](https://github.com/janhoon/walkr/commit/51814c8662affb62bcde19b4ab453de27fcf4a02))
* **studio:** redirect target HMR WebSocket to correct port and add cursor icon ([961ee99](https://github.com/janhoon/walkr/commit/961ee997e8f9ac00a6d46fd595c694efc74c2985))
