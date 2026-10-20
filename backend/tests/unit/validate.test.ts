import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validate } from '../../src/middleware/validate';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

function makeResMock() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('validate middleware', () => {
  const next: NextFunction = jest.fn();

  afterEach(() => jest.clearAllMocks());

  it('calls next() when there are no errors', () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] } as ReturnType<typeof validationResult>);
    const req = {} as Request;
    const res = makeResMock();
    validate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 400 when there are validation errors', () => {
    const errors = [{ msg: 'Invalid email', path: 'email', type: 'field', value: 'bad' }];
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors,
    } as ReturnType<typeof validationResult>);
    const req = {} as Request;
    const res = makeResMock();
    validate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors });
    expect(next).not.toHaveBeenCalled();
  });
});
