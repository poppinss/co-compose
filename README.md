# Co Compose

> Compose an array of functions to be executed one after the other. Similar to Koa and AdonisJs.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]
[![Appveyor][appveyor-image]][appveyor-url]

Co compose composes an array of middleware to be executed in sequence. The library is framework independent and can be used in any Javascript project.

## Pattern

It follows the middleware pattern with following traits.

1. Each method is called in sequence after `next` is called.
2. If `next` is not called, the middleware chain will short-circuit and resolves right away.
3. Any middleware function can break the chain by throwing an exception.
4. All middleware functions after `next` call are executed in reverse order.

```js
const middleware = new Middleware()

const logs = []

async function first (next) {
  logs.push('first')
  await next()
  logs.push('first: in reverse')
}

async function second (next) {
  logs.push('second')
  await next()
  logs.push('second: in reverse')
}

async function third (next) {
  logs.push('third')
  await next()
  logs.push('third: in reverse')
}

middleware.register([first, second, third])

await middleware.runner().run()
assert.deepEqual(logs, [
  'first',
  'second',
  'third',
  'third: in reverse',
  'second: in reverse',
  'first: in reverse'
])
```


## Usage

Start by importing the library and instantiating a new instance of it.

```js
const Middleware = require('co-compose')
const middleware = new Middleware()
```

Next, register the middleware functions.

```js
middleware.register([
  async function (next) {
    await next()
  },
  async function (next) {
    await next()
  }
])
```

Pull an instance of middleware runner to executed the **registered middleware**.

```js
const runner = middleware.runner()

runner
  .run()
  .then(() => {
    console.log('middleware executed')
  })
  .catch((error) => {
    console.log(error)
  })
```

### Passing data along
A common use case of middleware is the HTTP request lifecycle. Let's see how we to pass the `req` and `res` objects to the middleware functions.

```js
const http = require('http')
const middleware = new (require('co-compose'))()

middleware.register([
  async function (req, res, next) {
    req.greeting = 'Hello world'
    await next()
  },

  async function (req, res, next) {
    res.write(req.greeting)
    await next()
  }
])

http.createServer(async function (req, res) {
  const runner = middleware.runner()

  // passing data
  runner.params([req, res])

  runner
    .run()
    .then(() => {
      res.end()
    })
    .catch((error) => {
      res.end(error.message)
    })
}).listen(3000)
```

The `params` method accepts an array of values as pass them as arguments to the middleware.

## Middleware API

#### register([fns])
An array of functions to be executed as middleware. Calling this method for multiple times, will concat to the existing list.

```js
middleware.register([fn1, fn2])
```

#### runner()
Returns an instance of runner with the registered middleware.

```js
middleware
  .runner()
  .run()
  .then(console.log)
  .catch(console.error)
```

## Runner API

#### params([values])
An array of values to be passed to the middleware functions as arguments. Each value inside array is passed as a seperate argument.

```js
const runner = middleware.runner()
runner.params([req, res])
```

#### run() -> Promise
Execute the middleware chain

```js
const runner = middleware.runner()

runner
  .run()
  .then(console.log)
  .catch(console.error)
```

#### concat([fns])
Concat middleware functions just before executing them. This method is useful when middleware list is known at runtime.

```js
const runner = middleware.runner()
runner.concat([fn3, fn4])
```

[appveyor-image]: https://img.shields.io/appveyor/ci/thetutlage/co-compose/develop.svg?style=flat-square
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/co-compose

[npm-image]: https://img.shields.io/npm/v/co-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/co-compose
[npm-downloads]: https://img.shields.io/npm/dm/co-compose.svg?style=flat-square

[travis-image]: https://img.shields.io/travis/poppinss/co-compose/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/co-compose

