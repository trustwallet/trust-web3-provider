import commonjs from '@rollup/plugin-commonjs';
import { name, dependencies } from './package.json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

const input = './src/index.ts';
const plugins = [
  json(),
  nodePolyfills(),
  resolve({ browser: true, preferBuiltins: false }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    extensions: ['.js', '.ts'],
    exclude: 'node_modules/**',
    presets: [
      [
        '@babel/preset-env',
        {
          targets: 'chrome 67',
          corejs: '3.21.1',
        },
      ],
      '@babel/preset-typescript',
    ],
  }),
  inject({
    modules: {
      Buffer: ['buffer', 'Buffer'],
    },
  }),
];

function createConfig(packageName) {
  return [
    {
      input,
      plugins,
      output: {
        file: './dist/index.js',
        format: 'umd',
        name: packageName,
        sourcemap: false,
      },
    },
  ];
}

export default createConfig(name, Object.keys(dependencies));
