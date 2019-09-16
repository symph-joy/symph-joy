import {
  renderViaHTTP,
  fetchViaHTTP,
  findPort,
  launchApp,
  killApp,
  waitFor,
  check
} from 'joy-test-utils'
import { join } from 'path'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'

export default (context) => {
  if (!context.isDev) {
    return
  }
  describe('hot module reloading', () => {

    describe('editing a file', () => {

      test('controller should refresh', async () => {
        await page.goto(context.getUrl('/hmr/editFile'))
        await expect(page).toMatch('hello from EditFileCtl')

        const filePath = join(__dirname, '../src/controller/hmr/EditFileCtl.js')
        const originalContent = readFileSync(filePath, 'utf8')
        const editedContent = originalContent.replace('hello from EditFileCtl', 'cool controller')
        writeFileSync(filePath, editedContent, 'utf8')

        try { await expect(page).toMatch('cool controller', {timeout: 3000})} finally {
          writeFileSync(filePath, originalContent, 'utf8')
        }
      })

      test('should not reload unrelated pages', async () => {
        await page.goto(context.getUrl('/hmr/hello'))
        await expect(page).toMatch('hello from HMRHelloCtl')
        await page.$eval('#hello', el => el.innerHTML = 'hello from test')
        await expect(page).toMatch('hello from test')

        const filePath = join(__dirname, '../src/controller/hmr/EditFileCtl.js')
        const originalContent = readFileSync(filePath, 'utf8')
        const editedContent = originalContent.replace('hello from EditFileCtl', 'cool controller')
        writeFileSync(filePath, editedContent, 'utf8')

        let hasNotMatch = false
        try { await expect(page).toMatch('hello from HMRHelloCtl', {timeout: 2000})} catch (e) {
          hasNotMatch = true
        } finally {
          writeFileSync(filePath, originalContent, 'utf8')
          if (!hasNotMatch) {
            throw new Error('unrelated component was reloaded')
          }
        }
      })

      test('should update styles correctly', async () => {
        await page.goto(context.getUrl('/hmr/editStyle'))
        let fontSize = await page.$eval('#hello', el => el.computedStyleMap().get('font-size').value)
        expect(fontSize).toBe(100)

        const filePath = join(__dirname, '../src/controller/hmr/EditStyledJSXCtl.js')
        const originalContent = readFileSync(filePath, 'utf8')
        const editedContent = originalContent.replace('100px', '200px')
        writeFileSync(filePath, editedContent, 'utf8')

        // await waitFor(1500)
        // fontSize = await page.$eval('#hello', el => el.computedStyleMap().get('font-size').value)
        //
        // try { expect(fontSize).toBe(200)} finally {
        //   writeFileSync(filePath, originalContent, 'utf8')
        // }

        try {
          check(async () => await page.$eval('#hello', el => el.computedStyleMap().get('font-size').value + ''), /200/)
        } finally {
          writeFileSync(filePath, originalContent, 'utf8')
        }
      })

      test('dynamic load controller should refresh', async () => {
        await page.goto(context.getUrl('/hmr/dynamicComp'))
        await expect(page).toMatch('hello from DynamicComponentCtl', {timeout: 5000})
        await expect(page).toMatch('hello from EditFileCtl', {timeout: 5000})

        const filePath = join(__dirname, '../src/controller/hmr/EditFileCtl.js')
        const originalContent = readFileSync(filePath, 'utf8')
        const editedContent = originalContent.replace('hello from EditFileCtl', 'cool controller')
        writeFileSync(filePath, editedContent, 'utf8')

        try { await expect(page).toMatch('cool controller', {timeout: 10000})} finally {
          writeFileSync(filePath, originalContent, 'utf8')
        }

      })

    })
  })
}
