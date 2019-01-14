/* eslint-env jest */
/* global jasmine */
import { join } from 'path'
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

const context = new Context()

describe('custom document', () => {
  beforeAll(async () => {
    let port = await findPort()
    let server = await launchApp(join(__dirname, '../'), port)
    context.init({ server, port, isDev: true })
  })

  afterAll(async () => {
    await killApp(context.server)
  })

  test('[server]custom document', async () => {
    let html = await renderViaHTTP(context.getUrl('/'))
    expect(html).toMatch('<meta name="custom head" content=""/>')
    expect(html).toMatch('<div>demo for custom document</div>')
  })

  test('[browser]custom document', async () => {
    await page.goto(context.getUrl('/'))
    await expect(page).toMatch('custom body')
  })
})
