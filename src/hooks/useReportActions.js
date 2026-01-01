import { useState, useEffect } from 'react';
import apiClient, { handleApiError } from '../lib/api';

export const useReportActions = (reportId) => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const url = reportId 
                ? `/reports/${reportId}/actions` 
                : '/report-actions';
            
            const response = await apiClient.get(url);
            setActions(response.data.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActions();
    }, [reportId]);

    const createAction = async (data) => {
        const response = await apiClient.post('/report-actions', data);
        await fetchActions(); // Refresh list
        return response.data.data;
    };

    return {
        actions,
        loading,
        error,
        fetchActions,
        createAction,
    };
};

export const useReportAction = (id) => {
    const [action, setAction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAction = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/report-actions/${id}`);
            setAction(response.data.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAction();
        }
    }, [id]);

    return {
        action,
        loading,
        error,
        fetchAction,
    };
};
