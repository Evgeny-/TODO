import { context } from 'esbuild';

const enableFileWatching = !!process.argv.includes('--watch');

(async () => {
  /** @type {import('esbuild').BuildOptions} */
  const opts = {
    bundle: true,
    format: 'esm',
    logLevel: 'info',
    packages: 'external',
    platform: 'node',
    sourcemap: false,
    target: ['node20'],
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
  };

  const ctx = await context(opts);

  if (enableFileWatching) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
})();
