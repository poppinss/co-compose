'use strict'

/**
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Runnable = require('../src/Runnable')

test.group('Runnable', () => {
  test('throw exception when params is not an array', (assert) => {
    const runner = new Runnable()
    const fn = () => runner.params({})
    assert.throw(fn, 'runnable.params accepts an array as the first argument')
  })

  test('throw exception when function is not passed to resolve method', (assert) => {
    const runner = new Runnable()
    const fn = () => runner.resolve('foo')
    assert.throw(fn, 'runnable.resolve accepts a function as the first argument')
  })

  test('throw exception when array is not passed to concat method', (assert) => {
    const runner = new Runnable()
    const fn = () => runner.concat('')
    assert.throw(fn, 'runnable.concat expects an array of middleware')
  })
})
