import React from 'react';
import { format } from 'date-fns';
import {
    PlusCircleIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    UserPlusIcon,
    CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

// Helper to format currency
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Format details in a user-friendly way
const formatDetails = (action, details) => {
    if (!details || Object.keys(details).length === 0) return null;

    // Extract common fields
    const { category, amount, title, name, email, oldAmount, newAmount, ...rest } = details;

    // Build a simple description based on action and available fields
    const parts = [];

    if (title) parts.push(title);
    if (name && !title) parts.push(name);
    if (category) parts.push(`in ${category}`);
    if (amount) parts.push(formatCurrency(amount));
    if (oldAmount !== undefined && newAmount !== undefined) {
        parts.push(`${formatCurrency(oldAmount)} → ${formatCurrency(newAmount)}`);
    }
    if (email) parts.push(`(${email})`);

    // If we have parts, join them nicely
    if (parts.length > 0) {
        return (
            <span className="flex items-center gap-1.5">
                {amount && <CurrencyRupeeIcon className="w-3.5 h-3.5 text-green-500" />}
                <span>{parts.join(' ')}</span>
            </span>
        );
    }

    // Fallback: show key-value pairs nicely formatted
    const allDetails = { ...rest };
    if (Object.keys(allDetails).length === 0) return null;

    return (
        <span className="flex flex-wrap gap-2">
            {Object.entries(allDetails).slice(0, 3).map(([key, value]) => (
                <span key={key} className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                    {typeof value === 'number' ? formatCurrency(value) : String(value)}
                </span>
            ))}
        </span>
    );
};

// Get icon for action type
const getActionIcon = (action) => {
    if (action.includes('DELETE')) return <TrashIcon className="w-4 h-4" />;
    if (action.includes('CREATE')) return <PlusCircleIcon className="w-4 h-4" />;
    if (action.includes('UPDATE')) return <PencilSquareIcon className="w-4 h-4" />;
    if (action.includes('LOGIN')) return <ArrowRightOnRectangleIcon className="w-4 h-4" />;
    if (action.includes('LOGOUT')) return <ArrowLeftOnRectangleIcon className="w-4 h-4" />;
    if (action.includes('REGISTER')) return <UserPlusIcon className="w-4 h-4" />;
    return null;
};

// Format action to be more readable
const formatAction = (action) => {
    // Convert EXPENSE_CREATE to "Created Expense"
    const parts = action.split('_');
    if (parts.length >= 2) {
        const [resource, verb] = parts;
        const verbMap = {
            'CREATE': 'Created',
            'UPDATE': 'Updated',
            'DELETE': 'Deleted',
            'LOGIN': 'Logged In',
            'LOGOUT': 'Logged Out',
            'REGISTER': 'Registered'
        };
        return `${verbMap[verb] || verb} ${resource.charAt(0) + resource.slice(1).toLowerCase()}`;
    }
    return action.replace(/_/g, ' ');
};

const AuditLogTable = ({ logs }) => {
    if (!logs?.length) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No audit logs found. System is clean.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            When
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Activity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {format(new Date(log.timestamp), 'MMM d')}
                                    </span>
                                    <span className="text-xs">
                                        {format(new Date(log.timestamp), 'h:mm a')}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-medium rounded-full 
                                    ${log.action.includes('DELETE')
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        : log.action.includes('CREATE')
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}
                                >
                                    {getActionIcon(log.action)}
                                    {formatAction(log.action)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                                {formatDetails(log.action, log.details) || (
                                    <span className="text-gray-400 dark:text-gray-500 italic">No additional details</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AuditLogTable;

