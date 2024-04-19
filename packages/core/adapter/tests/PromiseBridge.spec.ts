import { expect, test, jest } from 'bun:test';
import { PromiseAdapter } from '../PromiseAdapter';
import { AdapterStrategy, IAdapterRequestParams } from '../Adapter';
import { IHandlerParams } from '../CallbackAdapter';

test('PromiseAdapter → Strategy is correct', () => {
  const adapter = new PromiseAdapter();
  expect(adapter.getStrategy()).toEqual(AdapterStrategy.PROMISES);
});

test('PromiseAdapter → Handler is set and resolved promise', async () => {
  const adapter = new PromiseAdapter();
  const response = 'pong';

  const handler = jest.fn((_params: IHandlerParams) => {
    return Promise.resolve(response);
  });

  adapter.setHandler(handler);

  const params = { method: 'ping', params: [] };
  const promise = adapter.request(params, 'ethereum');

  expect(handler).toHaveBeenCalled();
  expect(promise).resolves.toBe(response);
});

test('PromiseAdapter → Handler is set and rejects promise', async () => {
  const adapter = new PromiseAdapter();

  const response = 'error';

  const handler = jest.fn((_params: IHandlerParams) => {
    return Promise.reject(response);
  });

  adapter.setHandler(handler);

  const params = { method: 'ping', params: [] };

  const promise = adapter.request(params, 'ethereum');

  expect(handler).toHaveBeenCalled();
  expect(promise).rejects.toBe(response);
});

test('PromiseAdapter → Parameters are correct', async () => {
  const adapter = new PromiseAdapter();

  const handler = jest.fn((_params: IHandlerParams) => {
    return Promise.resolve();
  });

  adapter.setHandler(handler);

  const params = { method: 'ping', params: [1, 2, 3] };
  adapter.request(params, 'ethereum');

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({
      name: params.method,
      params: params.params,
      network: 'ethereum',
    }),
  );
});
