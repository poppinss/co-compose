;(async function () {
	const Middleware = require('..').Middleware

	class Middleware1 {
		async handle(ctx, next) {
			ctx.stack.push('fn1')
			await next()
		}
	}

	class Middleware2 {
		async handle(ctx, next) {
			ctx.stack.push('fn2')
			await next()
		}
	}

	const middleware = new Middleware()
	const ctx = {
		stack: [],
	}

	middleware.register([Middleware1, Middleware2])

	await middleware
		.runner()
		.executor(async function (MiddlewareClass, params) {
			const instance = new MiddlewareClass()
			await instance.handle(...params)
		})
		.run([ctx])

	console.log(ctx)
})()
