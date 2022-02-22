<div align="center">
	<img src="https://res.cloudinary.com/adonisjs/image/upload/q_100/v1557762307/poppinss_iftxlt.jpg" width="600px">
</div>

# Co Compose

> Compose an array of functions to be executed one after the other. Similar to Koa and AdonisJS middlewares.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![synk-image]][synk-url]

Co compose composes an array of middleware to be executed in sequence. The library is framework independent and can be used in any Javascript/Typescript project.

<details>
	<summary> <strong>Benchmarks (v16.5.0)</strong> </summary>

    Co Compose x 2,145,829 ops/sec ±0.16% (90 runs sampled)
    fastseries x 166,990 ops/sec ±2.04% (64 runs sampled)
    middie x 122,162 ops/sec ±7.84% (28 runs sampled)

<p> <strong> Fastest is Co Compose </strong> </p>
</details>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [Passing values](#passing-values)
  - [Custom executors](#custom-executors)
  - [Final Handler](#final-handler)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

```sh
npm i co-compose

# yarn
yarn add co-compose
```

## Usage

Checkout the following example to run an array of middleware functions.

```ts
import { Middleware } from 'co-compose'
async function fn1(next) {
  console.log('executing fn1')
  await next()
}

async function fn2(next) {
  console.log('executing fn2')
  await next()
}

const middleware = new Middleware()
middleware.register([fn1, fn2])

await middleware.runner().run([])
```

### Passing values

You can also pass values to all middleware functions. An `array` of values passed to `runner.run()` will be passed to middleware functions as multiple arguments.

```js
async function fn1(ctx, next) {
  ctx.stack.push('fn1')
  await next()
}

async function fn2(ctx, next) {
  ctx.stack.push('fn2')
  await next()
}

const ctx = {
  stack: [],
}

await middleware.runner().run([ctx])
assert.deepEqual(ctx.stack, ['fn1', 'fn2'])
```

### Custom executors

The default behavior is to define middleware as functions. However, you can define them in any shape and then stick a custom executor to execute them.

Check the following example where `ES6 classes` are used.

```js
class Middleware1 {
  async handle(ctx, next) {
    ctx.stack.push('fn1')
    await next()
  }
}

class Middleware2 {
  async handle(ctx, next) {
    ctx.stack.push('fn2')
    await next()
  }
}

const middleware = new Middleware()
const ctx = {
  stack: [],
}

middleware.register([Middleware1, Middleware2])

await middleware
  .runner()
  .executor(async function (MiddlewareClass, params) {
    const instance = new MiddlewareClass() // 👈
    await instance.handle(...params) // 👈
  })
  .run([ctx])
```

### Final Handler

The final handler is a executed when the entire middleware chain ends by calling `next`. This makes it easier to execute custom functions, which are not part of the chain, however must be executed when chain ends.

> Also, the arguments for the final handler can be different from the middleware arguments

```js
async function fn1(ctx, next) {
  ctx.stack.push('fn1')
  await next()
}

async function finalHandler() {
  ctx.stack.push('final handler')
}

const ctx = {
  stack: [],
}

await middleware.runner().finalHandler(finalHandler, [ctx]).run([ctx])

assert.deepEqual(ctx.stack, ['fn1', 'final handler'])
```

[gh-workflow-image]: https://img.shields.io/github/workflow/status/poppinss/co-compose/test?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/co-compose/actions/workflows/test.yml "Github action"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"

[npm-image]: https://img.shields.io/npm/v/co-compose.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/co-compose 'npm'

[license-image]: https://img.shields.io/npm/l/co-compose?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'

[synk-image]: https://img.shields.io/snyk/vulnerabilities/github/poppinss/co-compose?label=Synk%20Vulnerabilities&style=for-the-badge
[synk-url]: https://snyk.io/test/github/poppinss/co-compose?targetFile=package.json 'synk'
