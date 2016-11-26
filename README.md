# Co Compose

[Koa](http://koajs.com/) and [AdonisJs](http://adonisjs.com/) style middleware are super neat since they allow you to create a chain of **ES2015** generators and write maintainable async code.

**Co compose** makes it easier for you to add the support for same style of middleware inside your applications. It features:

1. Run middleware in sequence.
2. Pass custom `context (this)` to middleware functions.
3. Pass arguments to middleware functions.
4. Parallely execute middleware by wrapping them inside a pipeline.
5. Store middleware inside a middleware and tag them for later use.

## Basic Example

```javascript
const co = require('co')
const Middleware = require('co-compose')
const middleware = new Middleware()

const chain = []

const fn1 * (next) {
  chain.push('fn1')
  yield next
}

const fn2 * (next) {
  chain.push('fn2')
  yield next
}

const fn3 * (next) {
  chain.push('fn3')
  yield next
}

// Compose middleware
const composedMiddleware = middleware.compose([fn1, fn2, fn3])

co(function * () {
  yield composedMiddleware()
}).then(() => {
  assert.deepEqual(chain, ['fn1', 'fn2', 'fn3'])
})
```

## Passing Custom Params
Quite often you will be required to pass custom parameters to all the middleware functions. Same can be done using `withParams` method.

```javascript
const co = require('co')
const Middleware = require('co-compose')
const middleware = new Middleware()

const fn1 * (hash, next) {
  hash.fn1 = true
  chain.push('fn1')
  yield next
}

const fn2 * (hash, next) {
  hash.fn2 = true
  chain.push('fn2')
  yield next
}

const fn3 * (hash, next) {
  hash.fn3 = true
  chain.push('fn3')
  yield next
}

// Compose middleware with params
const hash = {}
const composedMiddleware = middleware
  .withParams(hash)
  .compose([fn1, fn2, fn3])

co(function * () {
  yield composedMiddleware()
}).then(() => {
  assert.deepEqual(hash, {fn1: true, fn2: true, fn3: true})
})
```

## Transform Functions On Fly
At times middleware are not plain functions. For example: [AdonisJs Middleware](http://adonisjs.com/docs/3.1/middleware#_creating_a_middleware) is a fully qualified **ES2015** class and it's instance should be created on fly.

```javascript
const co = require('co')
const Middleware = require('co-compose')
const middleware = new Middleware()

class Foo {

  * handle (req, res, next) {
    yield next
  }

}

class Bar {

  * handle (res, res, next) {
    yield next
  }

}

const req = {}
const res = {}

const composedMiddleware = middleware
  .resolve((M, params) => {
    const middlewareInstance = new M()
    return middlewareInstance.handle.apply(middlewareInstance, params)
  })
  .withParams(req, res)
  .compose([Foo, Bar])
```

## Using Middleware Store
Apart from composing middleware, you can also store middleware that can be referenced/composed later.

```javascript
const Middleware = require('co-compose')
const middleware = new Middleware()

const fn1 * (req, res, next) {
  yield next
}

const fn2 * (req, res, next) {
  yield next
}


// register
middleware.register([fn1, fn2])

// and later compose
middleware.withParams(req, res).compose()
```

## Tag middleware
If your application makes use of middleware at different places, it will be a nice to tag middleware when storing them. For example: Storing middleware for HTTP requests and for Websockets requests

```javascript
const Middleware = require('co-compose')
const middleware = new Middleware()

middleware.tag('http').register([fn1, fn2])
middleware.tag('ws').register([ws1, ws2])

middleware.tag('http').compose()
middleware.tag('ws').compose()
```
