import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
if (!['chrome', 'firefox'].includes(target)) throw new Error('Choose chrome or firefox.');
const source = join(root, 'extension');
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
if (!/^(0|[1-9][0-9]{0,4})(\.(0|[1-9][0-9]{0,4})){0,3}$/.test(manifest.version)
  || manifest.version.split('.').some(part => Number(part) > 65535)
  || manifest.version.split('.').every(part => Number(part) === 0)) {
  throw new Error('Use a valid nonzero Chrome-compatible version.');
}

// Explicit runtime allowlist. Review it when adding extension functionality.
// Publishing drafts, backend files, dependencies and secrets never enter the ZIP.
const runtimeFiles = ['icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png',
  'shared.js', 'lookup.js', 'background.js', 'content.js', 'options.html', 'options.css', 'options.js',
  'fonts/vt323-latin-400.woff2', 'fonts/OFL.txt'];
const expectedRootFiles = new Set(['manifest.json', 'icons', 'fonts', ...runtimeFiles.filter(path => !path.includes('/'))]);
for (const name of readdirSync(source)) {
  if (!expectedRootFiles.has(name)) throw new Error(`Review the runtime allowlist before packaging ${name}.`);
}
function checkTree(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error('Runtime files must not be symbolic links.');
  if (stat.isDirectory()) for (const name of readdirSync(path)) checkTree(join(path, name));
}
checkTree(source);
for (const dir of ['icons', 'fonts']) {
  for (const name of readdirSync(join(source, dir))) {
    if (!runtimeFiles.includes(`${dir}/${name}`)) throw new Error(`Unexpected runtime asset: ${dir}/${name}`);
  }
}
for (const path of Object.values(manifest.icons ?? {})) {
  if (!/^icons\/icon-(16|32|48|128)\.png$/.test(path) || !existsSync(join(source, path))) {
    throw new Error(`Missing or unexpected icon: ${path}`);
  }
}
if (target === 'firefox') {
  Object.assign(manifest, JSON.parse(readFileSync(join(root, 'publishing/manifest.firefox.json'), 'utf8')));
}
const outputDir = join(root, 'dist');
mkdirSync(outputDir, { recursive: true });
const output = join(outputDir, `naughty-list-${target}-${manifest.version}.zip`);
const staging = mkdtempSync(join(tmpdir(), 'naughty-list-extension-'));
const licenceFiles = existsSync(join(root, 'LICENSE')) ? ['LICENSE'] : [];
try {
  writeFileSync(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  mkdirSync(join(staging, 'icons'));
  mkdirSync(join(staging, 'fonts'));
  for (const file of licenceFiles) cpSync(join(root, file), join(staging, file));
  for (const file of runtimeFiles) cpSync(join(source, file), join(staging, file));
  // Remove only this generated archive before rebuilding, so zip cannot retain old entries.
  rmSync(output, { force: true });
  execFileSync('zip', ['-q', '-r', '-X', output, 'manifest.json', ...licenceFiles, ...runtimeFiles], { cwd: staging });
  console.log(`Prepared dist/naughty-list-${target}-${manifest.version}.zip. Review the publication checklist before store submission.`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
