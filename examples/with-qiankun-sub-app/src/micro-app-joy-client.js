import react from 'react'
import ReactDOM from 'react-dom'
import initJoy, * as joy from '@symph/joy/dist/client/index'

window.joy = joy
if (!window.__POWERED_BY_QIANKUN__) {
  initJoy()
    .catch((err) => {
      console.error(`${err.message}\n${err.stack}`)
    })
}


export async function bootstrap() {
  console.log('[react16] react app bootstraped');
}

export async function mount(props) {
  console.log('[react16] props from main framework', props);
  const childContainer = props.container ? props.container.querySelector('#__joy') : undefined
  initJoy({ domContainer: childContainer })
    .catch((err) => {
      console.error(`${err.message}\n${err.stack}`)
    })
}

export async function unmount(props) {
  const childContainer = props.container ? props.container.querySelector('#__joy') : undefined
  ReactDOM.unmountComponentAtNode(childContainer)
}

