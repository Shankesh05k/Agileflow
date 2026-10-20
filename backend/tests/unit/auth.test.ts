import jwt from 'jsonwebtoken';
import { generateTokens } from '../../src/middleware/auth';
import { JwtPayload } from '../../src/types';

const PAYLOAD: Omit<JwtPayload, 'iat' | 'exp'> = {
  sub: 'user-uuid-001',
  email: 'alice@agileflow.dev',
  role: 'admin',
};

describe('generateTokens', () => {
  it('returns accessToken and refreshToken', () => {
    const { accessToken, refreshToken } = generateTokens(PAYLOAD);
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('accessToken expires in ~15 minutes', () => {
    const { accessToken } = generateTokens(PAYLOAD);
    const decoded = jwt.decode(accessToken) as JwtPayload;
    const ttl = decoded.exp! - decoded.iat!;
    expect(ttl).toBe(15 * 60);
  });

  it('refreshToken expires in ~7 days', () => {
    const { refreshToken } = generateTokens(PAYLOAD);
    const decoded = jwt.decode(refreshToken) as JwtPayload;
    const ttl = decoded.exp! - decoded.iat!;
    expect(ttl).toBe(7 * 24 * 60 * 60);
  });

  it('accessToken payload matches input', () => {
    const { accessToken } = generateTokens(PAYLOAD);
    const decoded = jwt.verify(accessToken, 'test-jwt-secret') as JwtPayload;
    expect(decoded.sub).toBe(PAYLOAD.sub);
    expect(decoded.email).toBe(PAYLOAD.email);
    expect(decoded.role).toBe(PAYLOAD.role);
  });
});
