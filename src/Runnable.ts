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
	private resolveFn: Executor | null
	private registeredFinalHandler: { fn: FinalHandler; args: FinalHandlerArgs } | null = null
	private index = 0
	private params: any[] = []

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
			return this.registeredFinalHandler
				? this.registeredFinalHandler.fn(...this.registeredFinalHandler.args)
				: Promise.resolve()
		}

		/**
		 * Params to pass to next middleware fn
		 */
		const resolvedParams: MiddlewareArgs = this.params.concat(this.invoke.bind(this))

		/**
		 * Call custom resolve fn (if exists)
		 */
		if (this.resolveFn) {
			return this.resolveFn(fn, resolvedParams)
		}

		await this.executor(fn, resolvedParams)
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
		this.params = params
		await this.invoke()
	}
}
