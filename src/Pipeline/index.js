'use strict'

/*
 * gen-middleware
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const co = require('co')
const Counter = require('../../lib/Counter')

class Pipeline {

  constructor (middleware) {
    this._middleware = middleware
    this._counter = new Counter(0)

    this._noop = function (counter) {
      return function * () {
        counter.inc()
      }
    }

  }

  /**
   * Compose a parallel middleware chain
   *
   * @param {Array} params
   * @param {Function} composeFn
   *
   * @return {Function} function to be executed as a middleware
   */
  compose (params, composeFn) {
    const self = this
    const noop = this._noop(this._counter)
    const map = this._middleware.map((item) => {
      return composeFn(item, params.concat([noop]))
    })

    return function * (next) {
      yield co(function * () { yield map })
      if (self._counter.get() === self._middleware.length) {
        yield next
      }
    }
  }
}

module.exports = Pipeline
