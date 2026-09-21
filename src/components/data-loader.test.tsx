import * as React from 'react';
import {act, render} from '@testing-library/react';
import {screen, waitFor} from '@testing-library/dom';
import '@testing-library/jest-dom';
import {BehaviorSubject} from 'rxjs';
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

test('DataLoader RTL: keeps receiving observable emissions after Suspense hides and re-shows the tree', async () => {
  const subject = new BehaviorSubject('first');

  // suspends the sibling subtree until the gate resolves
  let resolveGate: () => void;
  const gate = new Promise<void>((resolve) => (resolveGate = resolve));
  let suspend = false;
  const pending = gate.then(() => {
    suspend = false;
  });
  const MaybeSuspend = (): null => {
    if (suspend) {
      throw pending;
    }
    return null;
  };

  const makeTree = () => (
    <React.Suspense fallback={<p>fallback</p>}>
      <DataLoader load={() => subject}>
        {(result) => <p>{result}</p>}
      </DataLoader>
      <MaybeSuspend />
    </React.Suspense>
  );

  const {rerender} = render(makeTree());
  await waitFor(() => expect(screen.getByText('first')).toBeInTheDocument());

  suspend = true;
  rerender(makeTree());
  await waitFor(() => expect(screen.getByText('fallback')).toBeInTheDocument());

  await act(async () => {
    resolveGate();
    await pending;
  });
  await waitFor(() => expect(screen.getByText('first')).toBeInTheDocument());

  act(() => subject.next('second'));
  await waitFor(() => expect(screen.getByText('second')).toBeInTheDocument());
});
