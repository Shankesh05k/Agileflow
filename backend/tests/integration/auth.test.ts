import request from 'supertest';
import app from '../../src/index';

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@agileflow.dev' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 401 when no refresh token is provided', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns 200 or 503', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
  });
});
