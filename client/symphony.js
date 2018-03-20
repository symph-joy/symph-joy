import initSymphony, * as symphony from './'

window.symphony = symphony

initSymphony()
  .catch((err) => {
    console.error(`${err.message}\n${err.stack}`)
  })
