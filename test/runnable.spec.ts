'use strict'

/**
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Runnable } from '../src/Runnable'

function sleep(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

test.group('Runnable', () => {
  test('compose a middleware chain that can be executed in sequence', async (assert) => {
    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
    }

    async function second(next) {
      chain.push('second')
      await next()
    }

    async function third(next) {
      chain.push('third')
      await next()
    }

    const runner = new Runnable([first, second, third])

    await runner.run([])
    assert.deepEqual(chain, ['first', 'second', 'third'])
  })

  test('execute in sequence even when some methods are async', async (assert) => {
    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
    }

    async function second(next) {
      await sleep(100)
      chain.push('second')
      await next()
    }

    async function third(next) {
      chain.push('third')
      await next()
    }

    const runner = new Runnable([first, second, third])

    await runner.run([])
    assert.deepEqual(chain, ['first', 'second', 'third'])
  })

  test('stop middleware chain when a method throws exception', async (assert) => {
    assert.plan(2)

    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
    }

    async function second() {
      throw new Error('I am killed')
    }

    async function third(next) {
      chain.push('third')
      await next()
    }

    const runner = new Runnable([first, second, third])

    try {
      await runner.run([])
    } catch (error) {
      assert.equal(error.message, 'I am killed')
      assert.deepEqual(chain, ['first'])
    }
  })

  test('define custom executor', async (assert) => {
    const chain: any[] = []

    async function first(next) {
      chain.push(this)
      await next()
    }

    async function second(next) {
      chain.push(this)
      await next()
    }

    async function third(next) {
      chain.push(this)
      await next()
    }

    class Foo {}

    const runner = new Runnable([first, second, third])

    runner.executor(function fn(item, params) {
      if (item.name === 'second') {
        return item.apply(new Foo(), params)
      }
      return item.apply(null, params)
    })

    await runner.run([])
    assert.equal(chain[0], null)
    assert.equal(chain[1].constructor.name, 'Foo')
    assert.equal(chain[0], null)
  })

  test('pass params to all the middleware functions', async (assert) => {
    async function first(request, next) {
      request.first = true
      await next()
    }

    async function second(request, next) {
      request.second = true
      await next()
    }

    async function third(request, next) {
      request.third = true
      await next()
    }

    const runner = new Runnable([first, second, third])

    const request = {}

    await runner.run([request])
    assert.deepEqual(request, { first: true, second: true, third: true })
  })

  test('should be able to pass params and bind context to all the middleware functions', async (assert) => {
    class First {
      public async handle(request, next) {
        request.first = this.constructor.name
        await next()
      }
    }

    class Second {
      public async handle(request, next) {
        request.second = this.constructor.name
        await next()
      }
    }

    class Third {
      public async handle(request, next) {
        request.third = this.constructor.name
        await next()
      }
    }

    const runner = new Runnable([First, Second, Third])
    const request = {}

    runner.executor(function fn(item, params) {
      const i = new item()
      return i.handle.apply(i, params)
    })

    await runner.run([request])
    assert.deepEqual(request, { first: 'First', second: 'Second', third: 'Third' })
  })

  test('ignore multiple calls to next', async (assert) => {
    assert.plan(1)
    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
    }

    async function second(next) {
      chain.push('second')
      await next()
      await next()
    }

    async function third(next) {
      chain.push('third')
      await next()
    }

    const runner = new Runnable([first, second, third])

    await runner.run([])
    assert.deepEqual(chain, ['first', 'second', 'third'])
  })

  test('params should not collide with each other', async (assert) => {
    async function first(request, next) {
      request.count++
      await next()
    }

    async function second(request, next) {
      request.count++
      await sleep(500)
      await next()
    }

    async function third(request, next) {
      request.count++
      await next()
    }

    const runner = new Runnable([first, second, third])
    const runner2 = new Runnable([first, second, third])

    const request = { count: 0 }
    const otherRequest = { count: 0 }

    await Promise.all([runner.run([request]), runner2.run([otherRequest])])

    assert.equal(request.count, 3)
    assert.equal(otherRequest.count, 3)
  })

  test('run fine when methods are not async and neither returns promise', async (assert) => {
    assert.plan(1)
    const chain: string[] = []

    function first() {
      chain.push('first')
    }

    const runner = new Runnable([first])

    await runner.run([])
    assert.deepEqual(chain, ['first'])
  })

  test('execute middleware in reverse after execution', async (assert) => {
    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second(next) {
      chain.push('second')
      await sleep(200)
      await next()
      chain.push('second after')
    }

    async function third(next) {
      chain.push('third')
      await next()
      chain.push('third after')
    }

    const runner = new Runnable([first, second, third])

    await runner.run([])
    assert.deepEqual(chain, [
      'first',
      'second',
      'third',
      'third after',
      'second after',
      'first after',
    ])
  })

  test('execute middleware in reverse even when they have delays', async (assert) => {
    const chain: string[] = []

    async function first(next) {
      chain.push('first')
      await next()
      chain.push('first after')
    }

    async function second(next) {
      chain.push('second')
      await sleep(200)
      await next()
      await sleep(100)
      chain.push('second after')
    }

    async function third(next) {
      chain.push('third')
      await next()
      await sleep(200)
      chain.push('third after')
    }

    const runner = new Runnable([first, second, third])

    await runner.run([])
    assert.deepEqual(chain, [
      'first',
      'second',
      'third',
      'third after',
      'second after',
      'first after',
    ])
  })

  test('report error thrown inside syncrohonous functions', async (assert) => {
    assert.plan(1)

    const runner = new Runnable([
      function fn() {
        throw new Error('bad')
      },
    ])

    try {
      await runner.run([])
    } catch ({ message }) {
      assert.equal(message, 'bad')
    }
  })

  test('define final handler to be executed after chain', async (assert) => {
    const stack: any[] = []

    const runner = new Runnable([
      function fn(ctx, next) {
        stack.push(ctx)
        return next()
      },
    ])

    async function finalHandler(ctx) {
      stack.push(ctx)
    }

    runner.finalHandler(finalHandler, ['foo'])
    await runner.run(['bar'])

    assert.deepEqual(stack, ['bar', 'foo'])
  })

  test('do not call final handler when next is not called', async (assert) => {
    const stack: any[] = []

    const runner = new Runnable([
      function fn(ctx) {
        stack.push(ctx)
      },
    ])

    async function finalHandler(ctx) {
      stack.push(ctx)
    }

    runner.finalHandler(finalHandler, ['foo'])
    await runner.run(['bar'])

    assert.deepEqual(stack, ['bar'])
  })

  test('do not call final handler when middleware raises exception', async (assert) => {
    assert.plan(2)
    const stack: any[] = []

    const runner = new Runnable([
      function fn(ctx) {
        stack.push(ctx)
        throw new Error('Failed')
      },
    ])

    async function finalHandler(ctx) {
      stack.push(ctx)
    }

    runner.finalHandler(finalHandler, ['foo'])
    try {
      await runner.run(['bar'])
    } catch (error) {
      assert.equal(error.message, 'Failed')
    }

    assert.deepEqual(stack, ['bar'])
  })
})
