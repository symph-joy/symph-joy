/* eslint-env jest */
/* global jasmine */
import { join } from 'path'
import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  joyBuild,
  joyServer,
  startApp,
  killApp,
  waitFor,
  Context
} from 'joy-test-utils'

// test suits
import model from './model.subtest'
import dva from './dva.subtest'
import controller from './controller.subtest'
import hook from './hook.subtest'
import head from './head.subtest'
import dynamic from './dynaimc.subtest'
import error from './error.subtest'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5

describe('[prod]basic feature', () => {
  const context = new Context({isDev: false})
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
    context.init({ server, port})
  })

  afterAll(async () => {
    await killApp(context.server)
  })

  controller(context)
  hook(context)
  model(context)
  dva(context)
  head(context)
  dynamic(context)
  error(context)
})
