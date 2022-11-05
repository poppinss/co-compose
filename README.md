# @poppinss/middleware
> Implementation of the chain of responsibility design pattern.

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url] [![synk-image]][synk-url]

This package is a zero-dependency implementation for the chain of responsibility design pattern, also known as the middleware pipeline.

## Setup
Install the package from the npm packages registry.

```sh
npm i @poppinss/middleware

# yarn lovers
yarn add @poppinss/middleware
```

And import the `Middleware` class as follows.

```ts
import Middleware from '@poppinss/middleware'

const middleware = new Middleware()
middleware.add((ctx, next) => {
  console.log('executing fn1')
  await next()
})

middleware.add((ctx, next) => {
  console.log('executing fn2')
  await next()
})

const context = {}
await middleware.runner().run(context)
```

## Defining middleware

The middleware handlers are defined using the `middleware.add` method. The method accepts a callback function to execute.

```ts
const middleware = new Middleware()

middleware.add(function () {
  console.log('called')
})
```

You can also define middleware as an object with the `name` and the `handle` method property.

```ts
const middleware = new Middleware()
function authenticate() {}

middleware.add({ name: 'authenticate', handle: authenticate })
```

### Passing context to middleware
You can pass a context object to the `runner.run` method, which the runner will share with the middleware callbacks. For example:

```ts
const middleware = new Middleware()
const context = {}

middleware.add(function (ctx, next) {
  assert.deepEqual(ctx, context)
  await next()
})

const runner = middleware.runner()
await runner.run(context)
```


### Final Handler
The final handler is executed when the entire middleware chain ends by calling `next`. This makes it easier to execute custom functions that are not part of the chain but must be executed when it ends.

```js
const middleware = new Middleware()
const context = {
  stack: [],
}

middleware.add((ctx, next) => {
  ctx.stack.push('fn1')
  await next()
})

await middleware
  .runner()
  .finalHandler(() => {
    ctx.stack.push('final handler')
  })
  .run(ctx)

assert.deepEqual(ctx.stack, ['fn1', 'final handler'])
```

## Context type
You can specify the context type as a generic when creating the `Middleware` class instance.

```ts
class Context {}
const middleware = new Middleware<Context>()
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
