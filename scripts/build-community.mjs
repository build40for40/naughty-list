import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/community/community', { recursive: true });
await Promise.all(['index.html', 'community.css'].map(file => copyFile(`web/${file}`, `dist/community/community/${file}`)));
await build({ entryPoints: ['web/community.js'], bundle: true, format: 'esm', target: ['es2022'],
  minify: true, outfile: 'dist/community/community/community.js' });
console.log('Built community voting page.');
