// Runs after `vite build` (client build already produced dist/).
// 1. Builds a Node-runnable SSR bundle from src/entry-server.jsx
// 2. Renders the "/" route to an HTML string
// 3. Preserves the original client shell as dist/app-shell.html (served
//    for every other route — see vercel.json)
// 4. Injects the rendered markup into dist/index.html (served only at "/")

import { build } from 'vite';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const distDir = path.join(root, 'dist');
const ssrOutDir = path.join(root, 'dist-ssr');

async function main() {
  // 1. Build the SSR entry into a Node-runnable ESM module.
  await build({
    root,
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: 'dist-ssr',
      emptyOutDir: true,
      reportCompressedSize: false, // dist-ssr/ gets deleted below — no point gzip-sizing it
      // Without this, Vite resolves imported images to their absolute path
      // on the BUILD MACHINE's disk (e.g. /vercel/path0/assets/...) instead
      // of the public URL the client uses (/assets/xxx-hash.webp) — those
      // filesystem paths get baked into the prerendered HTML and are
      // meaningless (and blocked) in an actual visitor's browser. This
      // makes SSR resolve asset imports the same way the client build does.
      ssrEmitAssets: true,
      rollupOptions: {
        output: { format: 'es' },
      },
    },
  });

  // 2. Import the built module and render "/".
  const entryPath = path.join(ssrOutDir, 'entry-server.js');
  const { render } = await import(pathToFileURL(entryPath).href);
  const appHtml = await render('/');

  // 3. Preserve the original client shell before it gets overwritten.
  const shellHtml = await readFile(path.join(distDir, 'index.html'), 'utf-8');
  await writeFile(path.join(distDir, 'app-shell.html'), shellHtml, 'utf-8');

  // 4. Splice the rendered markup into the root div and write it as the
  // new index.html.
  if (!shellHtml.includes('<div id="root"></div>')) {
    throw new Error(
      'prerender.js: expected to find <div id="root"></div> in dist/index.html — ' +
      'the build output may have changed, check index.html manually before re-running.'
    );
  }
  const prerenderedHtml = shellHtml.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`
  );
  await writeFile(path.join(distDir, 'index.html'), prerenderedHtml, 'utf-8');

  // Clean up the intermediate SSR build — not needed in the deployment.
  await rm(ssrOutDir, { recursive: true, force: true });

  console.log('✓ Prerendered "/" and wrote dist/app-shell.html fallback.');
}

main().catch((err) => {
  console.error('prerender.js failed:', err);
  process.exit(1);
});