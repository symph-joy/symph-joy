/* eslint-env jest */
/* global jasmine */
import { join } from 'path'
import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
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
import hmr from './hmr.subtest'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 5

describe('[dev]basic feature', () => {
  const context = new Context({isDev: true})
  beforeAll(async () => {
    let port = await findPort()
    let server = await launchApp(join(__dirname, '../'), port)
    context.init({server, port})

    await Promise.all([
      renderViaHTTP(context.getUrl('/'))
    ])
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
  hmr(context)
  error(context)
})
