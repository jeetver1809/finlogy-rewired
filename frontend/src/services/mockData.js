/**
 * 🎭 DEMO MODE - Mock Data
 * 
 * Static data used when the app runs in Demo Mode (offline/no backend)
 */

export const DEMO_USER = {
    _id: 'demo-user-001',
    name: 'Demo User',
    email: 'demo@finlogy.app',
    avatar: null,
    currency: 'INR',
    createdAt: new Date().toISOString(),
};

export const DEMO_EXPENSES = [
    {
        _id: 'exp-001',
        title: 'Groceries',
        description: 'Weekly grocery shopping',
        amount: 2500,
        category: 'food',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'exp-002',
        title: 'Netflix Subscription',
        description: 'Monthly subscription',
        amount: 649,
        category: 'entertainment',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'exp-003',
        title: 'Electricity Bill',
        description: 'Monthly electricity',
        amount: 1800,
        category: 'utilities',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'exp-004',
        title: 'Uber Ride',
        description: 'Airport transfer',
        amount: 450,
        category: 'transport',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'exp-005',
        title: 'Coffee',
        description: 'Starbucks',
        amount: 350,
        category: 'food',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const DEMO_INCOME = [
    {
        _id: 'inc-001',
        title: 'Monthly Salary',
        description: 'Software Developer salary',
        amount: 75000,
        source: 'salary',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'inc-002',
        title: 'Freelance Project',
        description: 'Website development',
        amount: 15000,
        source: 'freelance',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'inc-003',
        title: 'Investment Returns',
        description: 'Mutual fund dividend',
        amount: 5000,
        source: 'investment',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const DEMO_BUDGETS = [
    {
        _id: 'bud-001',
        category: 'food',
        limit: 8000,
        spent: 2850,
        period: 'monthly',
    },
    {
        _id: 'bud-002',
        category: 'entertainment',
        limit: 2000,
        spent: 649,
        period: 'monthly',
    },
    {
        _id: 'bud-003',
        category: 'transport',
        limit: 3000,
        spent: 450,
        period: 'monthly',
    },
    {
        _id: 'bud-004',
        category: 'utilities',
        limit: 5000,
        spent: 1800,
        period: 'monthly',
    },
];

export const DEMO_ANALYTICS = {
    summary: {
        totalIncome: 95000,
        totalExpenses: 5749,
        netSavings: 89251,
        savingsRate: 93.95,
    },
    monthlyTrend: [
        { month: 'Oct', income: 80000, expenses: 32000 },
        { month: 'Nov', income: 85000, expenses: 28000 },
        { month: 'Dec', income: 90000, expenses: 35000 },
        { month: 'Jan', income: 95000, expenses: 5749 },
    ],
    categoryBreakdown: [
        { category: 'Food', amount: 2850, percentage: 49.6 },
        { category: 'Utilities', amount: 1800, percentage: 31.3 },
        { category: 'Entertainment', amount: 649, percentage: 11.3 },
        { category: 'Transport', amount: 450, percentage: 7.8 },
    ],
};

// Check if demo mode is enabled
export const isDemoMode = () => {
    return localStorage.getItem('DEMO_MODE') === 'true';
};

// Enable demo mode
export const enableDemoMode = () => {
    localStorage.setItem('DEMO_MODE', 'true');
    localStorage.setItem('token', 'demo-token-finlogy-hackathon');
};

// Disable demo mode
export const disableDemoMode = () => {
    localStorage.removeItem('DEMO_MODE');
    localStorage.removeItem('token');
};
