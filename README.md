# VSCode Migrate Example Project

This repository contains a small sample project for the [VSCode Migrate](https://github.com/tis-gmbh/vscode-migrate) extension for VSCode.

## Features

The project contains sample files for multiple migrations. Some of the matches a covered by Unit Tests written with Jest, some are not.

### Bracket Migration

[Migration Script](./.vscode/migrations/bracketMigration.ts)<br/>
[Src Dir](./src/brackets/)<br/>

A trivial example that uses regular expressions to find matches. It replaces inward triple chevrons with outward triple chevrons.

### JQuery Promise Migration

[Migration Script](./.vscode/migrations/jqueryPromiseMigration.ts)<br/>
[Src Dir](./src/jqueryPromise/)<br/>

A more complex example that uses [ts-morph](https://github.com/dsherret/ts-morph) to migrate for a [real world breaking change](https://jquery.com/upgrade-guide/3.0/#callback-exit). The breaking change was introduced in JQuery 3 to make JQuery deferreds compatible with ES6 native promises. In JQuery 3 a failure callback that returns a non-promise value will result in the deferred being resolved, while in JQuery 2 the deferred stayed rejected. The migration will pass all non-promise values returned from failure callbacks through the factory method for a rejected deferred. This way the deferred will stay rejected in both versions.


## Usage

Install [VSCode Migrate](https://github.com/tis-gmbh/vscode-migrate), and [NodeJS](https://nodejs.org/), clone this repo and run `npm i`. Use the extension like described [here](https://github.com/tis-gmbh/vscode-migrate#usage). You can play around with this project however you like. If you want to return the `src` directory to its original state, run `npm run reset`, but be aware that this will only reset the files, not any commits performed by the extension.
