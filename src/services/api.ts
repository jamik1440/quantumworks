import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for refreshing token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Failed to refresh - logout user
                    authService.logout();
                }
            } else {
                authService.logout();
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
