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
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5

describe('custom error page', () => {
  beforeAll(async () => {
    const appDir = join(__dirname, '../')
    await joyBuild(appDir)
    const app = joyServer({
      dir: join(appDir),
      dev: false,
      quiet: true
    })

    const server = await startApp(app)
    const port = server.address().port
    context.init({ server, port, isDev: true })
  })

  afterAll(async () => {
    await killApp(context.server)
  })

  test('[server]custom error page', async () => {
    let html = await renderViaHTTP(context.getUrl('/'))
    expect(html).toMatch('didMount:false')
    expect(html).toMatch('500:error from render')
  })

  test('[browser]custom error page', async () => {
    await page.goto(context.getUrl('/'))
    await expect(page).toMatch('didMount:true')
    await expect(page).toMatch('500:error from render')
  })
})
