import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../lib/auth';
import { handleApiError } from '../lib/api';
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Initialize user from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedUser = authService.getCurrentUser();
                if (storedUser && authService.isAuthenticated()) {
                    // Verify token masih valid dengan fetch user dari API
                    try {
                        const currentUser = await authService.fetchCurrentUser();
                        setUser(currentUser);
                    }
                    catch {
                        // Token invalid, clear localStorage
                        authService.logout();
                        setUser(null);
                    }
                }
            }
            catch (err) {
                console.error('Auth initialization error:', err);
                setError(handleApiError(err));
            }
            finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, []);
    const login = async (credentials) => {
        try {
            setLoading(true);
            setError(null);
            const { user: loggedInUser } = await authService.login(credentials);
            setUser(loggedInUser);
        }
        catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
        }
        catch (err) {
            console.error('Logout error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const refreshUser = async () => {
        try {
            const currentUser = await authService.fetchCurrentUser();
            setUser(currentUser);
        }
        catch (err) {
            console.error('Refresh user error:', err);
            setError(handleApiError(err));
        }
    };
    const hasRole = (role) => {
        return user?.role === role;
    };
    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        isAdmin: user?.role === 'admin',
        isFakultas: user?.role === 'fakultas',
        isPelapor: user?.role === 'pelapor',
        refreshUser,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;
