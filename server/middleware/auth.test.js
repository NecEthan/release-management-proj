const authenticateToken = require('./auth');

describe('authenticateToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('calls next() when valid token provided', () => {
    req.headers['authorization'] = 'Bearer valid-token-123';

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when no authorization header', () => {
    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header is empty', () => {
    req.headers['authorization'] = '';

    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header does not contain token', () => {
    req.headers['authorization'] = 'Bearer ';

    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('extracts token from Bearer scheme correctly', () => {
    req.headers['authorization'] = 'Bearer my-secret-token';

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header without Bearer prefix', () => {
    req.headers['authorization'] = 'just-a-token';

    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('handles malformed authorization header', () => {
    req.headers['authorization'] = null;

    authenticateToken(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});