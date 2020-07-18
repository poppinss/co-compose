/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Executor, FinalHandler, FinalHandlerArgs, MiddlewareArgs, MiddlewareFn } from './Contracts'

/**
 * Default final handler resolves the middleware chain right away
 */
const DEFAULT_FINAL_HANDLER = {
	fn: () => Promise.resolve(),
	args: [],
}

/**
 * The default executor to execute middlewares. This method assumes middleware
 * as functions and calls them right away
 */
const DEFAULT_EXECUTOR: Executor = async (fn: MiddlewareFn, params: MiddlewareArgs) => fn(...params)

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
	private index = 0
	private params: MiddlewareArgs = []
	private executorFn: Executor = DEFAULT_EXECUTOR
	private registeredFinalHandler: {
		fn: FinalHandler
		args: FinalHandlerArgs
	} = DEFAULT_FINAL_HANDLER

	constructor(private list: any[]) {}

	/**
	 * Invoke one middleware at a time. Middleware fns will be executed
	 * recursively until `next` is invoked.
	 *
	 * If one method doesn't call `next`, then the chain will be finished
	 * automatically.
	 */
	private async invoke() {
		const fn = this.list[this.index++]

		/**
		 * Empty stack
		 */
		if (!fn) {
			return this.registeredFinalHandler.fn(...this.registeredFinalHandler.args)
		}

		return this.executorFn(fn, this.params)
	}

	/**
	 * Final handler to be executed, when chain ends successfully
	 */
	public finalHandler(fn: FinalHandler, args: FinalHandlerArgs): this {
		this.registeredFinalHandler = { fn, args }
		return this
	}

	/**
	 * Define custom resolver, which is invoked for all the middleware.
	 * If this method is defined, then default executor is not called
	 * and it's the responsibility of this method to call the
	 * middleware and pass params to it
	 */
	public executor(fn: Executor): this {
		this.executorFn = fn
		return this
	}

	/**
	 * Start the middleware queue and pass params to it. The `params`
	 * array will be passed as spread arguments.
	 */
	public async run(params: any[]): Promise<void> {
		this.params = params.concat(this.invoke.bind(this))
		return this.invoke()
	}
}
