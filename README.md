# Co Compose

> Compose an array of functions to be executed one after the other. Similar to Koa and AdonisJs.

[![travis-image]][travis-url]
[![appveyor-image]][appveyor-url]
[![coveralls-image]][coveralls-url]
[![npm-image]][npm-url]
![](https://img.shields.io/badge/Uses-Typescript-294E80.svg?style=flat-square&colorA=ddd)

Co compose composes an array of middleware to be executed in sequence. The library is framework independent and can be used in any Javascript project.

## Installation

```sh
npm i co-compose

# yarn
yarn add co-compose
```

## Setup
Checkout the following example to run an array of middleware functions.

```ts
import { Middleware } from 'co-compose'
const stack = []

async function fn1 (next) {
  stack.push('fn1')
  await next()
}

async function fn2 (next) {
  stack.push('fn2')
  await next()
}

const middleware = new Middleware()
middleware.register([fn1, fn2])

await middleware.runner().run([])
assert.deepEqual(stack, ['fn1', 'fn2'])
```

### Passing values
You can also pass values to all middleware functions. An `array` of values passed to `runner.run()` will be passed to middleware functions as multiple arguments.

```js
async function fn1 (ctx, next) {
  ctx.stack.push('fn1')
  await next()
}

async function fn2 (ctx, next) {
  ctx.stack.push('fn2')
  await next()
}

const ctx = {
  stack: []
}

await middleware.runner().run([ctx])
assert.deepEqual(ctx.stack, ['fn1', 'fn2'])
```

### Custom resolver
The default behaviour is to define middleware as functions. However, you can define them in any shape and then use a custom resolver to execute them. 

Check the following example where `ES6 classes` are used.

```js
class Middleware1 {
  async handle (ctx, next) {
    ctx.stack.push('fn1')
    await next()
  }
}

class Middleware2 {
  async handle (ctx, next) {
    ctx.stack.push('fn2')
    await next()
  }
}

const middleware = new Middleware()
const ctx = {
  stack: []
}

middleware.register([Middleware1, Middleware2])

await middleware
  .runner()
  .resolve(async function (MiddlewareClass, params) {
    const instance = new MiddlewareClass()
    await instance.handle(...params)
  })
  .run([ctx])
```

### Final Handler
The final handler is a executed when the entire middleware chain ends by calling `next`. This makes it easier to execute custom functions, which are not part of the chain, however must be executed when chain ends.

> The arguments are customizable for the final handler

```js
async function fn1 (ctx, next) {
  ctx.stack.push('fn1')
  await next()
}

async function finalHandler () {
  ctx.stack.push('final handler')
}

const ctx = {
  stack: []
}

await middleware
  .runner()
  .finalHandler(finalHandler, [ctx])
  .run([ctx])

assert.deepEqual(ctx.stack, ['fn1', 'final handler'])
```

## Change log

The change log can be found in the [CHANGELOG.md](CHANGELOG.md) file.

## Contributing

Everyone is welcome to contribute. Please go through the following guides, before getting started.

1. [Contributing](https://adonisjs.com/contributing)
2. [Code of conduct](https://adonisjs.com/code-of-conduct)


## Authors & License
[Harminder Virk](https://github.com/Harminder Virk) and [contributors](https://github.com/poppinss/co-compose/graphs/contributors).

MIT License, see the included [MIT](LICENSE.md) file.

[travis-image]: https://img.shields.io/travis/poppinss/co-compose/master.svg?style=flat-square&logo=travis
[travis-url]: https://travis-ci.org/poppinss/co-compose "travis"

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/co-compose/master.svg?style=flat-square&logo=appveyor
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/co-compose "appveyor"

[coveralls-image]: https://img.shields.io/coveralls/poppinss/co-compose/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/poppinss/co-compose "coveralls"

[npm-image]: https://img.shields.io/npm/v/co-compose.svg?style=flat-square&logo=npm
[npm-url]: https://npmjs.org/package/co-compose "npm"
