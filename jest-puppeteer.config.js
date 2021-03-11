'use strict'

module.exports = {
  launch: {
    dumpio: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  browserContext: 'default',
  exitOnPageError: false
}
