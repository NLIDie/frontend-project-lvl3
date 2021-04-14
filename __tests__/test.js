// @ts-check

import { promises as fs } from 'fs';
import path from 'path';
import { screen } from '@testing-library/dom';

import '@testing-library/jest-dom';

beforeEach(async () => {
  const pathToHtml = path.resolve(__dirname, '__fixtures__/index.html');
  const html = await fs.readFile(pathToHtml, 'utf8');
  document.body.innerHTML = html;
});

test('rss-form', async () => {
  const rssURLField = await screen.findByTestId('rss-url-field');
  const rssBtnSubmit = await screen.findByTestId('rss-btn-submit');

  expect(rssURLField).toBeInTheDocument();
  expect(rssBtnSubmit).toBeInTheDocument();
});
