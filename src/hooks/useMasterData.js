import { useState, useEffect } from 'react';
import apiClient, { handleApiError } from '../lib/api';

const normalizeListPayload = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }
    return [];
};
export const useFaculties = () => {
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchFaculties = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/public/faculties');
            setFaculties(response.data.data);
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchFaculties();
    }, []);

    const createFaculty = async (data) => {
        const response = await apiClient.post('/faculties', data);
        await fetchFaculties();
        return response.data.data;
    };

    const updateFaculty = async (id, data) => {
        const response = await apiClient.put(`/faculties/${id}`, data);
        await fetchFaculties();
        return response.data.data;
    };

    const deleteFaculty = async (id) => {
        await apiClient.delete(`/faculties/${id}`);
        await fetchFaculties();
    };

    const getFaculty = async (id) => {
        const response = await apiClient.get(`/faculties/${id}`);
        return response.data.data;
    };

    return {
        faculties,
        loading,
        error,
        fetchFaculties,
        createFaculty,
        updateFaculty,
        deleteFaculty,
        getFaculty,
    };
};
export const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/public/categories');
            setCategories(response.data.data);
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCategories();
    }, []);

    const createCategory = async (data) => {
        const response = await apiClient.post('/categories', data);
        await fetchCategories();
        return response.data.data;
    };

    const updateCategory = async (id, data) => {
        const response = await apiClient.put(`/categories/${id}`, data);
        await fetchCategories();
        return response.data.data;
    };

    const deleteCategory = async (id) => {
        await apiClient.delete(`/categories/${id}`);
        await fetchCategories();
    };

    const getCategory = async (id) => {
        const response = await apiClient.get(`/categories/${id}`);
        return response.data.data;
    };

    return {
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategory,
    };
};

export const useReporterTypes = () => {
    const [reporterTypes, setReporterTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchReporterTypes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/public/reporter-types');
            setReporterTypes(response.data.data);
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReporterTypes();
    }, []);
    return {
        reporterTypes,
        loading,
        error,
        fetchReporterTypes,
    };
};
export const useUsers = (role) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/users', { params: { role } });
            setUsers(normalizeListPayload(response.data.data));
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, [role]);

    const createUser = async (data) => {
        const response = await apiClient.post('/users', data);
        await fetchUsers(); // Refresh list
        return response.data.data;
    };

    const updateUser = async (id, data) => {
        const response = await apiClient.put(`/users/${id}`, data);
        await fetchUsers(); // Refresh list
        return response.data.data;
    };

    const deleteUser = async (id) => {
        await apiClient.delete(`/users/${id}`);
        await fetchUsers(); // Refresh list
    };

    const toggleUserActive = async (id) => {
        const response = await apiClient.post(`/users/${id}/toggle-active`);
        await fetchUsers(); // Refresh list
        return response.data.data;
    };

    return {
        users,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        toggleUserActive,
    };
};
