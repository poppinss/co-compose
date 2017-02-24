'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Counter = require('../lib/Counter')

class Pipeline {

  constructor (middleware) {
    this._middleware = middleware
    this._counter = new Counter(0)
  }

  _noop (counter) {
    return async function () {
      counter.inc()
    }
  }

  /**
   * Composes the list of middleware to a
   * queue, which is executed parallely,
   * when all methods inside the queue
   * returns next, then only the pipeline
   * will return next.
   *
   * @method compose
   *
   * @param  {Array} params
   * @param  {Function} composeFn
   *
   * @return {Function}
   */
  compose (params, composeFn) {
    const self = this
    const noop = this._noop(this._counter)
    const map = this._middleware.map((item) => composeFn(item, params.concat([noop])))

    return async function (next) {
      await Promise.all(map)
      if (self._counter.get() === self._middleware.length) {
        await next()
      }
    }
  }
}

module.exports = Pipeline
