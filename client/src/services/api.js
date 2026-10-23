import axios from 'axios';

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Cannot reach the TaskFlow API. Make sure the server is running.';
      return Promise.reject(new ApiError(message, 0));
    }
    const { status, data } = error.response;
    const message = data?.message || 'Something went wrong. Please try again.';
    return Promise.reject(new ApiError(message, status, data?.errors || []));
  }
);

function compact(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export const tasksApi = {
  async list(params = {}) {
    const { data } = await http.get('/tasks', { params: compact(params) });
    return data;
  },

  async get(id) {
    const { data } = await http.get(`/tasks/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post('/tasks', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/tasks/${id}`, payload);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await http.patch(`/tasks/${id}/status`, { status });
    return data;
  },

  async remove(id) {
    const { data } = await http.delete(`/tasks/${id}`);
    return data;
  },

  async stats(params = {}) {
    const { data } = await http.get('/stats', { params: compact(params) });
    return data;
  },
};

export default http;
