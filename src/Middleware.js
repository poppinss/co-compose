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
const Resetable = require('resetable')

class Middleware {
  constructor () {
    this._store = {}
    this._activeTag = new Resetable('root')
    this._params = new Resetable([])
    this._resolveFn = new Resetable((item, params) => item(...params))
  }

  /**
   * Calls a middleware after resolving it from the custom function
   * or via the default fn
   */
  _resolveListItem (item, params, fn, next) {
    if (item instanceof Pipeline) {
      return item.compose(params, fn)(next)
    }
    return fn(item, params.concat(next))
  }

  /**
   * Set active tag to be used for registering
   * or fetching middleware
   *
   * @param {String} tag
   *
   * @return {Object} this for chaining
   */
  tag (tag) {
    this._activeTag.set(tag)
    return this
  }

  /**
   * Register an array of middleware or a pipeline
   * of middleware.
   *
   * @param {Array|Pipeline}
   *
   * @throws Error when list is not an array of pipeline instance
   */
  register (list) {
    if (!_.isArray(list) && list instanceof Pipeline === false) {
      throw new Error('middleware.register expects an array of middleware or an instance of pipeline')
    }

    const activeTag = this._activeTag.pull()
    this._store[activeTag] = this._store[activeTag] || []
    this._store[activeTag] = this._store[activeTag].concat(list)
  }

  /**
   * Returns an untouched list of middleware for the
   * active tag or for the root tag.
   *
   * @return {Array}
   */
  get () {
    const activeTag = this._activeTag.pull()
    return this._store[activeTag]
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
    const args = _.castArray(params)
    this._params.set(args)
    return this
  }

  /**
   * An optional function to be called when
   * resolving middleware.
   *
   * @param {Function} fn
   *
   * @return {Object} this for chaining
   */
  resolve (fn) {
    this._resolveFn.set(fn)
    return this
  }

  /**
   * Composes the middleware inside a queue of
   * functions to be executed one after the
   * other.
   *
   * @method compose
   *
   * @param  {Array} [list]
   *
   * @return {Function}
   */
  compose (list) {
    list = list || this.get()

    const params = this._params.pull()
    const resolveFn = this._resolveFn.pull()
    const resolveListItem = this._resolveListItem

    return async function () {
      return dispatch(0)
      async function dispatch (index) {
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
        return await resolveListItem(item, params, resolveFn, next)
      }
    }
  }

  /**
   * Returns a new instance of pipeline
   *
   * @return {Pipeline}
   */
  pipeline (middleware) {
    return new Pipeline(middleware)
  }
}

module.exports = Middleware
