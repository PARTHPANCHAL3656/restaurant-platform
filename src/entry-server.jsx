import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';

export function render(url = '/') {
  return renderToString(
    <App RouterComponent={StaticRouter} routerProps={{ location: url }} />
  );
}