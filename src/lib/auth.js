import apiClient, { getCsrfToken } from './api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
export const authService = {
    // Login user
    async login(credentials) {
        // Get CSRF token first for Sanctum
        await getCsrfToken();
        const response = await apiClient.post('/login', credentials);
        const payload = response.data?.data ?? response.data;
        const { user, token } = payload;
        if (!user || !token) {
            throw new Error('Response login tidak valid.');
        }
        // Simpan token dan user di localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return { user, token };
    },
    // Logout user
    async logout() {
        try {
            await apiClient.post('/logout');
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            // Hapus token dan user dari localStorage
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    },
    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr)
            return null;
        try {
            return JSON.parse(userStr);
        }
        catch {
            return null;
        }
    },
    // Get token from localStorage
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },
    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user?.role === role;
    },
    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin');
    },
    // Check if user is fakultas
    isFakultas() {
        return this.hasRole('fakultas');
    },
    // Check if user is pelapor
    isPelapor() {
        return this.hasRole('pelapor');
    },
    // Fetch current user from API
    async fetchCurrentUser() {
        const response = await apiClient.get('/user');
        const user = response.data;
        // Update localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    },
    // Get user profile
    async getProfile() {
        const response = await apiClient.get('/profile');
        const user = response.data.data;
        // Update localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    },
    // Change password
    async changePassword(data) {
        await apiClient.post('/change-password', data);
    },
};
export default authService;
