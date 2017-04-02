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

/**
 * Pipeline is a subset of middleware, where all methods
 * are executed in parallel. Still all methods have to
 * call `next` so that when the pipeline is over the
 * next middleware gets executed.
 *
 * ## Note
 * Pipeline should be used for middleware with no side-effects.
 * For example: If your middleware returns the response or
 * ends the chain, you should never add it to a pipeline.
 *
 * Classic example of pipeline middleware are.
 * 1. Read cookies/session
 * 2. Fetching authenticated user.
 * 3. Decorating request object etc.
 *
 * @class Pipeline
 * @constructor
 */
class Pipeline {
  constructor (middleware) {
    this._middleware = middleware
    this._counter = new Counter(0)
  }

  /**
   * Noop is used the next method for the pipeline
   * middleware. Calling this method will increment
   * a counter telling the pipeline that all methods
   * have called next.
   *
   * @method _noop
   *
   * @param  {Object} counter
   *
   * @return {AsyncFunction}
   *
   * @private
   */
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
      /**
       * Only call next when all middleware inside pipeline
       * have called next. Otherwise some middleware has
       * intentions of returning early.
       */
      if (self._counter.get() === self._middleware.length) {
        await next()
      }
    }
  }
}

module.exports = Pipeline
