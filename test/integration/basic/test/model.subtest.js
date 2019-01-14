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

// test suits
import cheerio from 'cheerio'

export default (context) => {
  describe('model', () => {
    describe('server render', () => {
      let html, $
      beforeAll(async () => {
        html = await renderViaHTTP(context.getUrl('/model'))
        $ = cheerio.load(html)
      })

      test('bind init state of model', async () => {
        expect($('#hello').text()).toBe('hello from model')
      })

      test('should load data by componentPrepare', async () => {
        expect($('#hasFetchData').text()).toBe('true')
        expect($('#messagesCount').text()).toBe('1')
        expect(html.includes('<div>todo-init</div>')).toBeTruthy()
      })

      test('check initState of redux store', async () => {
        expect(html.includes('"basic":{')).toBeTruthy()
        expect(html.includes('"hello":"hello from model"')).toBeTruthy()
        expect(html.includes('"hasFetchData":true')).toBeTruthy()
        expect(html.includes('"todos":["todo-init"]')).toBeTruthy()
      })
    })

    describe('browser render', () => {
      beforeAll(async () => {
        await await page.goto(context.getUrl('/'))
        await await page.goto(context.getUrl('/model'))
      })

      test('bind init state of model', async () => {
        await expect(page).toMatchElement('#hello', 'hello from model')
        await expect(page).toMatchElement('#hasFetchData', 'true')
      })

      test('should load data by componentPrepare', async () => {
        await expect(page).toMatchElement('#hasFetchData', 'true')
        await expect(page).toMatchElement('#messagesCount', '1')
        await expect(page).toMatch('todo-init')
      })

      test('setState, sync call multiple times', async () => {
        await expect(page).toClick('#btnMultiEditState')
        await expect(page).toMatchElement('#multiEditState', '3')
      })
      test('getState, should return current model state', async () => {
        await expect(page).toClick('#btnGetState')
        await expect(page).toMatchElement('#jsonState', { text: /^\{"hello":"hello from model",[\s\S]*\}$/ })
      })
      test('getStoreState, should return current redux store state', async () => {
        await expect(page).toClick('#btnGetStoreState')
        await expect(page).toMatchElement('#jsonStoreState', { text: /^\{"@@joy":\{"isPrepared":false\},[\s\S]*\}$/ })
      })

      test('dispatch, call other method of model', async () => {
        await expect(page).toClick('#btnAutoAddTodo')
        await expect(page).toMatch('todo-auto-add-by-model')
      })
      test('dispatch, should return a promise with the value of target method', async () => {
        await expect(page).toMatchElement('#dispatchResult', 'todo-auto-add-by-model')
      })
    })
  })
}
