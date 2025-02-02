import './assets/main.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core';
import { HashRouter, Routes, Route } from 'react-router';
import { Collections } from './pages/collections/collections';
import { Todos } from './pages/todos/todos';
import { Login } from './pages/login/login';
import { AppLayout } from './pages/app-layout';
import { PageLayout } from './pages/page-layout';
import { Notifications } from '@mantine/notifications';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ColorSchemeScript />
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Login />} />
            <Route element={<PageLayout />}>
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:key" element={<Todos />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>,
);

const html = document.querySelector('html');

for (const prop in mantineHtmlProps) {
  if (prop in mantineHtmlProps) {
    html?.setAttribute(prop, mantineHtmlProps[prop]);
  }
}
