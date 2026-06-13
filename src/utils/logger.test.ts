import { redactPII, logInfo, logError, logCrisisEvent } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redacts PII correctly', () => {
    const text = "Call me at +91 9876543210 or email me@test.com. My aadhaar is 1234 5678 9012.";
    const result = redactPII(text);
    expect(result).toBe("Call me at [REDACTED] or email [REDACTED]. My aadhaar is [REDACTED].");
  });

  it('logInfo logs info with redacted context', () => {
    logInfo("Hello", { email: "test@example.com", age: 25 });
    expect(console.log).toHaveBeenCalled();
  });

  it('logError logs error with stack and context', () => {
    const error = new Error("Something broke");
    logError(error, { phone: "9876543210" });
    expect(console.error).toHaveBeenCalled();
  });
  
  it('logError handles missing stack', () => {
    const error = new Error("No stack");
    delete error.stack;
    logError(error);
    expect(console.error).toHaveBeenCalled();
  });

  it('logCrisisEvent logs warning', () => {
    logCrisisEvent("user123", "user_input");
    expect(console.warn).toHaveBeenCalled();
  });
});
