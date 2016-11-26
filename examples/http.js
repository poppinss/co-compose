'use strict'

const http = require('http')
const Middleware = require('../index')
const middleware = new Middleware()
const co = require('co')

middleware.register([
  function * (req, res, next) {
    req.counter++
    yield next
  },
  function * (req, res, next) {
    req.counter++
    yield next
  }
])

function requestHandler (req, res) {
  req.counter = 0
  const composed = middleware.withParams(req, res).compose()
  co(function * () {
    yield composed()
  }).then(() => {
    res.writeHead(200)
    res.write(`The request counter is ${req.counter}`)
    res.end()
  }).catch((err) => {
    res.writeHead(500)
    res.write(err.message)
    res.end()
  })
}

http.createServer(requestHandler).listen(3000, () => {
  console.log('listening server on http://localhost:3000')
})
