'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Runnable = require('./Runnable')

class Middleware {
  constructor () {
    this.list = []
  }

  /**
   * Register an array of middleware
   *
   * @method register
   *
   * @param  {Array} list
   *
   * @chainable
   */
  register (list) {
    if (!Array.isArray(list)) {
      throw new Error('middleware.register expects an array of middleware')
    }
    this.list = this.list.concat(list)
    return this
  }

  /**
   * Returns an instance of runner to execute
   * the middleware
   *
   * @method runner
   *
   * @return {Runner}
   */
  runner () {
    return new Runnable(this.list)
  }
}

module.exports = Middleware
