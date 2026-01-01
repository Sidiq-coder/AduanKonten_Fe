import { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient, { handleApiError } from '../lib/api';
export const useTickets = (filters, options = {}) => {
    const { skipInitialFetch = false } = options;
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(!skipInitialFetch);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
    });
    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/reports', { params: filters });
            const data = response.data.data;
            setTickets(data.data);
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
        if (!skipInitialFetch) {
            fetchTickets();
        }
    }, [JSON.stringify(filters), skipInitialFetch]);
    const createTicket = async (data, isPublic = false) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.phone) {
            formData.append('phone', data.phone);
        }
        formData.append('email', data.email);
        formData.append('reporter_type_id', data.reporter_type_id);
        formData.append('category_id', data.category_id);
        formData.append('link_site', data.link_site);
        formData.append('description', data.description);
        if (data.priority) {
            formData.append('priority', data.priority);
        }
        // Add attachments
        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
        }
        const endpoint = isPublic ? '/public/reports' : '/reports';
        const response = await apiClient.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (!isPublic) {
            await fetchTickets(); // Refresh list only for authenticated reports
        }
        return response.data.data;
    };
    const updateTicket = async (id, data) => {
        const response = await apiClient.put(`/reports/${id}`, data);
        await fetchTickets(); // Refresh list
        return response.data.data;
    };
    const deleteTicket = async (id) => {
        await apiClient.delete(`/reports/${id}`);
        await fetchTickets(); // Refresh list
    };
    return {
        tickets,
        loading,
        error,
        pagination,
        fetchTickets,
        createTicket,
        updateTicket,
        deleteTicket,
    };
};
export const useTicket = (id) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchTicket = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/reports/${id}`);
            setTicket(response.data.data);
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (id) {
            fetchTicket();
        }
        else {
            setTicket(null);
            setLoading(false);
        }
    }, [id]);
    const updateTicket = async (data) => {
        const response = await apiClient.put(`/reports/${id}`, data);
        setTicket(response.data.data);
        return response.data.data;
    };
    return {
        ticket,
        loading,
        error,
        fetchTicket,
        updateTicket,
    };
};
export const useReportStatistics = (params = {}) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const serializedParams = JSON.stringify(params || {});
    const baseParams = useMemo(() => params || {}, [serializedParams]);

    const fetchStats = useCallback(async (overrideParams = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/reports/statistics', {
                params: { ...baseParams, ...overrideParams },
            });
            setStats(response.data.data);
        }
        catch (err) {
            setError(handleApiError(err));
        }
        finally {
            setLoading(false);
        }
    }, [baseParams]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        fetchStats,
    };
};

export const usePublicReportByTicket = (ticketId) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/public/reports/ticket/${ticketId}`);
            setReport(response.data.data);
            return response.data.data;
        }
        catch (err) {
            setError(handleApiError(err));
            return null;
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (ticketId) {
            fetchReport();
        }
    }, [ticketId]);
    return {
        report,
        loading,
        error,
        fetchReport,
    };
};
