import Middie from 'middie/engine'
import Fastseries from 'fastseries'
import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Suite, Deferred } from 'benchmark'

import { Middleware } from '../index'

const suite = new Suite()

/**
 * Middleware setup
 */
const middleware = new Middleware()
const middlewareStack = [
  async function one (next) {
    await next()
  },
  async function two (next) {
    await next()
  },
  async function three (next) {
    await next()
  },
  async function four (next) {
    await next()
  },
]
middleware.register(middlewareStack)

/**
 * Fast series setup
 */
const series = Fastseries({ results: true })
const seriesStack = [
  function one (_, next) {
    next(null)
  },
  function two (_, next) {
    next(null)
  },
  function three (_, next) {
    next(null)
  },
  function four (_, next) {
    next(null)
  },
]

const middieStack = [
  function one () {
    arguments[2](null)
  },
  function two () {
    arguments[2](null)
  },
  function three () {
    arguments[2](null)
  },
  function four () {
    arguments[2](null)
  },
]

const middie = new Middie(function runner () {
  arguments[3].deferred.resolve()
})
middie.use(middieStack[0])
middie.use(middieStack[1])
middie.use(middieStack[2])
middie.use(middieStack[3])

const req = new IncomingMessage(new Socket())

suite
  .add('Co Compose', {
    defer: true,
    fn (deferred: Deferred) {
      middleware.runner().run([]).then(() => deferred.resolve())
    },
  })
  .add('fastseries', {
    defer: true,
    fn (deferred: Deferred) {
      series({}, seriesStack, 42, () => deferred.resolve())
    },
  })
  .add('middie', {
    defer: true,
    fn (deferred: Deferred) {
      middie.run(req, {}, { deferred })
    },
  })
  .on('cycle', function(event) {
    console.log(String(event.target))
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ 'async': true })
