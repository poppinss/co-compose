/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * An array of arguments + the next function
 */
export type MiddlewareArgs = any[]

/**
 * The middleware actual function
 */
export type MiddlewareFn = (...params: MiddlewareArgs) => Promise<void>

/**
 * Executor job is to execute one middleware function at a
 * time and pass arguments to it
 */
export type Executor = (fn: any, params: MiddlewareArgs) => Promise<void>

/**
 * Args received by the final handler
 */
export type FinalHandlerArgs = any[]

/**
 * Final handler is called when the entire chain executes
 * completely
 */
export type FinalHandler = (...params: FinalHandlerArgs) => Promise<void>
