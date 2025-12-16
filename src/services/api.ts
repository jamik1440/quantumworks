import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Queue for failed requests during token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh Logic
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const newToken = refreshResponse.data.access_token;
                const newRefreshToken = refreshResponse.data.refresh_token;

                if (newToken) {
                    localStorage.setItem('token', newToken);
                    if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                authService.logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
        }
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
};

export const projectService = {
    create: async (projectData: any) => {
        const response = await api.post('/projects/', projectData);
        return response.data;
    },
    getAll: async (category?: string) => {
        const params = category ? { category } : {};
        const response = await api.get('/projects/', { params });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },
    getMatches: async (id: number) => {
        const response = await api.post(`/projects/${id}/matches`);
        return response.data;
    },
};

export const proposalService = {
    create: async (projectId: number, proposalData: any) => {
        const response = await api.post(`/projects/${projectId}/proposals`, proposalData);
        return response.data;
    },
    getMyProposals: async () => {
        const response = await api.get('/my-proposals');
        return response.data;
    },
    accept: async (proposalId: number) => {
        const response = await api.post(`/proposals/${proposalId}/accept`);
        return response.data;
    },
    getMyContracts: async () => {
        const response = await api.get('/my-contracts');
        return response.data;
    },
};

export const aiService = {
    parseTask: async (userInput: string) => {
        const response = await api.post('/ai/task/parse', { user_input: userInput });
        return response.data;
    },
};

export default api;
