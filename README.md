# threads-loader

threads worker loader module for webpack

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `threads-loader`:

```console
$ npm install threads-loader --save-dev
```

### Inlined

```js
// App.js
import Worker from 'threads-loader!./Worker.js';
```

### Config

```js
// webpack.config.js
{
  module: {
    rules: [
      {
        test: /\.thread\.js$/,
        use: { loader: 'threads-loader' }
      },
      {
        test: /\.thread\.ts$/,
        use: [
            { loader: 'ts-loader' },
            { loader: 'threads-loader' }
        ]
      }
    ]
  }
}
```

```js
// App.js
import { spawn } from 'threads';
import worker from 'threads-loader!./test.js';
const instance = await spawn(worker);
...
```

And run `webpack` via your preferred method.

## Options

### `name`

Type: `String`
Default: `[hash].thread.js`

To set a custom name for the output script, use the `name` parameter. The name
may contain the string `[hash]`, which will be replaced with a content dependent
hash for caching purposes. When using `name` alone `[hash]` is omitted.

```js
// webpack.config.js
{
  loader: 'threads-loader',
  options: { name: 'WorkerName.[hash].js' }
}
```

### publicPath

Type: `String`
Default: `null`

Overrides the path from which worker scripts are downloaded. If not specified,
the same public path used for other webpack assets is used.

```js
// webpack.config.js
{
  loader: 'threads-loader',
  options: { publicPath: '/scripts/workers/' }
}
```

### Integrating with TypeScript

To integrate with TypeScript, you will need to define a custom module for the exports of your worker

```typescript
// typings/custom.d.ts
declare module "threads-loader!*" {
  import WebpackThreadsWorker from 'threads-loader/types'
  export default WebpackThreadsWorker;
}
```

```typescript
// App.ts
import { spawn } from 'threads';
import worker from 'threads-loader!./test.js';
const instance = await spawn(worker);
...
```

## License

#### [MIT](./LICENSE)

## Thanks for [worker-loader](https://github.com/webpack-contrib/worker-loader)
threads-loader is built on the code of worker-loader.