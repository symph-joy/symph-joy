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
        html = await renderViaHTTP(context.getUrl('/controller'))
        $ = cheerio.load(html)
      })

      test('component should has prepared', async () => {
        expect($('#location_pathname').text()).toBe('/controller')
      })

      test('bind props in mapStateToProps', async () => {
        const mapStateToPropsState = $('#mapStateToPropsState')
        expect(mapStateToPropsState.text()).toBe('from mapStateToPropsState')
      })

      test('bind dispatch function', async () => {
        expect($('#location_pathname').text()).toBe('/controller')
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
        await expect(page).toClick('[href="/controller"]')
      })

      test('has controller props', async () => {
        await expect(page).toMatchElement('#location_pathname', { text: '/controller' })
        await expect(page).toMatchElement('#dispatch', { text: 'function' })
      })

      test('bind props in mapStateToProps', async () => {
        await expect(page).toMatchElement('#mapStateToPropsState', { text: 'from mapStateToPropsState' })
      })

      test('change state in componentDidMount', async () => {
        waitFor(50)
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
        await expect(page).toMatch('can\'t setState during componentPrepare, this will not work on ssr')
      })
    }
  })
}
