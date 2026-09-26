import * as React from 'react';
import {render} from '@testing-library/react';
import {screen, waitFor} from '@testing-library/dom';
import '@testing-library/jest-dom';
import {AppContext, AppContextReact} from '../context';
import {DataLoader} from './data-loader';

test('DataLoader RTL: renders result of promise-based load', async () => {
  const promise = Promise.resolve('foo');
  render(
    <DataLoader load={() => promise}>
      {(result) => <p>{result}</p>}
    </DataLoader>,
  );

  await waitFor(() => expect(screen.getByText('foo')).toBeInTheDocument());
});

test('DataLoader RTL: calls load with input when provided', async () => {
  const loadFn = jest.fn().mockResolvedValue('foo');
  render(
    <DataLoader load={loadFn} input={'bar'}>
      {(result) => <p>{result}</p>}
    </DataLoader>,
  );

  await waitFor(() => expect(screen.getByText('foo')).toBeInTheDocument());
  expect(loadFn).toHaveBeenCalledWith('bar');
});

test('DataLoader RTL: shows an error notification when load fails without errorRenderer', async () => {
  const show = jest.fn();
  const appContext = {apis: {notifications: {show}}} as unknown as AppContext;
  render(
    <AppContextReact.Provider value={appContext}>
      <DataLoader load={() => Promise.reject(new Error('boom'))}>
        {(result) => <p>{result}</p>}
      </DataLoader>
    </AppContextReact.Provider>,
  );

  await waitFor(() => expect(show).toHaveBeenCalledTimes(1));
});

test('DataLoader RTL: does not show an error notification when an errorRenderer is provided', async () => {
  const show = jest.fn();
  const appContext = {apis: {notifications: {show}}} as unknown as AppContext;
  render(
    <AppContextReact.Provider value={appContext}>
      <DataLoader load={() => Promise.reject(new Error('boom'))} errorRenderer={() => <p>custom error</p>}>
        {(result) => <p>{result}</p>}
      </DataLoader>
    </AppContextReact.Provider>,
  );

  await waitFor(() => expect(screen.getByText('custom error')).toBeInTheDocument());
  expect(show).not.toHaveBeenCalled();
});
