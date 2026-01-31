import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    ChartBarIcon,
    DocumentDuplicateIcon,
    CalendarIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Severity styling - now consistent with blue theme
const SEVERITY_CONFIG = {
    HIGH: {
        icon: 'bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-400 border border-red-500/30',
        badge: 'bg-red-500/20 text-red-400 border-red-500/40',
        border: 'border-l-red-500',
        glow: 'shadow-red-500/10'
    },
    MEDIUM: {
        icon: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        border: 'border-l-amber-500',
        glow: 'shadow-amber-500/10'
    },
    LOW: {
        icon: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 border border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        border: 'border-l-blue-500',
        glow: 'shadow-blue-500/10'
    },
};

// Helper function to format currency
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Helper function to format evidence in a user-friendly way
const formatEvidence = (type, evidence) => {
    if (!evidence) return null;

    switch (type) {
        case 'DUPLICATE_TRANSACTION':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <DocumentDuplicateIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            A similar transaction was recorded recently
                        </span>
                    </div>
                    {evidence.duplicateOf && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                            Original transaction ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{evidence.duplicateOf.toString().slice(-8)}</span>
                        </p>
                    )}
                </div>
            );

        case 'SPENDING_SPIKE':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4 text-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            This amount is unusually high for your spending pattern
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 ml-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Your Average:</span>
                            <span className="text-green-600 dark:text-green-400">{formatCurrency(evidence.average)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">This Transaction:</span>
                            <span className="text-red-600 dark:text-red-400">{formatCurrency(evidence.current)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Threshold:</span>
                            <span>{formatCurrency(evidence.threshold)}</span>
                        </div>
                    </div>
                </div>
            );

        case 'BUDGET_EXCEEDED':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <CurrencyRupeeIcon className="w-4 h-4 text-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            You've gone over your budget limit
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 ml-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Budget Limit:</span>
                            <span className="text-blue-600 dark:text-blue-400">{formatCurrency(evidence.budgetLimit)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Total Spent:</span>
                            <span className="text-red-600 dark:text-red-400">{formatCurrency(evidence.currentSpend)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Over by:</span>
                            <span className="text-red-600 dark:text-red-400">{formatCurrency(evidence.exceededBy)}</span>
                        </div>
                    </div>
                </div>
            );

        case 'CATEGORY_OVERUSE':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            This category is taking up too much of your monthly budget
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 ml-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Category Total:</span>
                            <span className="text-orange-600 dark:text-orange-400">{formatCurrency(evidence.categoryTotal)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Monthly Total:</span>
                            <span>{formatCurrency(evidence.totalMonthly)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Percentage:</span>
                            <span className="text-orange-600 dark:text-orange-400">{Math.round(evidence.percentage)}%</span>
                        </div>
                    </div>
                </div>
            );

        case 'ODD_TIME_PATTERN':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            Transaction occurred during unusual hours
                        </span>
                    </div>
                    {evidence.hour !== undefined && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                            Recorded at <span className="font-medium">{evidence.hour}:00</span> (typically between 2-5 AM)
                        </p>
                    )}
                </div>
            );

        case 'SILENT_LEAK':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            Frequent small transactions detected (possible subscription creep)
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 ml-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Period:</span>
                            <span>{evidence.period || '30 Days'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Transactions:</span>
                            <span className="text-blue-600 dark:text-blue-400">{evidence.count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Total:</span>
                            <span>{formatCurrency(evidence.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            );

        case 'AI_DETECTED_IRREGULARITY':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                            AI detected a potential irregularity in this transaction
                        </span>
                    </div>
                    {evidence.aiConfidence && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                            Confidence level: <span className="font-medium">{evidence.aiConfidence}%</span>
                        </p>
                    )}
                </div>
            );

        default:
            // Fallback for unknown types - show key-value pairs nicely
            return (
                <div className="space-y-1">
                    {Object.entries(evidence).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                {typeof value === 'number' ? formatCurrency(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
    }
};

const AnomalyCard = ({ anomaly, onResolve }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async (action) => {
        setIsSubmitting(true);
        try {
            const response = await api.post(`/security/anomalies/${anomaly._id}/resolve`, {
                action,
                resolutionNote: resolutionNote || (action === 'DISMISSED' ? 'False positive' : 'Confirmed irregularity')
            });
            toast.success(action === 'DISMISSED' ? 'Alert dismissed' : 'Alert confirmed');
            onResolve(anomaly._id);
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const config = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.MEDIUM;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`
                rounded-xl p-3 mb-2 cursor-pointer
                bg-slate-800/60 border border-slate-700/40
                hover:bg-slate-800/80 hover:border-slate-600/50
                transition-colors duration-200
                border-l-2 ${config.border}
            `}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-2.5">
                    {/* Simple icon */}
                    <div className={`p-1.5 rounded-lg ${config.icon}`}>
                        <ExclamationTriangleIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-200 text-sm truncate">
                                {anomaly.type.replace(/_/g, ' ')}
                            </h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.badge}`}>
                                {anomaly.severity}
                            </span>
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {anomaly.explanation}
                        </p>

                        {/* Meta - simplified */}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span>{format(new Date(anomaly.detectedAt), 'MMM d, h:mm a')}</span>
                            {anomaly.transactionId && (
                                <>
                                    <span>•</span>
                                    <span className="text-slate-400">
                                        ₹{anomaly.transactionId.amount?.toLocaleString('en-IN')} in {anomaly.transactionId.category}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Minimal expand indicator */}
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="text-slate-500 mt-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="overflow-hidden mt-3 pt-3 border-t border-slate-700/30"
                    >
                        {/* Evidence Section - compact */}
                        <div className="mb-3 p-3 bg-slate-800/40 rounded-lg">
                            <h4 className="text-xs font-medium text-slate-400 mb-2">What We Found</h4>
                            <div className="text-sm text-slate-300">
                                {formatEvidence(anomaly.type, anomaly.evidence)}
                            </div>
                        </div>

                        {/* Actions - inline */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Note (optional)"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                className="flex-1 text-xs px-3 py-1.5 rounded-lg
                                           bg-slate-800/40 border border-slate-700/40 
                                           text-slate-300 placeholder-slate-500
                                           focus:outline-none focus:border-slate-600"
                            />
                            <button
                                onClick={() => handleAction('DISMISSED')}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium text-emerald-400 
                                           hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => handleAction('CONFIRMED')}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 
                                           hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AnomalyCard;

