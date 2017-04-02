'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Counter class to track a counter.
 *
 * @class Counter
 * @constructor
 */
class Counter {
  constructor (count) {
    this._count = count || 0
  }

  /**
   * Increment the counter
   *
   * @method inc
   */
  inc () {
    this._count++
  }

  /**
   * Returns the counter
   *
   * @method get
   *
   * @return {Number}
   */
  get () {
    return this._count
  }
}

module.exports = Counter
