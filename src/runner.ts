/*
 * @poppinss/middleware
 *
 * (c) Poppinss
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { FinalHandler, MiddlewareHandler, MiddlewareProviderHandler } from './types.js'

/**
 * Run a function only once. Tightly coupled with the Runner class
 */
function once(scope: Runner<any>, callback: (scope: Runner<any>) => Promise<void> | void) {
  function next(): Promise<void> | void {
    if (next.called) {
      return
    }

    next.called = true
    return callback(scope)
  }
  next.called = false

  return next
}

/**
 * Default final handler resolves the middleware chain right away
 */
const DEFAULT_FINAL_HANDLER = () => Promise.resolve()

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
export class Runner<Context extends any> {
  /**
   * An array of middleware to execute
   */
  #middleware: (MiddlewareHandler<Context> | MiddlewareProviderHandler<Context>)[]

  /**
   * Context to share with the middleware and the final handler
   */
  #context?: Context

  /**
   * The active index for the middleware handler
   */
  #currentIndex = 0

  /**
   * Final handler to execute
   */
  #finalHandler: FinalHandler<Context> = DEFAULT_FINAL_HANDLER

  constructor(middleware: (MiddlewareHandler<Context> | MiddlewareProviderHandler<Context>)[]) {
    this.#middleware = middleware
  }

  /**
   * Invoke one middleware at a time. Middleware fns will be executed
   * recursively until `next` is invoked.
   *
   * If one method doesn't call `next`, then the chain will be finished
   * automatically.
   */
  #invoke(self: Runner<Context>): Promise<void> | void {
    const middleware = self.#middleware[self.#currentIndex++]

    /**
     * Empty stack
     */
    if (!middleware) {
      return self.#finalHandler(self.#context!)
    }

    /**
     * Call middleware from a function
     */
    if (typeof middleware === 'function') {
      return middleware(self.#context!, once(self, self.#invoke))
    }

    /**
     * Call middleware from an object
     */
    return middleware.handle(self.#context!, once(self, self.#invoke))
  }

  /**
   * Final handler to be executed, when the chain ends successfully.
   */
  finalHandler(finalHandler: FinalHandler<Context>): this {
    this.#finalHandler = finalHandler
    return this
  }

  /**
   * Start the middleware queue and pass params to it. The `params`
   * array will be passed as spread arguments.
   */
  async run(context: Context): Promise<void> {
    this.#context = context
    return this.#invoke(this)
  }
}
