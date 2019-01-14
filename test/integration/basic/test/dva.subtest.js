import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  killApp,
  waitFor
} from 'joy-test-utils'

export default (context) => {
  describe('dva model', () => {
    test('[server] init state', async () => {
      const html = await renderViaHTTP(context.getUrl('/dva/model'))
      expect(html).toMatch('<div>msg:hello from dav model</div>')
      expect(html).toMatch('"msg":"hello from dav model"') // in __JOY_DATA__
    })
    describe('call dva model', () => {
      beforeAll(async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dva/model"]')
      })
      test('init state', async () => {
        await expect(page).toMatch('msg:hello from dav model')
      })
      test('call reducer', async () => {
        await expect(page).toClick('#callReducer')
        await expect(page).toMatch('reducer:set by reducer')
      })
      test('call effect', async () => {
        await expect(page).toClick('#callEffect')
        await expect(page).toMatch('count:1')
      })
    })
    describe('component prepare', () => {
      test('[server]component prepare', async () => {
        const html = await renderViaHTTP(context.getUrl('/dva/prepare'))
        expect(html).toMatch('<div>prepare:1</div>')
      })
      test('component prepare', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dva/prepare"]')
        await expect(page).toMatch('prepare:1')
      })
    })
  })
}
