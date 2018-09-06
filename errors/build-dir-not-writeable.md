# Build directory not writeable

#### Why This Error Occurred

The filesystem does not allow writing to the specified directory. A common cause for this error is starting a `custom server` in development mode on a production server.

#### Possible Ways to Fix It

When using a custom server with a server file, for example called `server.js`, make sure you update the scripts key in `package.json` to:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "joy build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

and the custom server starts @symph/joy in production mode when `NODE_ENV` is `production`

```js
const joy = require('@symph/joy')

const dev = process.env.NODE_ENV !== 'production'
const app = joy({ dev })
```

### Useful Links

- [Custom Server documentation + examples](https://reacttraining.com/react-router/web/guides/philosophy)
