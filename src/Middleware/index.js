'use strict'

/*
 * gen-middleware
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const Pipeline = require('../Pipeline')
const Resetable = require('../../lib/Resetable')

class Middleware {

  constructor () {
    /**
     * The middleware store for storing middleware as an array
     * for a given tag.
     * @type {Object}
     */
    this._store = {}

    /**
     * When no tag is defined the root tag
     * is used.
     * @type {String}
     */
    this._activeTag = new Resetable('root')

    /**
     * The params to be passed to the function when composing
     * the middleware.
     * @type {Array}
     */
    this._composeParams = new Resetable([])

    /**
     * The function to be called to get the final return value
     * of the middleware. It is a nice way to resolve classes
     * registered as middleware and call functions of them.
     *
     * @type {Function}
     */
    this._composeResolveFn = new Resetable(function (item, params) {
      return item.apply(this, params)
    })
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
      throw new Error('Make sure to pass an array of middleware to register')
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
    const args = _.isArray(params) ? params : _.toArray(arguments)
    this._composeParams.set(args)
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
    this._composeResolveFn.set(fn)
    return this
  }

  /**
   * Compose a list of middleware to be executed
   * as a generator function
   */
  compose (list) {
    list = list || this.get()
    /**
     * Getting compose params if defined
     */
    const composeParams = this._composeParams.pull()

    /**
     * Getting compose resolve fn if defined
     */
    const composeFn = this._composeResolveFn.pull()

    const resolveItem = this._resolveItem
    return function * (next) {
      next = next || function * () {}
      _.forEachRight(list, (item) => {
        next = resolveItem(item, composeParams, composeFn, next)
      })
      yield * next
    }
  }

  /**
   * Calls a middleware after resolving it from the custom function
   * or via the default fn
   */
  _resolveItem (item, params, fn, next) {
    if (item instanceof Pipeline) {
      return item.compose(params, fn)(next)
    }
    return fn(item, params.concat(next))
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
