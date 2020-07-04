/*
 * co-compose
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Executor, FinalHandler, FinalHandlerArgs, MiddlewareArgs, MiddlewareFn } from './Contracts'

const DEFAULT_FINAL_HANDLER = {
	fn: () => Promise.resolve(),
	args: [],
}

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
	private resolveFn: Executor = this.executor.bind(this)
	private registeredFinalHandler: { fn: FinalHandler; args: FinalHandlerArgs } = DEFAULT_FINAL_HANDLER

	constructor(private list: any[]) {}

	/**
	 * Execute the middleware fn by passing params to it
	 */
	private async executor(fn: MiddlewareFn, params: MiddlewareArgs): Promise<void> {
		await fn(...params)
	}

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

		return this.resolveFn(fn, this.params)
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
	public resolve(fn: Executor): this {
		this.resolveFn = fn
		return this
	}

	/**
	 * Start the middleware queue and pass params to it. The `params`
	 * array will be passed as spread arguments.
	 */
	public async run(params: any[]): Promise<void> {
		this.params = params.concat(this.invoke.bind(this))
		await this.invoke()
	}
}
