'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Middleware = require('../index')
const sleep = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

test.group('Middleware | Async', () => {
  test('should be able to register middleware to the middleware store', (assert) => {
    const middleware = new Middleware()
    middleware.register(['foo', 'bar'])
    assert.deepEqual(middleware.get(), ['foo', 'bar'])
    assert.deepEqual(middleware._store.root, ['foo', 'bar'])
  })

  test('should be able to tag and register middleware to the middleware store', (assert) => {
    const middleware = new Middleware()
    middleware.tag('global').register(['foo', 'bar'])
    assert.deepEqual(middleware.tag('global').get(), ['foo', 'bar'])
    assert.deepEqual(middleware._store.global, ['foo', 'bar'])
  })

  test('should throw an error when middleware list is not an array', (assert) => {
    const middleware = new Middleware()
    const fn = () => middleware.register({name: 'foo'})
    assert.throw(fn, 'middleware.register expects an array of middleware or an instance of pipeline')
  })

  test('compose a middleware chain that can be executed in sequence', (assert, done) => {
    assert.plan(1)
    const middleware = new Middleware()
    const chain = []
    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      chain.push('second')
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('compose a middleware chain that can be executed in sequence even when some methods are async', (assert, done) => {
    assert.plan(1)
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      await slowFn()
      chain.push('second')
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('stop middleware chain when a method throws exception', (assert, done) => {
    assert.plan(2)
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      throw new Error('I am killed')
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .catch((error) => {
      assert.equal(error.message, 'I am killed')
      assert.deepEqual(chain, ['first'])
      done()
    })
  })

  test('pass context to few methods', (assert, done) => {
    assert.plan(3)
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push(this)
      await next()
    }

    async function second (next) {
      chain.push(this)
      await next()
    }

    async function third (next) {
      chain.push(this)
      await next()
    }

    class Foo {}

    middleware.register([first, second, third])

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.resolve(function (item, params) {
      if (item.name === 'second') {
        return item.apply(new Foo(), params)
      }
      return item.apply(null, params)
    }).compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.equal(chain[0], null)
      assert.equal(chain[1].constructor.name, 'Foo')
      assert.equal(chain[0], null)
      done()
    }).catch(done)
  })

  test('pass params to all the middleware functions', (assert, done) => {
    const middleware = new Middleware()
    async function first (request, next) {
      request.first = true
      await next()
    }

    async function second (request, next) {
      request.second = true
      await next()
    }

    async function third (request, next) {
      request.third = true
      await next()
    }

    middleware.register([first, second, third])

    const request = {}
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.withParams(request).compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(request, {first: true, second: true, third: true})
      done()
    }).catch(done)
  })

  test('should not mess up with params when multiple times compose is called', (assert, done) => {
    const middleware = new Middleware()

    async function first (request, next) {
      request.first = true
      await next()
    }

    async function second (request, next) {
      request.second = true
      await next()
    }

    async function third (request, next) {
      request.third = true
      await next()
    }

    middleware.register([first, second, third])

    const request = {}
    const request1 = {one: true}
    const composedMiddleware = middleware.withParams(request).compose(middleware.get())
    const composedMiddleware1 = middleware.withParams(request1).compose(middleware.get())

    Promise
    .all([composedMiddleware(), composedMiddleware1()])
    .then(() => {
      assert.deepEqual(request, {first: true, second: true, third: true})
      assert.deepEqual(request1, {one: true, first: true, second: true, third: true})
      done()
    }).catch(done)
  })

  test('should be able to pass params and bind context to all the middleware functions', (assert, done) => {
    const middleware = new Middleware()

    class First {
      async handle (request, next) {
        request.first = this.constructor.name
        await next()
      }
    }

    class Second {
      async handle (request, next) {
        request.second = this.constructor.name
        await next()
      }
    }

    class Third {
      async handle (request, next) {
        request.third = this.constructor.name
        await next()
      }
    }

    middleware.register([First, Second, Third])
    const request = {}
    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())

    composedMiddleware()
    .then(() => {
      assert.deepEqual(request, {first: 'First', second: 'Second', third: 'Third'})
      done()
    }).catch(done)
  })

  test('ignore multiple calls to next', (assert, done) => {
    assert.plan(1)
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      chain.push('second')
      await next()
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    middleware.register([first, second, third])
    const composedMiddleware = middleware.compose()

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('register middleware pipeline', (assert) => {
    const middleware = new Middleware()
    const pipeline = middleware.pipeline(['foo', 'bar'])
    middleware.register(pipeline)
    assert.deepEqual(middleware.get()[0]._middleware, ['foo', 'bar'])
  })

  test('register middleware pipeline with a named tag', (assert) => {
    const middleware = new Middleware()
    const pipeline = middleware.pipeline(['foo', 'bar'])
    middleware.tag('global').register(pipeline)
    assert.deepEqual(middleware.tag('global').get()[0]._middleware, ['foo', 'bar'])
  })

  test('compose middleware created via pipeline', (assert, done) => {
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      chain.push('second')
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    const pipeline = middleware.pipeline([first, second, third])
    middleware.register(pipeline)

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('execute pipeline middleware parallely', (assert, done) => {
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      await slowFn()
      chain.push('second')
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    const pipeline = middleware.pipeline([first, second, third])
    middleware.register(pipeline)

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'third', 'second'])
      done()
    }).catch(done)
  })

  test('return exception when pipeline item throws an exception', (assert, done) => {
    assert.plan(2)
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      chain.push('second')
      throw new Error('Aborted')
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    const pipeline = middleware.pipeline([first, second, third])
    middleware.register(pipeline)

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      done()
    }).catch((error) => {
      assert.equal(error.message, 'Aborted')
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    })
  })

  test('should execute multiple pipelines', (assert, done) => {
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      await slowFn()
      chain.push('second')
      await next()
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    const pipeline = middleware.pipeline([first, second, third])
    const pipeline1 = middleware.pipeline([first, second, third])
    middleware.register([pipeline, pipeline1])

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'third', 'second', 'first', 'third', 'second'])
      done()
    }).catch(done)
  })

  test('pass params and bind context to all the pipeline functions', (assert, done) => {
    const middleware = new Middleware()

    class First {
      async handle (request, next) {
        request.first = this.constructor.name
        await next()
      }
    }

    class Second {
      async handle (request, next) {
        request.second = this.constructor.name
        await next()
      }
    }

    class Third {
      async handle (request, next) {
        request.third = this.constructor.name
        await next()
      }
    }

    middleware.register(middleware.pipeline([First, Second, Third]))
    const request = {}

    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())

    composedMiddleware()
    .then(() => {
      assert.deepEqual(request, {first: 'First', second: 'Second', third: 'Third'})
      done()
    }).catch(done)
  })

  test('run middleware parallely inside a pipeline and pass them custom params', (assert, done) => {
    const middleware = new Middleware()

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    class First {
      async handle (request, next) {
        request.first = this.constructor.name
        await next()
      }
    }

    class Second {
      async handle (request, next) {
        await slowFn()
        request.second = this.constructor.name
        await next()
      }
    }

    class Third {
      async handle (request, next) {
        request.third = this.constructor.name
        await next()
      }
    }

    middleware.register(middleware.pipeline([First, Second, Third]))
    const request = {}

    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())

    composedMiddleware()
    .then(() => {
      assert.deepEqual(Object.keys(request), ['first', 'third', 'second'])
      done()
    }).catch(done)
  })

  test('should not call next if any of the pipeline middleware does not call next', (assert, done) => {
    const middleware = new Middleware()
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
    }

    async function second (next) {
      chain.push('second')
    }

    async function third (next) {
      chain.push('third')
      await next()
    }

    const pipeline = middleware.pipeline([first, second, third])
    const pipeline1 = middleware.pipeline([first, second, third])
    middleware.register([pipeline, pipeline1])

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('it should call middleware back in reverse order before finishing the chain', (assert, done) => {
    assert.plan(1)
    const middleware = new Middleware()
    const chain = []
    async function first (next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second (next) {
      chain.push('second')
      await next()
      chain.push('second after')
    }

    async function third (next) {
      chain.push('third')
      await next()
      chain.push('third after')
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third', 'third after', 'second after', 'first after'])
      done()
    }).catch(done)
  })

  test('calls after await in pipeline middleware should not await', (assert, done) => {
    assert.plan(1)
    const middleware = new Middleware()
    const chain = []
    async function first (next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second (next) {
      chain.push('second')
      await next()
      chain.push('second after')
    }

    async function third (next) {
      chain.push('third')
      await next()
      chain.push('third after')
    }

    middleware.register(middleware.pipeline([first, second, third]))
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    composedMiddleware()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third', 'first after', 'second after', 'third after'])
      done()
    }).catch(done)
  })

  test('params should not collide with each other', (assert, done) => {
    const middleware = new Middleware()
    async function first (request, next) {
      request.count++
      await next()
    }

    async function second (request, next) {
      request.count++
      await sleep(500)
      await next()
    }

    async function third (request, next) {
      request.count++
      await next()
    }

    middleware.register([first, second, third])

    const request = { count: 0 }
    const otherRequest = { count: 0 }
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.withParams(request).compose(middlewareChain)
    const composedMiddleware2 = middleware.withParams(otherRequest).compose(middlewareChain)

    Promise.all([composedMiddleware(), composedMiddleware2()])
    .then(() => {
      assert.equal(request.count, 3)
      assert.equal(otherRequest.count, 3)
      done()
    }).catch(done)
  })
})
