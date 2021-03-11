import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  killApp,
  waitFor
} from 'joy-test-utils'

export default (context) => {
  describe('head', () => {
    test('[server]should render custom title', async () => {
      const html = await renderViaHTTP(context.getUrl('/head/renderTitle'))
      expect(html).toMatch('<title class="joy-head">hello title</title>')
    })
    test('should render custom title', async () => {
      await page.goto(context.getUrl('/'))
      await expect(page).toClick('[href="/head/renderTitle"]')
      let title = await page.evaluate(() => document.title)
      expect(title).toMatch('hello title')
    })

    test('[server]duplicate title in head, only the last one should rendered', async () => {
      const html = await renderViaHTTP(context.getUrl('/head/duplicateTitle'))
      expect(html).not.toMatch('<title class="joy-head">first title</title>')
      expect(html).toMatch('<title class="joy-head">second title</title>')
    })
    test('duplicate title in head, only the last one should rendered', async () => {
      await page.goto(context.getUrl('/'))
      await expect(page).toClick('[href="/head/duplicateTitle"]')
      let title = await page.evaluate(() => document.title)
      expect(title).toMatch('second title')
    })
  })
}
