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
  describe('hookApi', () => {
    describe('server render', () => {
      let html, $
      beforeAll(async () => {
        html = await renderViaHTTP(context.getUrl('/hook/api'))
        $ = cheerio.load(html)
      })
      test('useModel', async () => {
        expect($('#hooksModel').text()).toBe('hooksModel.namespace:hooks')
      })
      test('useEffect, called on server render', async () => {
        expect($('#count').text()).toBe('count:2')
      })
      test('useMappedState', async () => {
        expect($('#count').text()).toBe('count:2')
      })
    })


    describe('browser render', () => {
      beforeAll(async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/hook/api"]')
      })

      test('useModel', async () => {
        await expect(page).toMatchElement('#hooksModel', { text: 'hooksModel.namespace:hooks' })
      })
      test('useEffect, called on browser first render', async () => {
        await expect(page).toMatchElement('#count', { text: 'count:3' })
      })
      test('useMappedState', async () => {
        await expect(page).toMatchElement('#count', { text: 'count:3' })
      })
      test('call model method', async () => {
        await expect(page).toClick('#btnAdd')
        await expect(page).toMatchElement('#count', { text: 'count:4' })
      })
      test('call model by dispatch', async () => {
        await expect(page).toClick('#btnAddByDispatch')
        await expect(page).toMatchElement('#count', { text: 'count:5' })
      })

    })
  })
}
