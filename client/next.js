import initNext, * as next from './'

window.joy = next

initNext()
  .catch((err) => {
    console.error(`${err.message}\n${err.stack}`)
  })
