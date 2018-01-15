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
const Middleware = require('../src/Middleware')

const sleep = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

test.group('Middleware', () => {
  test('should be able to register middleware to the middleware store', (assert) => {
    const middleware = new Middleware()
    middleware.register(['foo', 'bar'])
    assert.deepEqual(middleware.list, ['foo', 'bar'])
  })

  test('should throw an error when middleware list is not an array', (assert) => {
    const middleware = new Middleware()
    const fn = () => middleware.register({name: 'foo'})
    assert.throw(fn, 'middleware.register expects an array of middleware')
  })

  test('compose a middleware chain that can be executed in sequence', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('compose a middleware chain that can be executed in sequence even when some methods are async', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('stop middleware chain when a method throws exception', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .catch((error) => {
      assert.equal(error.message, 'I am killed')
      assert.deepEqual(chain, ['first'])
      done()
    })
  })

  test('define custom resolveFn', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])

    const runner = middleware.runner()

    runner.resolve(function (item, params) {
      if (item.name === 'second') {
        return item.apply(new Foo(), params)
      }
      return item.apply(null, params)
    })

    runner
      .run()
      .then(() => {
        assert.equal(chain[0], null)
        assert.equal(chain[1].constructor.name, 'Foo')
        assert.equal(chain[0], null)
        done()
      }).catch(done)
  })

  test('pass params to all the middleware functions', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])

    const request = {}
    const runner = middleware.runner()
    runner.params([request])

    runner
    .run()
    .then(() => {
      assert.deepEqual(request, {first: true, second: true, third: true})
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

    const runner = middleware.runner()

    runner.params([request])
    runner.resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    })

    runner
      .run()
      .then(() => {
        assert.deepEqual(request, {first: 'First', second: 'Second', third: 'Third'})
        done()
      })
      .catch(done)
  })

  test('ignore multiple calls to next', (assert, done) => {
    assert.plan(1)
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

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  test('params should not collide with each other', (assert, done) => {
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

    const middleware = new Middleware()
    middleware.register([first, second, third])

    const request = { count: 0 }
    const otherRequest = { count: 0 }

    const runner = middleware.runner().params([request])
    const runner2 = middleware.runner().params([otherRequest])

    Promise.all([runner.run(), runner2.run()])
    .then(() => {
      assert.equal(request.count, 3)
      assert.equal(otherRequest.count, 3)
      done()
    }).catch(done)
  })

  test('run fine when methods are not async and neither returns promise', (assert, done) => {
    assert.plan(1)
    const chain = []

    function first () {
      chain.push('first')
    }

    const middleware = new Middleware()
    middleware.register([first])

    const runner = middleware.runner()

    runner
      .run()
      .then(() => {
        assert.deepEqual(chain, ['first'])
        done()
      })
      .catch(done)
  })

  test('concat new middleware to the runner', (assert, done) => {
    assert.plan(1)
    const chain = []

    function first (next) {
      chain.push('first')
      return next()
    }

    function second () {
      chain.push('second')
    }

    const middleware = new Middleware()
    middleware.register([first])

    const runner = middleware.runner()
    runner.concat([second])

    runner
      .run()
      .then(() => {
        assert.deepEqual(chain, ['first', 'second'])
        done()
      })
      .catch(done)
  })

  test('execute middleware in reverse after execution', (assert, done) => {
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second (next) {
      chain.push('second')
      await sleep(200)
      await next()
      chain.push('second after')
    }

    async function third (next) {
      chain.push('third')
      await next()
      chain.push('third after')
    }

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third', 'third after', 'second after', 'first after'])
      done()
    }).catch(done)
  })

  test('execute middleware in reverse even when they have delays', (assert, done) => {
    const chain = []

    async function first (next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second (next) {
      chain.push('second')
      await sleep(200)
      await next()
      await sleep(100)
      chain.push('second after')
    }

    async function third (next) {
      chain.push('third')
      await next()
      await sleep(200)
      chain.push('third after')
    }

    const middleware = new Middleware()
    middleware.register([first, second, third])
    const runner = middleware.runner()

    runner
    .run()
    .then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third', 'third after', 'second after', 'first after'])
      done()
    }).catch(done)
  })

  test('throw exception when middleware item is not a callable function', (assert, done) => {
    const middleware = new Middleware()
    middleware.register([{}])
    const runner = middleware.runner()

    runner
    .run()
    .catch(({ message }) => {
      done(function () {
        assert.equal(message, 'make sure all middleware values are valid functions')
      })
    })
  })

  test('report error thrown inside syncrohonous functions', (assert, done) => {
    const middleware = new Middleware()
    middleware.register([function () {
      throw new Error('bad')
    }])
    const runner = middleware.runner()

    runner
    .run()
    .catch(({ message }) => {
      done(function () {
        assert.equal(message, 'bad')
      })
    })
  })
})
