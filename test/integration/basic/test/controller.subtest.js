/* eslint-env jest */
/* global jasmine */
import { join } from 'path'
import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  killApp,
  waitFor
} from 'joy-test-utils'
import cheerio from 'cheerio'

export default (context) => {
  describe('controller', () => {
    describe('server render', () => {
      let html, $
      beforeAll(async () => {
        html = await renderViaHTTP(context.getUrl('/controller/basic'))
        $ = cheerio.load(html)
      })

      test('component should has prepared', async () => {
        expect($('#location_pathname').text()).toBe('/controller/basic')
      })

      test('bind props in mapStateToProps', async () => {
        const mapStateToPropsState = $('#mapStateToPropsState')
        expect(mapStateToPropsState.text()).toBe('from mapStateToPropsState')
      })

      test('bind dispatch function', async () => {
        expect($('#location_pathname').text()).toBe('/controller/basic')
        expect($('#dispatch').text()).toBe('function')
      })

      test('should render component state', async () => {
        expect($('#state').text()).toBe('from state of component')
      })

      test('check context contain tempo and headManager', async () => {
        expect($('#tempo').text()).toBe('tempo:true')
        expect($('#headManager').text()).toBe('headManager:false') // sever do not need headManager
      })
    })

    describe('browser render', () => {
      beforeAll(async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/controller/basic"]')
      })

      test('has controller props', async () => {
        await expect(page).toMatchElement('#location_pathname', { text: '/controller/basic' })
        await expect(page).toMatchElement('#dispatch', { text: 'function' })
      })

      test('bind props in mapStateToProps', async () => {
        await expect(page).toMatchElement('#mapStateToPropsState', { text: 'from mapStateToPropsState' })
      })

      test('change state in componentDidMount', async () => {
        await waitFor(50)
        await expect(page).toMatchElement('#state', { text: 'changed by componentDidMount' })
      })

      test('change state in click handler', async () => {
        await expect(page).toClick('#btnChangeState')
        await expect(page).toMatchElement('#state', { text: 'changed by onClickEditState' })
      })

      test('check context contain tempo and headManager', async () => {
        await expect(page).toMatchElement('#tempo', { text: 'tempo:true' })
        await expect(page).toMatchElement('#headManager', { text: 'headManager:true' })
      })
    })

    if (context.isDev) {
      test('[dev] reject setState in componentPrepare', async () => {
        await page.goto(context.getUrl('/controller/setStateOnPrepare'))
        await expect(page).toMatch('can\'t call setState during componentPrepare, this will not work on ssr')
      })
    }

    describe('autowire', () => {
      test('[server]define model type by typescript syntax', async() => {
        const html = await renderViaHTTP(context.getUrl('/controller/autowire'))
        expect(html).toMatch('"hello":{"message":"hello from HelloModel"}')
        expect(html).toMatch('<div>message:hello from HelloModel</div>')
      })

      test('define model type by typescript syntax', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick(`[href="/controller/autowire"]`)
        await expect(page).toMatch('message:hello from HelloModel')
      })

      test('[server]define model type by parameter of decorator', async() => {
        const html = await renderViaHTTP(context.getUrl('/controller/autowireWithType'))
        expect(html).toMatch('"hello":{"message":"hello from HelloModel"}')
        expect(html).toMatch('<div>message:hello from HelloModel</div>')
      })

      test('define model type by parameter of decorator', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick(`[href="/controller/autowireWithType"]`)
        await expect(page).toMatch('message:hello from HelloModel')
      })
    })

    describe('componentPrepare', () => {
      test('[server] call model\`s method in componentPrepare', async() => {
        const html = await renderViaHTTP(context.getUrl('/controller/prepare'))
        expect(html).toMatch('"hello":{"message":"hello from componentPrepare"}')
        expect(html).toMatch('<div>message:hello from componentPrepare</div>')
      })

      test('define model type by typescript syntax', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick(`[href="/controller/prepare"]`)
        await expect(page).toMatch('message:hello from componentPrepare')
      })
    })

  })
}
