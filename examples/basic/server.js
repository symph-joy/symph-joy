const express = require('express')
const symph = require('@symph/joy')
const {createProxyApiMiddleware} = require('@symph/joy/proxy-api-middleware')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = symph({ dev })
const handle = app.getRequestHandler()

app.prepare()
.then(() => {
  const server = express()

  server.use(createProxyApiMiddleware())

  server.get('/index', (req, res) => {
    console.log('render index page')
    return app.render(req, res, '/index', req.query)
  })

  server.get('/favicon.ico', (req, res) => {
    return res.write('success')
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
