import axios from 'axios';

const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5001/api';
    if (host.includes('vercel.app')) return 'https://prompt-craftery-backend.vercel.app/api';
  }

  return 'http://localhost:5001/api';
};

const API_BASE = getApiBase();

const api = axios.create({ baseURL: API_BASE });

export const fetchCategories = () => api.get('/categories').then(r => r.data.categories);

export const fetchPrompts = (params) => api.get('/prompts', { params }).then(r => r.data);

export const fetchPrompt = (slug) => api.get(`/prompts/${slug}`).then(r => r.data.prompt);

export const incrementCopy = (id) => api.post(`/prompts/${id}/copy`);

export const likePrompt = (id) => api.post(`/prompts/${id}/like`).then(r => r.data);

export default api;
