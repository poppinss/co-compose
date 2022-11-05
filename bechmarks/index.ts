// @ts-expect-error
import benchmark from 'benchmark'
// @ts-expect-error
import Fastseries from 'fastseries'

import { Middleware } from '../src/middleware.js'
const suite = new benchmark.Suite()

/**
 * Poppinss middleware setup
 */
const middleware = new Middleware()
middleware.add(async function one(_, next) {
  await next()
})
middleware.add(async function two(_, next) {
  await next()
})
middleware.add(async function three(_, next) {
  await next()
})
middleware.add(async function four(_, next) {
  await next()
})

/**
 * Fast series middlewar
 */
const series = Fastseries({ results: true })
const seriesStack = [
  function one(_: any, next: any) {
    next(null)
  },
  function two(_: any, next: any) {
    next(null)
  },
  function three(_: any, next: any) {
    next(null)
  },
  function four(_: any, next: any) {
    next(null)
  },
]

suite
  .add('Co Compose', {
    defer: true,
    fn(deferred: any) {
      middleware
        .runner()
        .run({})
        .then(() => deferred.resolve())
    },
  })
  .add('fastseries', {
    defer: true,
    fn(deferred: any) {
      series({}, seriesStack, {}, () => deferred.resolve())
    },
  })
  .on('cycle', function (event: any) {
    console.log(String(event.target))
  })
  .on('complete', function (this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ async: true })
