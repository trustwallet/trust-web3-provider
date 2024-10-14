import commonjs from '@rollup/plugin-commonjs';
import { name, dependencies } from './package.json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const input = './index.ts';
const plugins = [
  nodePolyfills(),
  resolve({ browser: true, preferBuiltins: false }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    extensions: ['.js', '.ts'],
    exclude: 'node_modules/**',
  }),
  inject({
    modules: {
      Buffer: ['buffer', 'Buffer'],
    },
  }),
  terser(),
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
        file: '../../android/lib/src/main/res/raw/trust_min.js',
        format: 'umd',
        name: packageName,
        sourcemap: false,
        ...umd,
      },
    },
  ];
}

export default createConfig(name, Object.keys(dependencies));
