import { expect, test, jest } from 'bun:test';
import { CallbackAdapter, IHandlerParams } from '../CallbackAdapter';
import { AdapterStrategy } from '../Adapter';

test('CallbackAdapter → Strategy is correct', () => {
  const adapter = new CallbackAdapter();
  expect(adapter.getStrategy()).toEqual(AdapterStrategy.CALLBACK);
});

test('CallbackAdapter → Handler is set and resolved promise', async () => {
  const adapter = new CallbackAdapter();

  const response = 'pong';

  const handler = jest.fn((params: IHandlerParams) => {
    adapter.sendResponse(params.id!, response);
    return Promise.resolve();
  });

  adapter.setHandler(handler);

  const params = { method: 'ping', params: [] };

  const promise = adapter.request(params, 'ethereum');

  expect(handler).toHaveBeenCalled();
  expect(promise).resolves.toBe(response);
});

test('CallbackAdapter → Handler is set and rejects promise', async () => {
  const adapter = new CallbackAdapter();

  const response = 'error';

  const handler = jest.fn((params: IHandlerParams) => {
    adapter.sendError(params.id!, response);
    return Promise.resolve();
  });

  adapter.setHandler(handler);

  const params = { method: 'ping', params: [] };

  const promise = adapter.request(params, 'ethereum');

  expect(handler).toHaveBeenCalled();
  expect(promise).rejects.toBe(response);
});

test('CallbackAdapter → Parameters are correct', async () => {
  const adapter = new CallbackAdapter();

  const response = 'pong';

  const handler = jest.fn((params: IHandlerParams) => {
    adapter.sendResponse(params.id!, response);
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
