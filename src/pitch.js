/* eslint-disable
  import/first,
  import/order,
  comma-dangle,
  linebreak-style,
  no-param-reassign,
  no-underscore-dangle,
  prefer-destructuring
*/
import schema from './options.json';
import loaderUtils from 'loader-utils';
import validateOptions from '@webpack-contrib/schema-utils';

import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import WebWorkerTemplatePlugin from 'webpack/lib/webworker/WebWorkerTemplatePlugin';
import FetchCompileWasmTemplatePlugin from 'webpack/lib/web/FetchCompileWasmTemplatePlugin';

import { PLUGIN_INFO } from './consts';
import WorkerLoaderError from './Error';

export default function pitch(request) {
  const options = loaderUtils.getOptions(this) || {};
  const compilerOptions = this._compiler.options || {};

  const publicPath = options.publicPath
    ? JSON.stringify(options.publicPath)
    : '__webpack_public_path__';

  validateOptions({ name: PLUGIN_INFO.name, schema, target: options });

  if (!this.webpack) {
    throw new WorkerLoaderError({
      name: PLUGIN_INFO.name,
      message: 'This loader is only usable with webpack',
    });
  }

  this.cacheable(false);

  const cb = this.async();

  const filename = loaderUtils.interpolateName(
    this,
    options.name || '[hash].thread.js',
    {
      context: options.context || this.rootContext || this.options.context,
      regExp: options.regExp,
    }
  );

  const worker = {};

  worker.options = {
    filename,
    chunkFilename: `[id].${filename}`,
    namedChunkFilename: null,
  };

  worker.compiler = this._compilation.createChildCompiler(
    'worker',
    worker.options
  );

  // Tapable.apply is deprecated in tapable@1.0.0-x.
  // The plugins should now call apply themselves.
  new WebWorkerTemplatePlugin(worker.options).apply(worker.compiler);
  new FetchCompileWasmTemplatePlugin({
    mangleImports: compilerOptions.optimization.mangleWasmImports,
  }).apply(worker.compiler);

  if (this.target !== 'webworker' && this.target !== 'web') {
    new NodeTargetPlugin().apply(worker.compiler);
  }

  new SingleEntryPlugin(this.context, `!!${request}`, 'main').apply(
    worker.compiler
  );

  const subCache = `subcache ${__dirname} ${request}`;

  worker.compilation = (compilation) => {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) {
        compilation.cache[subCache] = {};
      }

      compilation.cache = compilation.cache[subCache];
    }
  };

  if (worker.compiler.hooks) {
    const plugin = { name: PLUGIN_INFO.name };

    worker.compiler.hooks.compilation.tap(plugin, worker.compilation);
  } else {
    worker.compiler.plugin('compilation', worker.compilation);
  }

  worker.compiler.runAsChild((err, entries, compilation) => {
    if (!err && compilation.errors && compilation.errors.length) {
      err = compilation.errors[0];
    }

    const entry = entries && entries[0] && entries[0].files[0];
    if (!err && !entry) err = Error(`WorkerPlugin: no entry for ${request}`);
    if (err) {
      cb(err);
      return;
    }

    if (options.inline) {
      cb(
        null,
        `var worker = require('@jc-lab/threads').Worker; module.exports = function() { return worker.fromScript(${JSON.stringify(
          compilation.assets[entry].source()
        )}); };`
      );
    } else {
      cb(
        null,
        `var worker = require('@jc-lab/threads').Worker; module.exports = function() { return new worker(${publicPath} + ${JSON.stringify(
          entry
        )}); };`
      );
    }
  });
}
