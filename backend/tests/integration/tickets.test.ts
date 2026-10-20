import request from 'supertest';
import app from '../../src/index';

describe('Ticket endpoints — unauthenticated', () => {
  it('GET /api/tickets returns 401', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  it('POST /api/tickets returns 401', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'Test', state_id: 'uuid', type: 'task', priority: 'medium' });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/tickets/:id returns 401', async () => {
    const res = await request(app).patch('/api/tickets/some-id').send({ title: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/tickets/:id returns 401', async () => {
    const res = await request(app).delete('/api/tickets/some-id');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/tickets — validation', () => {
  // Provide a dummy (expired/invalid) token so we pass auth but hit validation
  const BEARER = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.AAAA';

  it('returns 401 for invalid token before validation runs', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', BEARER)
      .send({});
    expect(res.status).toBe(401);
  });
});
