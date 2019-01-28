import React from 'react'

export default class EditStyledJSXCtl extends React.Component {
  render () {
    return (
      <div id={'hello'}>
        hello from EditStyledJSXCtl
        <style jsx>{`
              #hello {
                font-size: 100px;
              }
            `}</style>
      </div>
    )
  }
}
