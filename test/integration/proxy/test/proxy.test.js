/* eslint-env jest */
/* global jasmine */
import path, { join } from 'path'
import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  joyServer,
  joyBuild,
  startApp,
  killApp,
  waitFor,
  Context
} from 'joy-test-utils'
import express from 'express'
import {createProxyMiddleware} from "@symph/joy/proxy-middleware"
import joy from "@symph/joy"

const context = new Context()
let targetServerPort
let targetSever
let proxyServer

describe('proxy', () => {
  beforeAll(async () => {
    jest.setTimeout(20000)
    let proxyPort = await findPort()
    targetServerPort = await findPort()
    const joyApp  = joy({dev: true, dir: join(__dirname, '../'), conf: {
      proxy: {
        enable: true,
        routes: [
          {
            path:'^/api/',
            target: `http://localhost:${targetServerPort}`
          },
          {
            path:'^/proxy-api/',
            target: `http://localhost:${targetServerPort}`,
            pathRewrite: {
              '/proxy-api/': '/api/'
            }
          }
        ]
      }
      }})
    proxyServer = await startApp(joyApp, proxyPort)
    console.log('>>> start proxy server at:', proxyPort)
    context.init({ joyApp: {}, port: proxyPort, isDev: true })

    // start target server
    await startTargetServer(targetServerPort)
  })

  afterAll(async () => {
    proxyServer.close()
    targetSever.close()
  })

  test('start proxy server', async () => {
    let html = await renderViaHTTP(context.getUrl('/'))
    expect(html).toMatch('hello form proxy test app')
  })

  const fetchAndCheck = async (url)=> {
    let res = await fetchViaHTTP(url)
    expect(res.headers.get('x-header')).toBe('x-header-value')
    let text  = await res.text()
    expect(text).toBe('hello form target server')
  }

  test('start target server', async ()=> {
    await fetchAndCheck(`http://localhost:${targetServerPort}/api/hello`)
  })

  test('fetch from proxy', async ()=> {
    await fetchAndCheck(context.getUrl('/api/hello'))
  })

  test('rewrite request path', async ()=> {
    await fetchAndCheck(context.getUrl('/proxy-api/hello'))
  })
})

async function startTargetServer (port) {
  targetSever = express()
  targetSever.get('/api/hello', (req, res) => {
    res.setHeader('x-header', 'x-header-value')
    res.send('hello form target server')
    res.end()
  })
  await new Promise((resolve, reject) => {
    targetSever.listen(port, (err) => {
      if(err){
        reject(err)
        return
      }
      resolve()
      console.log('>>> start target server at',  port)
    })
  })
  return targetSever
}
