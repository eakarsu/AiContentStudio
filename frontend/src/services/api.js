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

// Factory to create standard API objects for each feature
function createFeatureApi(endpoint) {
  return {
    getAll: (params) => api.get(`/${endpoint}`, { params }),
    getOne: (id) => api.get(`/${endpoint}/${id}`),
    create: (data) => api.post(`/${endpoint}`, data),
    update: (id, data) => api.put(`/${endpoint}/${id}`, data),
    generate: (id) => api.post(`/${endpoint}/${id}/generate`),
    delete: (id) => api.delete(`/${endpoint}/${id}`),
    bulkDelete: (ids) => api.post(`/${endpoint}/bulk-delete`, { ids }),
    bulkUpdate: (ids, data) => api.post(`/${endpoint}/bulk-update`, { ids, data }),
    exportCsv: (params) => api.get(`/${endpoint}/export/csv`, { params, responseType: 'blob' }),
    exportPdf: (params) => api.get(`/${endpoint}/export/pdf`, { params, responseType: 'blob' }),
  };
}

// Existing Feature API functions
export const videoApi = createFeatureApi('videos');
export const audioApi = createFeatureApi('audio');
export const textApi = createFeatureApi('text');
export const imageApi = createFeatureApi('images');
export const translationApi = createFeatureApi('translations');
export const summaryApi = createFeatureApi('summaries');
export const seoApi = createFeatureApi('seo');
export const socialApi = createFeatureApi('social');
export const emailApi = createFeatureApi('emails');
export const blogApi = createFeatureApi('blogs');
export const marketingApi = createFeatureApi('marketing');
export const scriptApi = createFeatureApi('scripts');
export const podcastApi = createFeatureApi('podcasts');
export const voiceoverApi = createFeatureApi('voiceovers');
export const musicApi = createFeatureApi('music');

// NEW AI Content Studio Feature APIs
export const calendarApi = createFeatureApi('calendar');
export const repurposeApi = createFeatureApi('repurpose');
export const plagiarismApi = createFeatureApi('plagiarism');
export const imageSuggesterApi = createFeatureApi('image-suggester');
export const performanceApi = createFeatureApi('performance');
export const blogOutlineApi = createFeatureApi('blog-outlines');
export const newsletterApi = createFeatureApi('newsletters');
export const pressReleaseApi = createFeatureApi('press-releases');

// Auth APIs
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (token) => api.post('/auth/2fa/disable', { token }),
  getDemoCredentials: () => api.get('/auth/demo-credentials'),
};

// API Keys
export const apiKeyApi = {
  getAll: () => api.get('/api-keys'),
  create: (data) => api.post('/api-keys', data),
  delete: (id) => api.delete(`/api-keys/${id}`),
  regenerate: (id) => api.post(`/api-keys/${id}/regenerate`),
};

// Brand voice cloning
export const brandVoiceApi = {
  get: () => api.get('/brand-voice'),
  analyze: (sampleTexts) => api.post('/brand-voice/analyze', { sampleTexts }),
  apply: (data) => api.post('/brand-voice/apply', data),
};

// Batch repurpose pipeline
export const batchRepurposeApi = {
  start: (data) => api.post('/repurpose/batch', data),
  status: (jobId) => api.get(`/repurpose/batch/${jobId}`),
};

// Versioning
export const versionsApi = {
  list: (type, id) => api.get(`/versions/${type}/${id}`),
  restore: (type, id, versionId) => api.post(`/versions/${type}/${id}/restore/${versionId}`),
};

// Advanced AI endpoints
export const aiNewApi = {
  contentCluster: (body) => api.post('/ai/content-cluster', body),
  repurposeVideo: (body) => api.post('/ai/repurpose-video', body),
  brandStory: (body) => api.post('/ai/brand-story', body),
  // Apply pass 4 mechanical additions
  suggestSeoKeywords: (body) => api.post('/ai/suggest-seo-keywords', body),
  optimizeForEngagement: (body) => api.post('/ai/optimize-for-engagement', body),
  generateSocialVariants: (body) => api.post('/ai/generate-social-variants', body),
  predictPerformance: (body) => api.post('/ai/predict-performance', body),
  detectPlagiarism: (body) => api.post('/ai/detect-plagiarism', body),
};

// Comprehensive exports
export const exportsApi = {
  contentReportPdf: (params) => api.get('/export/content-report', { params, responseType: 'blob' }),
  blogsCsv: () => api.get('/export/blogs', { responseType: 'blob' }),
  calendarCsv: () => api.get('/export/calendar', { responseType: 'blob' }),
};

export default api;
