import { generateTicketDraft } from '../../src/services/ai';

function mockFetchOnce(response: Partial<Response> & { ok: boolean }) {
  global.fetch = jest.fn().mockResolvedValue(response as Response);
}

describe('generateTicketDraft', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, GROQ_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetAllMocks();
  });

  it('throws if GROQ_API_KEY is not configured', async () => {
    delete process.env.GROQ_API_KEY;
    await expect(generateTicketDraft('Fix login bug')).rejects.toThrow('GROQ_API_KEY');
  });

  it('parses a well-formed Groq response into a validated draft', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              description: 'Users cannot log in on mobile Safari due to a cookie issue.',
              type: 'bug',
              priority: 'high',
              story_points: 5,
            }),
          },
        }],
      }),
    } as Partial<Response> & { ok: boolean });

    const draft = await generateTicketDraft('Login broken on mobile Safari');
    expect(draft).toEqual({
      description: 'Users cannot log in on mobile Safari due to a cookie issue.',
      type: 'bug',
      priority: 'high',
      story_points: 5,
    });
  });

  it('falls back to safe defaults when the model returns an invalid enum/number', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              description: 'Some description.',
              type: 'not-a-real-type',
              priority: 'super-urgent',
              story_points: 9999,
            }),
          },
        }],
      }),
    } as Partial<Response> & { ok: boolean });

    const draft = await generateTicketDraft('Something vague');
    expect(draft.type).toBe('task');
    expect(draft.priority).toBe('medium');
    expect(draft.story_points).toBe(100);
  });

  it('throws when the model response is not valid JSON', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not json at all' } }],
      }),
    } as Partial<Response> & { ok: boolean });

    await expect(generateTicketDraft('Anything')).rejects.toThrow('not valid JSON');
  });

  it('throws on a non-OK HTTP response from Groq', async () => {
    mockFetchOnce({
      ok: false,
      status: 401,
      text: async () => 'invalid api key',
    } as Partial<Response> & { ok: boolean });

    await expect(generateTicketDraft('Anything')).rejects.toThrow('Groq API error 401');
  });
});
