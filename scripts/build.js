import concurrently from 'concurrently';

/** @type {Record<string, boolean>} */
const args = {};
for (const arg of process.argv.slice(2)) {
  args[arg] = true;
}
const ARGS = {
  watch: args['-w'],
  production: !args['-w'] || args['-p'],
  isNode: args['--node'],
  js: args['--js'],
  rollup: args['--rollup'],
  noCheck: args['--no-check']
};

function esbuild(options) {
  return [
    (ARGS.js || !ARGS.rollup) && 'esbuild',
    'src/index.ts',
    '--bundle --outdir=lib',
    ARGS.isNode && '--platform=node',
    ARGS.watch && '--watch',
    ARGS.production && '--sourcemap',
    ...options
  ];
}

const check = [!ARGS.watch && !ARGS.noCheck && 'npm:check'];
const cjs = esbuild(['--format=cjs', '--out-extension:.js=.cjs']);
const esm = esbuild([
  '--format=esm',
  '--out-extension:.js=.mjs',
  ARGS.watch && '--log-level=silent'
]);
const rollup = [
  (!ARGS.js || ARGS.rollup) && 'rollup',
  '-c',
  ARGS.watch && '--watch --no-watch.clearScreen',
  ARGS.production && '--environment NODE_ENV:production'
];

const commands = [check, cjs, esm, rollup]
  .filter(script => script[0])
  .map(script => script.filter(s => s).join(' '));

const { result } = concurrently(commands, { raw: true, killOthers: 'failure' });
result.catch(error => {
  /** @type {import('concurrently').CloseEvent[]} */
  const events = Array.isArray(error) ? error : [];
  const event = events.find(
    event => typeof event.exitCode === 'number' && event.exitCode !== 0
  );
  process.exitCode = event ? event.exitCode : 1;
});
