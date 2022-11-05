/*
 * @poppinss/middleware
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Middleware } from '../src/middleware.js'

test.group('Middleware', () => {
  test('register middleware', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    assert.deepEqual(middleware.all(), new Set([handler]))
    assert.isTrue(middleware.has(handler))
  })

  test('add middleware as an object with handle method', ({ assert }) => {
    const middleware = new Middleware()

    const handler = {
      name: 'beforeSave',
      handle() {},
    }
    middleware.add(handler)

    assert.deepEqual(middleware.all(), new Set([handler]))
    assert.isTrue(middleware.has(handler))
  })

  test('add multiple middleware', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    function handler1() {}
    middleware.add(handler1)

    assert.deepEqual(middleware.all(), new Set([handler, handler1]))
    assert.isTrue(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))
  })

  test('attempt to remove middleware without registering it', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.remove(handler)
    assert.deepEqual(middleware.all(), new Set([]))
  })

  test('remove a specific middleware', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    function handler1() {}
    middleware.add(handler1)

    assert.deepEqual(middleware.all(), new Set([handler, handler1]))
    assert.isTrue(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))

    middleware.remove(handler)

    assert.isFalse(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))
    assert.deepEqual(middleware.all(), new Set([handler1]))
  })

  test('remove object based middleware', ({ assert }) => {
    const middleware = new Middleware()

    const handler = {
      name: 'handler',
      handle() {},
    }
    middleware.add(handler)

    const handler1 = {
      name: 'handler1',
      handle() {},
    }
    middleware.add(handler1)

    assert.deepEqual(middleware.all(), new Set([handler, handler1]))
    assert.isTrue(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))

    middleware.remove(handler)

    assert.isFalse(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))
    assert.deepEqual(middleware.all(), new Set([handler1]))
  })

  test('clear all middleware handlers', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    function handler1() {}
    middleware.add(handler1)

    assert.deepEqual(middleware.all(), new Set([handler, handler1]))
    assert.isTrue(middleware.has(handler))
    assert.isTrue(middleware.has(handler1))

    middleware.clear()

    assert.isFalse(middleware.has(handler))
    assert.isFalse(middleware.has(handler1))
    assert.deepEqual(middleware.all(), new Set([]))
  })

  test('merge middleware handlers from another middleware instance', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    const middleware1 = new Middleware()
    middleware1.merge(middleware)

    assert.deepEqual(middleware.all(), new Set([handler]))
    assert.deepEqual(middleware1.all(), new Set([handler]))
  })

  test('merge middleware handlers over existing handlers', ({ assert }) => {
    const middleware = new Middleware()

    function handler() {}
    middleware.add(handler)

    const middleware1 = new Middleware()

    function handler1() {}
    middleware1.add(handler1)
    middleware1.merge(middleware)

    assert.deepEqual(middleware.all(), new Set([handler]))
    assert.deepEqual(middleware1.all(), new Set([handler, handler1]))
  })

  test('assert middleware handler types', () => {
    const middleware = new Middleware<{ foo: string }>()

    // @ts-expect-error
    middleware.add((_: string) => {})

    middleware.add((_: { foo: string }) => {})
  })

  test('execute middleware handlers', async ({ assert }) => {
    const chain: string[] = []
    const middleware = new Middleware()

    middleware.add((_, next) => {
      chain.push('first')
      return next()
    })

    middleware.add((_, next) => {
      chain.push('second')
      return next()
    })

    middleware.add((_, next) => {
      chain.push('third')
      return next()
    })

    await middleware.runner().run({})
    assert.deepEqual(chain, ['first', 'second', 'third'])
  })
})
