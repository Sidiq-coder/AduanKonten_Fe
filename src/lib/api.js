import axios from 'axios';

// Ensure every axios instance shares the same CSRF-friendly defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Base URL untuk Laravel backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Buat axios instance dengan konfigurasi default
export const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Penting untuk Sanctum CSRF cookie
});
// Request interceptor untuk menambahkan token ke setiap request
apiClient.interceptors.request.use((config) => {
    // Disable credentials for public endpoints to avoid CSRF issues
    if (config.url?.includes('/public/')) {
        config.withCredentials = false;
    }
    
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor untuk handle error
apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Handle 401 Unauthorized - hanya clear token, jangan paksa redirect
    if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Jangan paksa redirect, biarkan komponen yang menangani
        // window.location.href = '/login';
    }
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
        console.error('Access denied');
    }
    return Promise.reject(error);
});
// Helper untuk get CSRF token dari Laravel (diperlukan untuk Sanctum)
export const getCsrfToken = async () => {
    try {
        await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
            withCredentials: true,
        });
    }
    catch (error) {
        console.error('Failed to get CSRF token:', error);
    }
};
// Helper untuk handle API errors
export const handleApiError = (error) => {
    if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }
        if (axiosError.response?.data?.errors) {
            const errors = axiosError.response.data.errors;
            const firstError = Object.values(errors)[0];
            return firstError[0] || 'An error occurred';
        }
        return axiosError.message || 'An error occurred';
    }
    return 'An unexpected error occurred';
};
export default apiClient;
