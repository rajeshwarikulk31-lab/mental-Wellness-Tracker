import { withRetry } from './retry';
import { NetworkError, ValidationError } from '../types';

describe('Retry Utility', () => {
  it('retries on NetworkError and succeeds', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new NetworkError('Network fail', 500);
      }
      return Promise.resolve('success');
    });

    const result = await withRetry(operation, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('fails after max retries', async () => {
    const operation = jest.fn().mockImplementation(() => {
      throw new NetworkError('Network fail', 500);
    });

    await expect(withRetry(operation, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow('Network fail');
  });

  it('does not retry ValidationError', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      throw new ValidationError('Validation fail', 'test_field');
    });

    await expect(withRetry(operation, { maxRetries: 3, baseDelayMs: 10 })).rejects.toThrow('Validation fail');
    expect(attempts).toBe(1); // Should not retry
  });
});
