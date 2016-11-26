'use strict'

/*
 * gen-middleware
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/


class Counter {

  constructor (count) {
    this._count = count || 0
  }

  inc () {
    this._count++
  }

  get () {
    return this._count
  }

}


module.exports = Counter
