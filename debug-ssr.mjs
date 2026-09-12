import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
  const html = await render('/');
  console.log('--- SUCCESS, first 2000 chars ---');
  console.log(html.slice(0, 2000));
} catch (err) {
  console.error('--- SSR THREW ---');
  console.error(err);
}
await vite.close();
