'use strict'

/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Runnable } from './Runnable'

export class Middleware {
  private _list: any[] = []

  /**
   * Register an array of middleware to executed
   * later.
   */
  public register (list: any[]): this {
    if (!Array.isArray(list)) {
      throw new Error('middleware.register expects an array of middleware')
    }

    this._list = this._list.concat(list)
    return this
  }

  /**
   * Returns an instance of runner to execute
   * the middleware
   */
  public runner () {
    return new Runnable(this._list)
  }
}
