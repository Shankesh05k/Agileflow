import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tickets } from './api';

// api.ts touches localStorage inside request(); stub it so the module
// works under Vitest's default (node) environment without jsdom.
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('tickets.aiDraft', () => {
  it('POSTs the title to /api/tickets/ai-draft and returns the draft', async () => {
    const draft = {
      description: 'Users cannot log in on mobile.',
      type: 'bug',
      priority: 'high',
      story_points: 5,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => draft,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await tickets.aiDraft('Login broken on mobile');

    expect(result).toEqual(draft);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/tickets/ai-draft');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ title: 'Login broken on mobile' });
  });

  it('throws with the server error message when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'AI draft unavailable' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(tickets.aiDraft('anything')).rejects.toThrow('AI draft unavailable');
  });
});