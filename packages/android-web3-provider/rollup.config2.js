import { name, dependencies } from './package.json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const input = './dist/index.js';

const plugins = [
  babel({
    babelHelpers: 'bundled',
    extensions: ['.js'],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: 'chrome 67',
          useBuiltIns: false,
          corejs: '3.21.1',
        },
      ],
    ],
  }),

  terser(),
];

function createConfig(packageName) {
  return [
    {
      input,
      plugins,
      output: {
        file: '../../android/lib/src/main/res/raw/trust_min.js',
        format: 'umd',
        name: packageName,
        sourcemap: false,
        extend: true,
      },
    },
  ];
}

export default createConfig(name, Object.keys(dependencies));
