import type { Patient, User } from '../types';

async function request(path: string, { method = 'GET', body, token }: { method?: string; body?: any; token?: string | null } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  register: (payload: Partial<User>) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }) as Promise<{ user: User; token: string }>,
  logout: (token: string) => request('/api/auth/logout', { method: 'POST', token }),
  me: (token: string) => request('/api/auth/me', { token }) as Promise<{ user: User }>,
  updateProfile: (updates: Partial<User>, token: string) =>
    request('/api/auth/profile', { method: 'PUT', body: updates, token }) as Promise<{ user: User }>,
  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    request('/api/auth/password', { method: 'PUT', body: { currentPassword, newPassword }, token }),
  incrementUsage: (token: string) =>
    request('/api/auth/increment-usage', { method: 'POST', token }) as Promise<{ user: User }>,

  listUsers: (token: string) => request('/api/users', { token }) as Promise<User[]>,
  createUser: (payload: Partial<User>, token: string) =>
    request('/api/users', { method: 'POST', body: payload, token }) as Promise<User>,
  updateUser: (id: string, updates: Partial<User>, token: string) =>
    request(`/api/users/${id}`, { method: 'PUT', body: updates, token }) as Promise<User>,
  deleteUser: (id: string, token: string) => request(`/api/users/${id}`, { method: 'DELETE', token }),

  listPatients: (token: string) => request('/api/patients', { token }) as Promise<Patient[]>,
  createPatient: (payload: Partial<Patient>, token: string) =>
    request('/api/patients', { method: 'POST', body: payload, token }) as Promise<Patient>,
  updatePatient: (id: string, updates: Partial<Patient>, token: string) =>
    request(`/api/patients/${id}`, { method: 'PUT', body: updates, token }) as Promise<Patient>,
  deletePatient: (id: string, token: string) => request(`/api/patients/${id}`, { method: 'DELETE', token }),

  listAiDocs: (token: string) => request('/api/ai-docs', { token }),
  async uploadAiDoc(file: File, type: string, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/ai-docs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar arquivo');
    return data;
  },
  deleteAiDoc: (id: string, token: string) => request(`/api/ai-docs/${id}`, { method: 'DELETE', token }),
};
