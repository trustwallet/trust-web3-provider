import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { name, dependencies } from './package.json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject';
import json from '@rollup/plugin-json';

const input = './index.ts';
const plugins = [
  json(),
  nodeResolve({ preferBuiltins: false, browser: true }),
  commonjs(),
  inject({
    modules: {
      Buffer: ['buffer', 'Buffer'],
    },
    // tweetnacl-util (via tronweb) maps `buffer` to false in its browser
    // field and feature-detects Buffer at runtime — injecting the import
    // there resolves to an empty module and hard-fails the build.
    exclude: ['**/tweetnacl-util/**'],
  }),
  nodePolyfills(),
  esbuild({
    minify: true,
    tsconfig: './tsconfig.json',
    loaders: {
      '.json': 'json',
    },
  }),
];

function createConfig(
  packageName,
  packageDependencies,
  umd = {},
  cjs = {},
  es = {},
) {
  return [
    {
      input,
      plugins,
      output: {
        file: './swift/trust-min.js',
        format: 'umd',
        exports: 'named',
        name: packageName,
        sourcemap: false,
        ...umd,
      },
    },
  ];
}

export default createConfig(name, Object.keys(dependencies));
