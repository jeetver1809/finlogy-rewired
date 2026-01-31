import React, { useState, useEffect } from 'react';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ArrowPathIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline'; // Switched to outline for consistency
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import AnomalyCard from '../components/security/AnomalyCard';
import AuditLogTable from '../components/security/AuditLogTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

const SecurityDashboard = ({ onTransactionChange }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'logs'
    const [refreshing, setRefreshing] = useState(false);
    const [showAllAnomalies, setShowAllAnomalies] = useState(false);
    const [allAnomalies, setAllAnomalies] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);

    const fetchSecurityData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await api.get('/security/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const handleResolve = (id) => {
        setData(prev => ({
            ...prev,
            recentAlerts: prev.recentAlerts.filter(a => a._id !== id),
            stats: {
                ...prev.stats,
                pending: prev.stats.pending - 1,
                resolved: prev.stats.resolved + 1
            }
        }));
        // Also update allAnomalies if showing all
        if (showAllAnomalies) {
            setAllAnomalies(prev => prev.filter(a => a._id !== id));
        }
        fetchSecurityData();
        if (onTransactionChange) onTransactionChange();
    };

    const fetchAllAnomalies = async () => {
        try {
            setLoadingAll(true);
            const response = await api.get('/security/anomalies?status=PENDING');
            if (response.data.success) {
                setAllAnomalies(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch all anomalies:', error);
        } finally {
            setLoadingAll(false);
        }
    };

    const handleToggleViewAll = () => {
        if (!showAllAnomalies && allAnomalies.length === 0) {
            fetchAllAnomalies();
        }
        setShowAllAnomalies(!showAllAnomalies);
    };

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
        </div>
    );

    const healthScore = data?.healthScore || 100;
    const healthColor = healthScore > 80 ? '#10B981' : healthScore > 50 ? '#F59E0B' : '#EF4444';

    const gaugeData = [
        { name: 'Score', value: healthScore },
        { name: 'Gap', value: 100 - healthScore }
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                        Security Center
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Preventive monitoring and financial irregularity detection
                    </p>
                </div>
                <button
                    onClick={() => fetchSecurityData(true)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Scanning...' : 'Scan Now'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Health Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden"
                >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">Security Health</h2>

                    <div className="h-48 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={gaugeData}
                                    cx="50%"
                                    cy="60%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius="70%"
                                    outerRadius="90%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={healthColor} />
                                    <Cell fill="var(--bg-opacity-20)" className="dark:opacity-10 opacity-10 fill-gray-400" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className="text-4xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
                            <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold mt-1">Score</span>
                        </div>
                    </div>

                    <div className="text-center pb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${healthScore > 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            healthScore > 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {healthScore > 80 ? 'System Secure' : healthScore > 50 ? 'Attention Needed' : 'Critical Issues'}
                        </span>
                    </div>
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center group hover:border-blue-500/30 transition-colors"
                    >
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats.total || 0}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Total Scans</span>
                    </motion.div>

                    {/* Pending Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center group hover:border-yellow-500/30 transition-colors"
                    >
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats.pending || 0}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Pending Alerts</span>
                    </motion.div>

                    {/* Resolved */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center group hover:border-green-500/30 transition-colors"
                    >
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats.resolved || 0}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Resolved Issues</span>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative ${activeTab === 'alerts'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Pending Alerts
                        {activeTab === 'alerts' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative ${activeTab === 'logs'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        security Audit Log
                        {activeTab === 'logs' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                            />
                        )}
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'alerts' ? (
                        <div className="space-y-4">
                            {/* View All Toggle Button */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {showAllAnomalies ? 'All Anomalies' : 'Recent Alerts'}
                                    </span>
                                    {showAllAnomalies && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                            {allAnomalies.length} total
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleToggleViewAll}
                                    disabled={loadingAll}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 
                                               bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 
                                               transition-colors disabled:opacity-50"
                                >
                                    {loadingAll ? (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    ) : showAllAnomalies ? (
                                        <EyeSlashIcon className="w-4 h-4" />
                                    ) : (
                                        <EyeIcon className="w-4 h-4" />
                                    )}
                                    {showAllAnomalies ? 'Show Recent' : 'View All'}
                                </button>
                            </div>

                            {/* Anomaly List */}
                            {(() => {
                                const anomalyList = showAllAnomalies ? allAnomalies : (data?.recentAlerts || []);

                                if (loadingAll) {
                                    return (
                                        <div className="text-center py-10">
                                            <LoadingSpinner size="md" />
                                            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading all anomalies...</p>
                                        </div>
                                    );
                                }

                                if (anomalyList.length === 0) {
                                    return (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <ShieldCheckIcon className="w-10 h-10 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">System Secure</h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                                No anomalies detected. Your financial data integrity is at 100%.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                        {anomalyList.map((anomaly, index) => (
                                            <motion.div
                                                key={anomaly._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                            >
                                                <AnomalyCard anomaly={anomaly} onResolve={handleResolve} />
                                            </motion.div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <AuditLogTable logs={data?.recentLogs} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityDashboard;
