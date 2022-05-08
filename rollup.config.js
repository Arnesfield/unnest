import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const plugins = [typescript()];

function output(...formats) {
  return formats.map(format => {
    return {
      dir: `lib/${format}`,
      format: format,
      sourcemap: true,
      exports: 'named',
      preserveModules: true
    };
  });
}

export default [
  {
    input: 'src/index.umd.ts',
    output: {
      name: 'unnest',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
      exports: 'default'
    },
    plugins
  },
  { input: 'src/index.ts', output: output('cjs', 'esm'), plugins }
];
