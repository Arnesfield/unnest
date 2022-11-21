import eslint from '@rollup/plugin-eslint';
import typescript from '@rollup/plugin-typescript';
import bundleSize from 'rollup-plugin-bundle-size';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import pkg from './package.json' assert { type: 'json' };

const name = pkg.name.slice(pkg.name.lastIndexOf('/') + 1);
const input = 'src/index.ts';
const inputUmd = 'src/index.umd.ts';
// skip sourcemap and umd unless production
const WATCH = process.env.ROLLUP_WATCH === 'true';
const PROD = !WATCH || process.env.NODE_ENV === 'production';

function out(options) {
  return {
    sourcemap: PROD,
    exports: 'named',
    ...options,
    plugins: [bundleSize()].concat(options.plugins || [])
  };
}

function umd(options) {
  return out({ format: 'umd', name, exports: 'default', ...options });
}

function dev(options) {
  return { input, watch: { skipWrite: true }, ...options };
}

const configs = [
  {
    input: inputUmd,
    output: umd({ file: pkg.unpkg.replace(/\.min\.js$/, '.js') }),
    plugins: [esbuild()],
    include: PROD
  },
  {
    input: inputUmd,
    output: umd({ file: pkg.unpkg }),
    plugins: [esbuild({ minify: true })],
    include: PROD
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [bundleSize(), dts()]
  },
  // lint and type checking
  dev({ plugins: [eslint(), esbuild()], include: WATCH }),
  dev({ plugins: [typescript()], include: WATCH })
];

export default configs.filter(config => {
  const { include } = config;
  delete config.include;
  return typeof include !== 'boolean' || include;
});
