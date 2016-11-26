'use strict'

/*
 * gen-middleware
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const assert = chai.assert
const co = require('co')
const Middleware = require('../index')

describe('Middleware', function () {
  it('should be able to register middleware to the middleware store', function () {
    const middleware = new Middleware()
    middleware.register(['foo', 'bar'])
    assert.deepEqual(middleware.get(), ['foo', 'bar'])
    assert.deepEqual(middleware._store.root, ['foo', 'bar'])
  })

  it('should be able to tag and register middleware to the middleware store', function () {
    const middleware = new Middleware()
    middleware.tag('global').register(['foo', 'bar'])
    assert.deepEqual(middleware.tag('global').get(), ['foo', 'bar'])
    assert.deepEqual(middleware._store.global, ['foo', 'bar'])
  })

  it('should throw an error when middleware list is not an array', function () {
    const middleware = new Middleware()
    const fn = () => middleware.register({name: 'foo'})
    assert.throw(fn, 'Make sure to pass an array of middleware to register')
  })

  it('should be able to compose a middleware chain that can be executed in sequence', function (done) {
    const middleware = new Middleware()
    const chain = []
    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      chain.push('second')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  it('should be able to compose a middleware chain that can be executed in sequence even when some methods are async', function (done) {
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      yield slowFn()
      chain.push('second')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  it('should stop middleware chain when a method throws exception', function (done) {
    const middleware = new Middleware()
    const chain = []

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      throw new Error('I am killed')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    middleware.register([first, second, third])
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
    }).catch((error) => {
      assert.equal(error.message, 'I am killed')
      assert.deepEqual(chain, ['first'])
      done()
    })
  })

  it('should be able to pass context to few methods', function (done) {
    const middleware = new Middleware()
    const chain = []

    function * first (next) {
      chain.push(this)
      yield next
    }

    function * second (next) {
      chain.push(this)
      yield next
    }

    function * third (next) {
      chain.push(this)
      yield next
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
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.equal(chain[0], null)
      assert.equal(chain[1].constructor.name, 'Foo')
      assert.equal(chain[0], null)
      done()
    }).catch(done)
  })

  it('should be able to pass params to all the middleware functions', function (done) {
    const middleware = new Middleware()
    function * first (request, next) {
      request.first = true
      yield next
    }

    function * second (request, next) {
      request.second = true
      yield next
    }

    function * third (request, next) {
      request.third = true
      yield next
    }

    middleware.register([first, second, third])

    const request = {}
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.withParams(request).compose(middlewareChain)
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(request, {first: true, second: true, third: true})
      done()
    }).catch(done)
  })

  it('should not mess up with params with multiple times compose is called', function (done) {
    const middleware = new Middleware()
    function * first (request, next) {
      request.first = true
      yield next
    }

    function * second (request, next) {
      request.second = true
      yield next
    }

    function * third (request, next) {
      request.third = true
      yield next
    }

    middleware.register([first, second, third])

    const request = {}
    const request1 = {one: true}
    const composedMiddleware = middleware.withParams(request).compose(middleware.get())
    const composedMiddleware1 = middleware.withParams(request1).compose(middleware.get())

    co(function * () {
      yield composedMiddleware()
      yield composedMiddleware1()
    }).then(() => {
      assert.deepEqual(request, {first: true, second: true, third: true})
      assert.deepEqual(request1, {one: true, first: true, second: true, third: true})
      done()
    }).catch(done)
  })

  it('should be able to pass params and bind context to all the middleware functions', function (done) {
    const middleware = new Middleware()

    class First {
      * handle (request, next) {
        request.first = this.constructor.name
        yield next
      }
    }

    class Second {
      * handle (request, next) {
        request.second = this.constructor.name
        yield next
      }
    }

    class Third {
      * handle (request, next) {
        request.third = this.constructor.name
        yield next
      }
    }

    middleware.register([First, Second, Third])
    const request = {}
    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(request, {first: 'First', second: 'Second', third: 'Third'})
      done()
    }).catch(done)
  })

  it('should be able to register middleware pipeline', function () {
    const middleware = new Middleware()
    const pipeline = middleware.pipeline(['foo', 'bar'])
    middleware.register(pipeline)
    assert.deepEqual(middleware.get()[0]._middleware, ['foo', 'bar'])
  })

  it('should be able to register middleware pipeline with a named tag', function () {
    const middleware = new Middleware()
    const pipeline = middleware.pipeline(['foo', 'bar'])
    middleware.tag('global').register(pipeline)
    assert.deepEqual(middleware.tag('global').get()[0]._middleware, ['foo', 'bar'])
  })

  it('should be able to compose middleware created via pipeline', function (done) {
    const middleware = new Middleware()
    const chain = []
    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      chain.push('second')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    const pipeline = middleware.pipeline([first, second, third])
    middleware.register(pipeline)

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })

  it('should execute pipeline middleware parallely', function (done) {
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      yield slowFn()
      chain.push('second')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    const pipeline = middleware.pipeline([first, second, third])
    middleware.register(pipeline)

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'third', 'second'])
      done()
    }).catch(done)
  })

  it('should execute multiple pipelines', function (done) {
    const middleware = new Middleware()
    const chain = []

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      yield slowFn()
      chain.push('second')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    const pipeline = middleware.pipeline([first, second, third])
    const pipeline1 = middleware.pipeline([first, second, third])
    middleware.register([pipeline, pipeline1])

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'third', 'second', 'first', 'third', 'second'])
      done()
    }).catch(done)
  })

  it('should be able to pass params and bind context to all the middleware functions', function (done) {
    const middleware = new Middleware()

    class First {
      * handle (request, next) {
        request.first = this.constructor.name
        yield next
      }
    }

    class Second {
      * handle (request, next) {
        request.second = this.constructor.name
        yield next
      }
    }

    class Third {
      * handle (request, next) {
        request.third = this.constructor.name
        yield next
      }
    }

    middleware.register(middleware.pipeline([First, Second, Third]))
    const request = {}

    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(request, {first: 'First', second: 'Second', third: 'Third'})
      done()
    }).catch(done)
  })

  it('should run middleware parallely inside a pipeline and pass them custom params', function (done) {
    const middleware = new Middleware()

    const slowFn = function () {
      return new Promise((resolve) => {
        setTimeout(function () {
          resolve()
        }, 100)
      })
    }

    class First {
      * handle (request, next) {
        request.first = this.constructor.name
        yield next
      }
    }

    class Second {
      * handle (request, next) {
        yield slowFn()
        request.second = this.constructor.name
        yield next
      }
    }

    class Third {
      * handle (request, next) {
        request.third = this.constructor.name
        yield next
      }
    }

    middleware.register(middleware.pipeline([First, Second, Third]))
    const request = {}

    const composedMiddleware = middleware.withParams(request).resolve(function (Item, params) {
      const i = new Item()
      return i.handle.apply(i, params)
    }).compose(middleware.get())
    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(Object.keys(request), ['first', 'third', 'second'])
      done()
    }).catch(done)
  })

  it('should stop middleware chain when a method inside pipleline throws exception', function (done) {
    const middleware = new Middleware()
    const chain = []

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      throw new Error('I am killed')
      yield next
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    middleware.register(middleware.pipeline([first, second, third]))
    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
    }).catch((error) => {
      assert.equal(error.message, 'I am killed')
      done()
    })
  })

  it('should not yield next if any of the pipeline middleware does not yield next', function (done) {
    const middleware = new Middleware()
    const chain = []

    function * first (next) {
      chain.push('first')
      yield next
    }

    function * second (next) {
      chain.push('second')
    }

    function * third (next) {
      chain.push('third')
      yield next
    }

    const pipeline = middleware.pipeline([first, second, third])
    const pipeline1 = middleware.pipeline([first, second, third])
    middleware.register([pipeline, pipeline1])

    const middlewareChain = middleware.get()
    const composedMiddleware = middleware.compose(middlewareChain)

    co(function * () {
      yield composedMiddleware()
    }).then(() => {
      assert.deepEqual(chain, ['first', 'second', 'third'])
      done()
    }).catch(done)
  })
})
