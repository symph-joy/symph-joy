import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  killApp,
  waitFor
} from 'joy-test-utils'

export default (context) => {
  describe('error recovery', () => {
    test('[server]status 404', async () => {
      const resp = await fetchViaHTTP(context.getUrl('/__404'))
      expect(resp.status).toBe(404)
      const html = await resp.text()
      expect(html).toMatch('Sorry, can’t find that.')
    })

    test('[server]status 302', async () => {
      const resp = await fetchViaHTTP(context.getUrl('/redirect'))
      expect(resp.url).toMatch('\/302_target')
    })

    test('[browser]statusCode 302, with server render', async () => {
      await page.goto(context.getUrl('/redirect'))
      await expect(page).toMatch('the target page of 302')
    })
    test('[browser]status 302, redirect on browser', async () => {
      await page.goto(context.getUrl('/'))
      await expect(page).toClick('[href="/redirect"]')
      await waitFor(100)
      await expect(page).toMatch('the target page of 302')
    })

    if (context.isDev) {
      test('[server, dev]status 500, throw an error in render of component', async () => {
        const resp = await fetchViaHTTP(context.getUrl('/err500'))
        expect(resp.status).toBe(500)
        const html = await resp.text()
        if (context.isDev) {
          expect(html).toMatch('{"name":"Error","message":"i am error"') // error object in __JOY_DATA__
        } else {
          expect(html).toMatch('"err":{"statusCode":500,"message":"i am error"}') // error object in __JOY_DATA__
        }
      })

      test('[browser, dev]status 500, throw an error in render of component', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/err500"]')
        if (context.isDev) {
          await waitFor(2000)
          const html = await page.evaluate(() =>
            document.getElementsByTagName('iframe')[0].contentWindow.document.body.innerHTML)
          expect(html).toMatch('Error: i am error')
          // await expect(page).toMatch('Error: i am error', {timeout: 3000}) 错误信息在iframe中，所以不能使用该方法来判断
        } else {
          await expect(page).toMatch('An unexpected error has occurred', {timeout: 3000})
        }

      })
    }
  })
}
