/**
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as once from 'once'

/**
 * An array of arguments + the next function
 */
type MiddlewareArgs = any[]

/**
 * The middleware actual function
 */
type MiddlewareFn = (...params: MiddlewareArgs) => Promise<void>

/**
 * Executor job is to execute one middleware function at a
 * time and pass arguments to it
 */
type Executor = (fn: any, params: MiddlewareArgs) => Promise<void>

/**
 * Args received by the final handler
 */
type FinalHandlerArgs = any[]

/**
 * Final handler is called when the entire chain executes
 * completely
 */
type FinalHandler = (...params: FinalHandlerArgs) => Promise<void>

/**
 * Runnable to execute an array of functions in sequence. The queue is
 * advanced only when the current function calls `next`.
 *
 * @example
 * ```js
 * const runner = new Runnable([async function fn1 (params, next) {
 * }])
 * ```
 */
export class Runnable {
  private _resolveFn: Executor | null
  private _finalHandler: { fn: FinalHandler, args: FinalHandlerArgs } | null = null

  constructor (private _list: any[]) {
  }

  /**
   * Execute the middleware fn by passing params to it
   */
  private async _executor (fn: MiddlewareFn, params: MiddlewareArgs): Promise<void> {
    await fn(...params)
  }

  /**
   * Invoke one middleware at a time. Middleware fns will be executed
   * recursively until `next` is invoked.
   *
   * If one method doesn't call `next`, then the chain will be finished
   * automatically.
   */
  private async _invoke (index: number, params: any) {
    const fn = this._list[index]

    /**
     * Empty stack
     */
    if (!fn) {
      return this._finalHandler ? this._finalHandler.fn(...this._finalHandler.args) : Promise.resolve()
    }

    /**
     * Next fn to call the next middleware fn
     */
    const next = once(() => this._invoke(index + 1, params))

    /**
     * Params to pass to next middleware fn
     */
    const resolvedParams: MiddlewareArgs = params.concat(next)

    /**
     * Call custom resolve fn (if exists)
     */
    if (this._resolveFn) {
      return this._resolveFn(fn, resolvedParams)
    }

    await this._executor(fn, resolvedParams)
  }

  /**
   * Final handler to be executed, when chain ends successfully
   */
  public finalHandler (fn: FinalHandler, args: FinalHandlerArgs): this {
    this._finalHandler = { fn, args }
    return this
  }

  /**
   * Define custom resolver, which is invoked for all the middleware.
   * If this method is defined, then default executor is not called
   * and it's the responsibility of this method to call the
   * middleware and pass params to it
   */
  public resolve (fn: Executor): this {
    this._resolveFn = fn
    return this
  }

  /**
   * Start the middleware queue and pass params to it. The `params`
   * array will be passed as spread arguments.
   */
  public async run (params: any[]): Promise<void> {
    await this._invoke(0, params)
  }
}
