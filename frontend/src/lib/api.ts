import { AuthTokens, User, Ticket, Sprint, WorkflowState, WorkflowTransition, AuditLog, VelocityData, TicketDraft } from '../types';

const BASE = '/api';

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function setTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Token refresh
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refresh = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refresh.ok) {
        const tokens: AuthTokens = await refresh.json();
        setTokens(tokens);
        res = await fetch(`${BASE}${path}`, {
          ...init,
          headers: { ...headers, Authorization: `Bearer ${tokens.accessToken}` },
        });
      } else {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email: string, password: string): Promise<AuthTokens & { user: User }> => {
    const data = await request<AuthTokens & { user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data);
    return data;
  },

  logout: () => { clearTokens(); window.location.href = '/login'; },

  me: (): Promise<User> => request('/auth/me'),
};

// ── Tickets ───────────────────────────────────────────────────────────────
export const tickets = {
  list: (params?: { sprint_id?: string; state_id?: string; assignee_id?: string }): Promise<Ticket[]> => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request(`/tickets${qs}`);
  },
  get: (id: string): Promise<Ticket> => request(`/tickets/${id}`),
  create: (body: Partial<Ticket>): Promise<Ticket> =>
    request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Ticket>): Promise<Ticket> =>
    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string): Promise<void> =>
    request(`/tickets/${id}`, { method: 'DELETE' }),
  move: (id: string, state_id: string): Promise<Ticket> =>
    request(`/tickets/${id}/move`, { method: 'POST', body: JSON.stringify({ state_id }) }),
  aiDraft: (title: string): Promise<TicketDraft> =>
    request('/tickets/ai-draft', { method: 'POST', body: JSON.stringify({ title }) }),
};

// ── Sprints ───────────────────────────────────────────────────────────────
export const sprints = {
  list: (): Promise<Sprint[]> => request('/sprints'),
  get: (id: string): Promise<Sprint> => request(`/sprints/${id}`),
  create: (body: { name: string; goal?: string; start_date: string; end_date: string }): Promise<Sprint> =>
    request('/sprints', { method: 'POST', body: JSON.stringify(body) }),
  start: (id: string): Promise<Sprint> =>
    request(`/sprints/${id}/start`, { method: 'POST' }),
  complete: (id: string): Promise<Sprint> =>
    request(`/sprints/${id}/complete`, { method: 'POST' }),
  velocity: (): Promise<VelocityData[]> => request('/sprints/velocity'),
};

// ── Workflow ──────────────────────────────────────────────────────────────
export const workflow = {
  states: (): Promise<WorkflowState[]> => request('/workflow/states'),
  transitions: (): Promise<WorkflowTransition[]> => request('/workflow/transitions'),
  available: (ticketId: string): Promise<WorkflowTransition[]> =>
    request(`/workflow/transitions/${ticketId}`),
};

// ── Audit ─────────────────────────────────────────────────────────────────
export const audit = {
  list: (limit = 50, offset = 0): Promise<AuditLog[]> =>
    request(`/audit?limit=${limit}&offset=${offset}`),
};