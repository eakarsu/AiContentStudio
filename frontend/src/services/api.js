import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Feature API functions
export const videoApi = {
  getAll: () => api.get('/videos'),
  getOne: (id) => api.get(`/videos/${id}`),
  create: (data) => api.post('/videos', data),
  generate: (id) => api.post(`/videos/${id}/generate`),
  delete: (id) => api.delete(`/videos/${id}`)
};

export const audioApi = {
  getAll: () => api.get('/audio'),
  getOne: (id) => api.get(`/audio/${id}`),
  create: (data) => api.post('/audio', data),
  generate: (id) => api.post(`/audio/${id}/generate`),
  delete: (id) => api.delete(`/audio/${id}`)
};

export const textApi = {
  getAll: () => api.get('/text'),
  getOne: (id) => api.get(`/text/${id}`),
  create: (data) => api.post('/text', data),
  generate: (id) => api.post(`/text/${id}/generate`),
  delete: (id) => api.delete(`/text/${id}`)
};

export const imageApi = {
  getAll: () => api.get('/images'),
  getOne: (id) => api.get(`/images/${id}`),
  create: (data) => api.post('/images', data),
  generate: (id) => api.post(`/images/${id}/generate`),
  delete: (id) => api.delete(`/images/${id}`)
};

export const translationApi = {
  getAll: () => api.get('/translations'),
  getOne: (id) => api.get(`/translations/${id}`),
  create: (data) => api.post('/translations', data),
  generate: (id) => api.post(`/translations/${id}/generate`),
  delete: (id) => api.delete(`/translations/${id}`)
};

export const summaryApi = {
  getAll: () => api.get('/summaries'),
  getOne: (id) => api.get(`/summaries/${id}`),
  create: (data) => api.post('/summaries', data),
  generate: (id) => api.post(`/summaries/${id}/generate`),
  delete: (id) => api.delete(`/summaries/${id}`)
};

export const seoApi = {
  getAll: () => api.get('/seo'),
  getOne: (id) => api.get(`/seo/${id}`),
  create: (data) => api.post('/seo', data),
  generate: (id) => api.post(`/seo/${id}/generate`),
  delete: (id) => api.delete(`/seo/${id}`)
};

export const socialApi = {
  getAll: () => api.get('/social'),
  getOne: (id) => api.get(`/social/${id}`),
  create: (data) => api.post('/social', data),
  generate: (id) => api.post(`/social/${id}/generate`),
  delete: (id) => api.delete(`/social/${id}`)
};

export const emailApi = {
  getAll: () => api.get('/emails'),
  getOne: (id) => api.get(`/emails/${id}`),
  create: (data) => api.post('/emails', data),
  generate: (id) => api.post(`/emails/${id}/generate`),
  delete: (id) => api.delete(`/emails/${id}`)
};

export const blogApi = {
  getAll: () => api.get('/blogs'),
  getOne: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post('/blogs', data),
  generate: (id) => api.post(`/blogs/${id}/generate`),
  delete: (id) => api.delete(`/blogs/${id}`)
};

export const marketingApi = {
  getAll: () => api.get('/marketing'),
  getOne: (id) => api.get(`/marketing/${id}`),
  create: (data) => api.post('/marketing', data),
  generate: (id) => api.post(`/marketing/${id}/generate`),
  delete: (id) => api.delete(`/marketing/${id}`)
};

export const scriptApi = {
  getAll: () => api.get('/scripts'),
  getOne: (id) => api.get(`/scripts/${id}`),
  create: (data) => api.post('/scripts', data),
  generate: (id) => api.post(`/scripts/${id}/generate`),
  delete: (id) => api.delete(`/scripts/${id}`)
};

export const podcastApi = {
  getAll: () => api.get('/podcasts'),
  getOne: (id) => api.get(`/podcasts/${id}`),
  create: (data) => api.post('/podcasts', data),
  generate: (id) => api.post(`/podcasts/${id}/generate`),
  delete: (id) => api.delete(`/podcasts/${id}`)
};

export const voiceoverApi = {
  getAll: () => api.get('/voiceovers'),
  getOne: (id) => api.get(`/voiceovers/${id}`),
  create: (data) => api.post('/voiceovers', data),
  generate: (id) => api.post(`/voiceovers/${id}/generate`),
  delete: (id) => api.delete(`/voiceovers/${id}`)
};

export const musicApi = {
  getAll: () => api.get('/music'),
  getOne: (id) => api.get(`/music/${id}`),
  create: (data) => api.post('/music', data),
  generate: (id) => api.post(`/music/${id}/generate`),
  delete: (id) => api.delete(`/music/${id}`)
};

export default api;
