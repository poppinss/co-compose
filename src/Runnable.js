'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const once = require('once')

/**
 * Executes a function and passes all params to it
 * as a spread operator
 *
 * @method resolveItem
 *
 * @param  {Function}    item
 * @param  {Array}    params
 *
 * @return {Promise}
 */
function resolveItem (item, params) {
  if (typeof (item) !== 'function') {
    return Promise.reject(new Error('make sure all middleware values are valid functions'))
  }
  try {
    return item(...params)
  } catch (error) {
    return Promise.reject(error)
  }
}

class Runnable {
  constructor (list) {
    this._list = list
    this._params = []
    this._resolveFn = null
  }

  /**
   * Invokes the item inside the runnable list
   * for a given index.
   *
   * @method _invoke
   *
   * @param  {Array} list
   * @param  {Number} index
   *
   * @return {Promise}
   *
   * @private
   */
  _invoke (index) {
    const item = this._list[index]

    /**
     * Nothing is left, resolve with an empty promise
     */
    if (!item) {
      return Promise.resolve()
    }

    /**
     * The next method that advanced the middleware
     * chain. If this method is not called, the
     * runnable will resolve right away.
     *
     * Also multiple calls to the same function are ignored.
     */
    const next = once(() => this._invoke(index + 1))
    const params = this._params.concat(next)

    const value = this._resolveFn ? this._resolveFn(item, params) : resolveItem(item, params)
    return Promise.resolve(value)
  }

  /**
   * Params to be sent to each middleware function
   *
   * @method params
   *
   * @param  {Array}   params
   *
   * @chainable
   */
  params (params) {
    if (!Array.isArray(params)) {
      throw new Error('runnable.params accepts an array as the first argument')
    }

    this._params = params
    return this
  }

  /**
   * Concat new middleware items to the existing
   * list
   *
   * @method concat
   *
   * @param  {Array} list
   *
   * @chainable
   */
  concat (list) {
    if (!Array.isArray(list)) {
      throw new Error('runnable.concat expects an array of middleware')
    }
    this._list = this._list.concat(list)
    return this
  }

  /**
   * A custom function to resolve each item in the list.
   * Think of it as a function to resolve functions/values
   * registered inside middleware.
   *
   * @method resolve
   *
   * @param  {Function} fn
   *
   * @chainable
   */
  resolve (fn) {
    if (typeof (fn) !== 'function') {
      throw new Error('runnable.resolve accepts a function as the first argument')
    }
    this._resolveFn = fn
    return this
  }

  /**
   * Executes the middleware chain
   *
   * @method run
   *
   * @return {Promsie}
   */
  run () {
    return this._invoke(0)
  }
}

module.exports = Runnable
