# Changelog

## [0.6.0](https://github.com/janhoon/walkr/compare/studio-v0.5.2...studio-v0.6.0) (2026-03-05)


### Features

* add optional name annotation to all steps ([#492](https://github.com/janhoon/walkr/issues/492)) ([10f92ea](https://github.com/janhoon/walkr/commit/10f92ead324b819705c5e916d6442d95415c26c2))
* add optional name annotation to all steps ([#492](https://github.com/janhoon/walkr/issues/492)) ([f82f8a0](https://github.com/janhoon/walkr/commit/f82f8a068e2b01afd65fc4da986f89f65b263444))

## [0.5.2](https://github.com/janhoon/walkr/compare/studio-v0.5.1...studio-v0.5.2) (2026-03-03)


### Bug Fixes

* **cli:** rebuild with cursor preset support from engine ([ed0cf33](https://github.com/janhoon/walkr/commit/ed0cf33fa4b2722a56b6af8f8a13db2180193511))
* **recorder:** rebuild with cursor preset support from engine ([638bf2a](https://github.com/janhoon/walkr/commit/638bf2a544824bea5e222f5e56edb678f364152e))
* **studio:** rebuild with cursor preset support from engine ([5b83589](https://github.com/janhoon/walkr/commit/5b835894c7ba19ad56d480b0927950657fb3f001))

## [0.5.1](https://github.com/janhoon/walkr/compare/studio-v0.5.0...studio-v0.5.1) (2026-03-03)


### Bug Fixes

* rewrite CORS Origin header in proxy to prevent 403 from target backend ([0c381ba](https://github.com/janhoon/walkr/commit/0c381bab770701a2591a1adee985a11ccc80bda7))

## [0.5.0](https://github.com/janhoon/walkr/compare/studio-v0.4.1...studio-v0.5.0) (2026-03-03)


### Features

* [#439](https://github.com/janhoon/walkr/issues/439) @walkr/studio — React timeline viewer, step blocks, playback controls, step editor panel ([#2](https://github.com/janhoon/walkr/issues/2)) ([d3d0689](https://github.com/janhoon/walkr/commit/d3d068924931b1349b35477251260fd29ce2acbc))
* **@walkr/studio:** React + Vite studio app — timeline viewer, step blocks, playback controls, sidebar ([b3131fb](https://github.com/janhoon/walkr/commit/b3131fbd06627a012eca51800c515aa4054fd509))
* **@walkr/studio:** timeline editing — drag resize, drag reorder, CLI watcher, hot reload ([1a83b07](https://github.com/janhoon/walkr/commit/1a83b071a73c7467c43ff574c717ecebea7c6275))
* add clearCache step type and replace cursor with pointer SVG ([e057952](https://github.com/janhoon/walkr/commit/e057952ee7d7999b03282a0089ad2b64c00082c1))
* add drag step configuration panel in Studio ([983b6b0](https://github.com/janhoon/walkr/commit/983b6b0a5c8e5795d6eebde184fb8b8591d07100))
* monorepo scaffold — pnpm workspaces, 5 packages, TypeScript config ([5fab145](https://github.com/janhoon/walkr/commit/5fab1453bd94099a6b36ec0a6c056c8b4fe25fea))
* **recorder:** replace Playwright with CDP-based recorder ([373a707](https://github.com/janhoon/walkr/commit/373a7075799438acac7afdf892e92ced2acf297a))
* replace ESLint/Prettier with Biome, add Knip for dead code detection ([18cc154](https://github.com/janhoon/walkr/commit/18cc1549d7b89983467ba2e5d0e30b4bce187f3c))
* selector-based element targeting, live HMR updates, dev workflow ([f964434](https://github.com/janhoon/walkr/commit/f964434e34cf8e38481a79ff6d489958accdff0d))
* viewport scaling, reverse proxy for same-origin iframe, ace-demo example ([ad89f01](https://github.com/janhoon/walkr/commit/ad89f011c39f8087a646cee149399d3702c30962))
* wire up Export button dropdown and add cursor hotspot offset ([82b894b](https://github.com/janhoon/walkr/commit/82b894b405110d71eb1543177707cccdf8f661e4))


### Bug Fixes

* **cli:** add studio as dependency and make it publishable ([dcbf1d3](https://github.com/janhoon/walkr/commit/dcbf1d344846fa5a3574fa126e4dd77e54c6e0d5))
* dismiss cookie popup in ace-demo, inject base tag for proxied SPAs ([5944dd8](https://github.com/janhoon/walkr/commit/5944dd8193c8bc4a56d0075d3bdd831a579c84fc))
* resolve all type-check, lint, and dead code issues ([bf55046](https://github.com/janhoon/walkr/commit/bf55046d15515de4ce94a511bda793f85aea060b))
* strip localhost origins in proxy JS rewriting to fix API routing ([8e08f04](https://github.com/janhoon/walkr/commit/8e08f044f692ec1aa193f5b22f3e250e21b8b578))
* **studio:** animate timeline scrubber during playback and sync with step highlight ([51814c8](https://github.com/janhoon/walkr/commit/51814c8662affb62bcde19b4ab453de27fcf4a02))
* **studio:** redirect target HMR WebSocket to correct port and add cursor icon ([961ee99](https://github.com/janhoon/walkr/commit/961ee997e8f9ac00a6d46fd595c694efc74c2985))
* **studio:** rename to @walkrstudio/studio to match existing npm scope ([818945e](https://github.com/janhoon/walkr/commit/818945e0c520431f6ff73f8bce42904d201fe27f))

## [0.4.1](https://github.com/janhoon/walkr/compare/studio-v0.4.0...studio-v0.4.1) (2026-03-03)


### Bug Fixes

* strip localhost origins in proxy JS rewriting to fix API routing ([7e67015](https://github.com/janhoon/walkr/commit/7e67015d0129c72af5b7a54032df1a281e9adf7e))

## [0.4.0](https://github.com/janhoon/walkr/compare/studio-v0.3.0...studio-v0.4.0) (2026-03-03)


### Features

* add drag step configuration panel in Studio ([983b6b0](https://github.com/janhoon/walkr/commit/983b6b0a5c8e5795d6eebde184fb8b8591d07100))

## [0.3.0](https://github.com/janhoon/walkr/compare/studio-v0.2.1...studio-v0.3.0) (2026-03-01)


### Features

* **recorder:** replace Playwright with CDP-based recorder ([373a707](https://github.com/janhoon/walkr/commit/373a7075799438acac7afdf892e92ced2acf297a))

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
