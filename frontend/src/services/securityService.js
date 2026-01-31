import api from './api';

export const securityService = {
    // Get main dashboard stats
    getDashboardStats: async () => {
        return await api.get('/security/dashboard');
    },

    // Get filtered anomalies
    getAnomalies: async (params) => {
        return await api.get('/security/anomalies', { params });
    },

    // Resolve an anomaly
    resolveAnomaly: async (id, data) => {
        return await api.post(`/security/anomalies/${id}/resolve`, data);
    },

    // Get audit logs
    getAuditLogs: async () => {
        return await api.get('/security/audit-logs');
    }
};
