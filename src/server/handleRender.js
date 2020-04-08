import React from 'react';
import { renderToString } from 'react-dom/server';
import { matchPath } from 'react-router-dom';
import { StaticRouter } from 'react-router';
import { Provider } from 'react-redux';
import Router, { routes } from '../universal/routes';
import renderFullPage from './renderFullPage';
import createReduxStore from '../universal/createReduxStore';

export default function handleRender(req, res) {
  const promises = [];

  const store = createReduxStore({ server: true });

  let matchedRoute;

  routes.some((route) => {
    matchedRoute = matchPath(req.path, route);
    if (matchedRoute && route.loadData) promises.push(store.dispatch(route.loadData()));
    return matchedRoute;
  });

  return Promise.all(promises).then(() => {
    const html = renderToString( // eslint-disable-line
      <Provider store={store}>
        <StaticRouter location={req.url} context={{}}>
          <Router />
        </StaticRouter>
      </Provider>);

    const preloadedState = store.getState();

    return res
      .status(matchedRoute && matchedRoute.isExact ? 200 : 404)
      .send(renderFullPage(html, preloadedState));
  });
}
