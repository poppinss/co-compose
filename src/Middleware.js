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
const Runnable = require('./Runnable')

/**
 * Middleware class is used to define an array of promises
 * to be called one after the other. It follows the hooks
 * approach, where each hook is responsible for advancing
 * the chain by calling `next`.
 *
 * @class Middleware
 * @constructor
 */
class Middleware {
  constructor () {
    this._store = {}
    this._activeTag = new Resetable('root')
  }

  /**
   * Set active tag to be used for registering
   * or fetching middleware.
   *
   * @param {String} tag
   *
   * @chainable
   */
  tag (tag) {
    this._activeTag.set(tag)
    return this
  }

  /**
   * Register an array of middleware or a pipeline
   * of middleware. Calling this method for multiple
   * times will concat the to existing list.
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
   * Composes the middleware inside a queue of
   * functions to be executed one after the
   * other.
   *
   * @method runner
   *
   * @param  {Array} [list = this.get()]
   *
   * @return {Runnable}
   */
  runner (list) {
    list = list || this.get()
    return new Runnable(list)
  }

  /**
   * Returns a new instance of pipeline.
   *
   * @method pipeline
   *
   * @param  {Array} middleware
   *
   * @return {Pipeline}
   */
  pipeline (middleware) {
    return new Pipeline(middleware)
  }
}

module.exports = Middleware
