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

async function get$ (path, query) {
  const html = await renderViaHTTP(path, query)
  return cheerio.load(html)
}

export default (context) => {
  describe('dynamic load', () => {
    test('[server]should render dynamic import components', async () => {
      let html = await renderViaHTTP(context.getUrl('/dynamic/loadComponent'))
      if (context.isDev) {
        expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello/)
      }
      expect(html).toMatch(/hello world/)
    })

    test('[server]should render dynamic import components using a function as first parameter', async () => {
      let html = await renderViaHTTP(context.getUrl('/dynamic/function'))
      if (context.isDev) {
        expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello/)
      }
      expect(html).toMatch(/hello world/)
    })

    test('[server]custom chunk file name', async () => {
      let html = await renderViaHTTP(context.getUrl('/dynamic/chunkFileName'))
      expect(html).toMatch(/custom-hello-world(\.[a-z0-9]*)*.js/i)
    })

    test('[server]should render the component Head content', async () => {
      let html = await renderViaHTTP(context.getUrl('/dynamic/withHead'))
      expect(html).toMatch('<title class="joy-head">title from dynamic component</title>')
    })
    if (context.isDev) {
      test('should render the component Head content', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dynamic/withHead"]')
        let title = await page.evaluate(() => document.title)
        expect(title).toMatch('title from dynamic component')
      })
    }

    describe('ssr:false option', () => {
      test('should render loading on the server side', async () => {
        let html = await renderViaHTTP(context.getUrl('/dynamic/noSSR'))
        expect(html).toMatch('...')
        expect(html).not.toMatch('component_Hello_js')
      })

      it('should render the component on client side', async () => {
        await page.goto(context.getUrl('/dynamic/noSSR'))
        await expect(page).toMatch('hello world')
      })
    })

    describe('custom loading', () => {
      it('should render custom loading on the server side when `ssr:false` and `loading` is provided', async () => {
        let html = await renderViaHTTP(context.getUrl('/dynamic/customLoading'))
        expect(html).toMatch('custom loading...')
      })

      it('should render the component on client side', async () => {
        await page.goto(context.getUrl('/dynamic/customLoading'))
        await expect(page).toMatch('hello world')
      })
    })

    describe('bundle imports', () => {
      it('should render dynamic imports bundle', async () => {
        let html = await renderViaHTTP(context.getUrl('/dynamic/bundle'))
        if (context.isDev) {
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]HelloContext/)
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello1/)
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello2/)
        }
        expect(html).toMatch('Dynamic Bundle')
        expect(html).toMatch('hello world 1')
        expect(html).not.toMatch('hello world 2')
      })

      it('should render dynamic imports bundle with additional components', async () => {
        let html = await renderViaHTTP(context.getUrl('/dynamic/bundle?showMore=1'))
        if (context.isDev) {
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]HelloContext/)
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello1/)
          expect(html).toMatch(/src[\/\._\-]component[\/\._\-]Hello2/)
        }
        expect(html).toMatch('Dynamic Bundle')
        expect(html).toMatch('hello world 1')
        expect(html).toMatch('hello world 2')
      })

      it('[browser] render components', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dynamic/bundle?showMore=1"]')
        await expect(page).toMatch('Dynamic Bundle')
        await expect(page).toMatch('hello content joy')
        await expect(page).toMatch('hello world 1')
        await expect(page).toMatch('hello world 2')
      })

      it('[server]should render support React context', async () => {
        let html = await renderViaHTTP(context.getUrl('/dynamic/bundle'))
        expect(html).toMatch('hello content <!-- -->joy')
      })

      it('[browser]should render support React context', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dynamic/bundle"]')
        await expect(page).toMatch('hello content joy')
      })

      it('should load new components and render for prop changes', async () => {
        await page.goto(context.getUrl('/'))
        await expect(page).toClick('[href="/dynamic/bundle"]')
        await expect(page).toClick('#toggle-show-more')
        await expect(page).toMatch('hello world 2')
      })
    })
  })
}
