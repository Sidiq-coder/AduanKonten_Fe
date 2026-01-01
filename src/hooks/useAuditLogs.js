import { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient, { handleApiError } from '../lib/api';
export const useAuditLogs = (page = 1, perPage = 10) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
    });
    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/audit-logs', {
                params: { page, per_page: perPage },
            });
            const data = response.data.data;
            setLogs(data.data);
            setPagination({
                currentPage: data.current_page,
                perPage: data.per_page,
                total: data.total,
                lastPage: data.last_page,
            });
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchLogs();
    }, [page, perPage]);
    return {
        logs,
        loading,
        error,
        pagination,
        fetchLogs,
    };
};

export const useAuditLogStatistics = (params = {}) => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const serializedParams = JSON.stringify(params || {});
    const baseParams = useMemo(() => params || {}, [serializedParams]);

    const fetchStatistics = useCallback(async (overrideParams = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/audit-logs/statistics', {
                params: { ...baseParams, ...overrideParams },
            });
            setStatistics(response.data.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    }, [baseParams]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return {
        statistics,
        loading,
        error,
        fetchStatistics,
    };
};

export const useMyAuditLogs = (page = 1, perPage = 10) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
    });

    const fetchMyLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/my-audit-logs', {
                params: { page, per_page: perPage },
            });
            const data = response.data.data;
            setLogs(data.data);
            setPagination({
                currentPage: data.current_page,
                perPage: data.per_page,
                total: data.total,
                lastPage: data.last_page,
            });
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLogs();
    }, [page, perPage]);

    return {
        logs,
        loading,
        error,
        pagination,
        fetchMyLogs,
    };
};
