import { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient, { handleApiError } from '../lib/api';
const sanitizeParams = (params = {}) => {
    const normalized = {};
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            normalized[key] = value;
        }
    });
    return normalized;
};
export const useAssignments = (filters = {}, options = {}) => {
    const { skipInitialFetch = false } = options;
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(!skipInitialFetch);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 15,
        total: 0,
        lastPage: 1,
    });
    const filtersKey = JSON.stringify(filters || {});
    const resolvedFilters = useMemo(() => sanitizeParams(filters), [filtersKey]);
    const fetchAssignments = useCallback(async (overrideParams = {}) => {
        try {
            setLoading(true);
            setError(null);
            const params = sanitizeParams({ ...resolvedFilters, ...overrideParams });
            const response = await apiClient.get('/assignments', { params });
            const payload = response.data;
            const items = Array.isArray(payload?.data) ? payload.data : [];
            setAssignments(items);
            setPagination({
                currentPage: payload?.current_page ?? 1,
                perPage: payload?.per_page ?? items.length,
                total: payload?.total ?? items.length,
                lastPage: payload?.last_page ?? 1,
            });
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    }, [filtersKey, resolvedFilters]);
    useEffect(() => {
        if (!skipInitialFetch) {
            fetchAssignments();
        }
    }, [fetchAssignments, skipInitialFetch]);
    const createAssignment = async (data) => {
        const response = await apiClient.post('/assignments', data);
        await fetchAssignments(); // Refresh list
        return response.data.data;
    };

    const updateAssignment = async (id, data) => {
        const response = await apiClient.put(`/assignments/${id}`, data);
        await fetchAssignments(); // Refresh list
        return response.data.data;
    };

    const deleteAssignment = async (id) => {
        await apiClient.delete(`/assignments/${id}`);
        await fetchAssignments(); // Refresh list
    };

    return {
        assignments,
        loading,
        error,
        pagination,
        fetchAssignments,
        createAssignment,
        updateAssignment,
        deleteAssignment,
    };
};

export const useAssignment = (id) => {
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/assignments/${id}`);
            setAssignment(response.data.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAssignment();
        }
    }, [id]);

    return {
        assignment,
        loading,
        error,
        fetchAssignment,
    };
};
