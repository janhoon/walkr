# Changelog

## [0.4.0](https://github.com/janhoon/walkr/compare/cli-v0.3.0...cli-v0.4.0) (2026-03-02)


### Features

* add --port flag and deterministic step IDs ([#471](https://github.com/janhoon/walkr/issues/471), [#472](https://github.com/janhoon/walkr/issues/472)) ([#24](https://github.com/janhoon/walkr/issues/24)) ([903eac2](https://github.com/janhoon/walkr/commit/903eac25d5dce6abfc68d00c4536f40652c31538))

## [0.3.0](https://github.com/janhoon/walkr/compare/cli-v0.2.5...cli-v0.3.0) (2026-03-01)


### Features

* **recorder:** replace Playwright with CDP-based recorder ([373a707](https://github.com/janhoon/walkr/commit/373a7075799438acac7afdf892e92ced2acf297a))
* **recorder:** streaming ffmpeg pipeline, real-time capture mode, and docs ([05dc8e0](https://github.com/janhoon/walkr/commit/05dc8e0f11c38c0a15f152a2269c6f954029bab4))

## [0.2.5](https://github.com/janhoon/walkr/compare/cli-v0.2.4...cli-v0.2.5) (2026-02-28)


### Bug Fixes

* **cli:** auto-install Playwright browsers on first export ([6affc30](https://github.com/janhoon/walkr/commit/6affc302e490e378869dd508d54087b915f6aa52))

## [0.2.4](https://github.com/janhoon/walkr/compare/cli-v0.2.3...cli-v0.2.4) (2026-02-28)


### Bug Fixes

* **cli:** register ESM resolve hook for @walkrstudio/* packages ([49742ad](https://github.com/janhoon/walkr/commit/49742ad76f2aafe4ed5dc40b061c39d94db1d222))

## [0.2.3](https://github.com/janhoon/walkr/compare/cli-v0.2.2...cli-v0.2.3) (2026-02-28)


### Bug Fixes

* **studio:** rename to @walkrstudio/studio to match existing npm scope ([818945e](https://github.com/janhoon/walkr/commit/818945e0c520431f6ff73f8bce42904d201fe27f))

## [0.2.2](https://github.com/janhoon/walkr/compare/cli-v0.2.1...cli-v0.2.2) (2026-02-28)


### Bug Fixes

* **cli:** add studio as dependency and make it publishable ([dcbf1d3](https://github.com/janhoon/walkr/commit/dcbf1d344846fa5a3574fa126e4dd77e54c6e0d5))
* **cli:** bundle core and playwright as regular dependencies ([d992e8b](https://github.com/janhoon/walkr/commit/d992e8bd4998b73c1ac86f2c9fe4efc5c7f7a9da))

## [0.2.1](https://github.com/janhoon/walkr/compare/cli-v0.2.0...cli-v0.2.1) (2026-02-28)


### Bug Fixes

* **cli:** make @walkrstudio/core a peer dependency for proper installation ([f4bf785](https://github.com/janhoon/walkr/commit/f4bf7858e01c93d24a9dd43a3a857e4b3280dcb7))

## [0.2.0](https://github.com/janhoon/walkr/compare/cli-v0.1.0...cli-v0.2.0) (2026-02-28)


### Features

* **@walkr/cli,@walkr/playwright:** walkr dev, walkr export, headless capture, ffmpeg encoding, embed player ([c306e77](https://github.com/janhoon/walkr/commit/c306e7762bb4475b1edbe4465ccba51f0d0d6feb))
* **@walkr/studio:** timeline editing — drag resize, drag reorder, CLI watcher, hot reload ([1a83b07](https://github.com/janhoon/walkr/commit/1a83b071a73c7467c43ff574c717ecebea7c6275))
* monorepo scaffold — pnpm workspaces, 5 packages, TypeScript config ([5fab145](https://github.com/janhoon/walkr/commit/5fab1453bd94099a6b36ec0a6c056c8b4fe25fea))
* npm publish prep — @walkr/core and @walkr/cli READMEs, create-walkr scaffold, root README ([1c9b9a9](https://github.com/janhoon/walkr/commit/1c9b9a91013197cb1ade38ea38e4d8039744e8ba))
* replace ESLint/Prettier with Biome, add Knip for dead code detection ([18cc154](https://github.com/janhoon/walkr/commit/18cc1549d7b89983467ba2e5d0e30b4bce187f3c))
* selector-based element targeting, live HMR updates, dev workflow ([f964434](https://github.com/janhoon/walkr/commit/f964434e34cf8e38481a79ff6d489958accdff0d))
* viewport scaling, reverse proxy for same-origin iframe, ace-demo example ([ad89f01](https://github.com/janhoon/walkr/commit/ad89f011c39f8087a646cee149399d3702c30962))
