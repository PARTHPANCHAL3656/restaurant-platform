import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { PassThrough } from 'node:stream';
import App from './App.jsx';

export function render(url = '/') {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const passthrough = new PassThrough();
    passthrough.on('data', (chunk) => chunks.push(chunk));
    passthrough.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    passthrough.on('error', reject);

    const { pipe, abort } = renderToPipeableStream(
      <App RouterComponent={StaticRouter} routerProps={{ location: url }} />,
      {
        onShellReady() {
          pipe(passthrough);
          // LandingPageContent is intentionally deferred to the client and
          // is built to never resolve during SSR (see LandingPage.jsx).
          // Abort right after the shell flushes so React properly closes
          // out that boundary using its real "load this on the client"
          // marker, instead of the stream hanging open forever waiting on
          // a promise that's designed to never settle.
          abort();
        },
        onShellError(err) {
          reject(err);
        },
        onError() {
          // Expected: the deferred LandingPageContent boundary reports an
          // error here because we intentionally aborted it. Non-fatal —
          // the shell content we actually want is already captured.
        },
      }
    );
  });
}