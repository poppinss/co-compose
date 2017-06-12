'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const Pipeline = require('./Pipeline')

/**
 * Runnable class is responsible for running the middleware
 * stack in sequenece
 *
 * @class Runnable
 */
class Runnable {
  constructor (list) {
    this._list = list
    this._params = []
    this._resolveFn = (item, params) => item(...params)
  }

  /**
   * Resolves the function/item inside the middleware
   * chain based upon it's type. If the function is
   * an instance of pipeline, `compose` method
   * on pipeline will be called other the
   * functon is executed.
   *
   * @method _resolveListItem
   *
   * @param  {Function|Object} item
   * @param  {Array}           params
   * @param  {Function}        fn       Function to be used for resolving each item inside chain
   * @param  {Function}        next
   *
   * @return {Promise}
   *
   * @private
   */
  _resolveListItem (item, params, fn, next) {
    if (item instanceof Pipeline) {
      return item.compose(params, fn)(next)
    }
    return fn(item, params.concat(next))
  }

  /**
   * Params to be passed when composing the
   * middleware list.
   *
   * @param {Spread}
   *
   * @return {Object} this for chaining
   */
  withParams (params) {
    this._params = _.castArray(params)
    return this
  }

  /**
   * An optional function to be called when resolving middleware.
   * The callback will be invoked for each function inside the
   * middleware chain. This is the best place to convert the
   * function/object into something else at runtime.
   *
   * @param {Function} fn
   *
   * @return {Object} this for chaining
   */
  resolve (fn) {
    this._resolveFn = fn
    return this
  }

  /**
   * Returns a promise to be executed to run the middleware
   * chain.
   *
   * @method compose
   *
   * @return {Promise}
   */
  compose () {
    const list = this._list
    const params = this._params
    const resolveFn = this._resolveFn
    const resolveListItem = this._resolveListItem

    return function () {
      return dispatch(0)
      function dispatch (index) {
        const item = list[index]

        /**
         * end the chain when nothing is left
         */
        if (!item) {
          return Promise.resolve()
        }

        /**
         * Make sure multiple calls to next inside
         * a same middleware are ignored.
         */
        const next = _.once(() => dispatch(index + 1))
        return resolveListItem(item, params, resolveFn, next)
      }
    }
  }
}

module.exports = Runnable
