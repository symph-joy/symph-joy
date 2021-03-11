import { Route } from '@symph/joy/router'

export const Status = ({code, children}) => (
  <Route
    render={({staticContext}) => {
      if (staticContext) staticContext.status = code
      return children
    }}
  />
)

export default () => (
  <Status code={404}>
    <div>
      <h1>404 page</h1>
    </div>
  </Status>
)
