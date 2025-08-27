import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Courses API
export const coursesAPI = {
  getAll: (params = {}) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/educator/my-courses'),
  addReview: (id, reviewData) => api.post(`/courses/${id}/reviews`, reviewData),
  search: (query) => api.get('/courses', { params: { search: query } }),
};

// Enrollments API
export const enrollmentsAPI = {
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  getMyEnrollments: () => api.get('/enrollments/my-enrollments'),
  getEnrollment: (id) => api.get(`/enrollments/${id}`),
  completeLesson: (id, lessonData) => api.post(`/enrollments/${id}/complete-lesson`, lessonData),
  addNote: (id, noteData) => api.post(`/enrollments/${id}/notes`, noteData),
  getNotes: (id, lessonId) => api.get(`/enrollments/${id}/notes/${lessonId}`),
  getProgress: (id) => api.get(`/enrollments/${id}/progress`),
  cancelEnrollment: (id) => api.delete(`/enrollments/${id}`),
};

// Lessons API
export const lessonsAPI = {
  addLesson: (courseId, lessonData) => api.post(`/lessons/${courseId}`, lessonData),
  updateLesson: (courseId, lessonId, lessonData) => api.put(`/lessons/${courseId}/${lessonId}`, lessonData),
  deleteLesson: (courseId, lessonId) => api.delete(`/lessons/${courseId}/${lessonId}`),
  getLesson: (courseId, lessonId) => api.get(`/lessons/${courseId}/${lessonId}`),
  reorderLessons: (courseId, lessonIds) => api.put(`/lessons/${courseId}/reorder`, { lessonIds }),
  togglePublish: (courseId, lessonId) => api.put(`/lessons/${courseId}/${lessonId}/publish`),
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getEducators: () => api.get('/users/educators'),
  getEducatorProfile: (id) => api.get(`/users/educators/${id}`),
  getStats: () => api.get('/users/stats'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
