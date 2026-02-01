import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusIcon } from '@heroicons/react/24/outline';
import { analyticsService } from '../services/analyticsService';
import { budgetService } from '../services/budgetService';
import { expenseService } from '../services/expenseService';
import { incomeService } from '../services/incomeService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import QuickStatsCards from '../components/dashboard/QuickStatsCards';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import BudgetProgressWidget from '../components/dashboard/BudgetProgressWidget';
import MiniTrendsChart from '../components/dashboard/MiniTrendsChart';
import QuickExpenseEntry from '../components/dashboard/QuickExpenseEntry';
import AiAssistant from '../components/ai/AiAssistant';
import AiInsightsWidget from '../components/ai/AiInsightsWidget';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import toast from 'react-hot-toast';
import '../styles/dashboard.css';

const Dashboard = ({ onNavigate, onTransactionChange }) => {
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    income: [],
    budgets: [],
    security: null,
    summary: null,
    loading: true
  });
  const [period, setPeriod] = useState('month');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [preloadedChatContent, setPreloadedChatContent] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      const [
        expensesResponse,
        incomeResponse,
        budgetsResponse,
        summaryResponse,
        securityResponse
      ] = await Promise.all([
        expenseService.getExpenses().catch(() => ({ data: [] })),
        incomeService.getIncome().catch(() => ({ data: [] })),
        budgetService.getBudgets().catch(() => ({ data: [] })),
        analyticsService.getSummary(period).catch(() => ({ data: null })),
        api.get('/security/dashboard').catch(() => ({ data: { success: false } }))
      ]);

      setDashboardData({
        expenses: expensesResponse.data || [],
        income: incomeResponse.data || [],
        budgets: budgetsResponse.data || [],
        summary: summaryResponse.data,
        security: securityResponse.data?.success ? securityResponse.data.data : null,
        loading: false
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  // Calculate dashboard metrics
  const calculateMetrics = () => {
    // Use UTC for consistent timezone handling with database dates
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const monthlyExpenses = dashboardData.expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getUTCMonth() === currentMonth && expenseDate.getUTCFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyIncome = dashboardData.income
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate.getUTCMonth() === currentMonth && incomeDate.getUTCFullYear() === currentYear;
      })
      .reduce((sum, income) => sum + income.amount, 0);

    const totalBalance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return {
      totalBalance,
      monthlyExpenses,
      monthlyIncome,
      savingsRate: Math.max(0, savingsRate)
    };
  };

  // Handle quick expense addition
  const handleQuickExpenseAdded = async (expenseData) => {
    try {
      await expenseService.createExpense(expenseData);
      // Refresh dashboard data
      fetchDashboardData();
      // Notify parent to refresh global stats (security badge)
      if (onTransactionChange) onTransactionChange();
    } catch (error) {
      console.error('Error adding quick expense:', error);
      throw error;
    }
  };

  // Navigation handlers
  const handleViewAllTransactions = () => {
    if (onNavigate) onNavigate('expenses');
  };

  const handleViewAllBudgets = () => {
    if (onNavigate) onNavigate('budgets');
  };

  const handleViewAnalytics = () => {
    if (onNavigate) onNavigate('analytics');
  };

  const handleTransactionClick = (transaction) => {
    // Navigate to the appropriate page based on transaction type
    if (onNavigate) {
      if (transaction.type === 'expense') {
        onNavigate('expenses');
      } else {
        onNavigate('income');
      }
    }
  };

  const handleBudgetClick = (budget) => {
    if (onNavigate) onNavigate('budgets');
  };

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metrics = calculateMetrics();

  // Get common categories for quick expense entry
  const commonCategories = [...new Set(dashboardData.expenses.map(expense => expense.category))]
    .filter(Boolean)
    .slice(0, 8);

  // Combine transactions for recent transactions widget
  const allTransactions = [
    ...dashboardData.expenses.map(expense => ({ ...expense, type: 'expense' })),
    ...dashboardData.income.map(income => ({ ...income, type: 'income' }))
  ];



  return (
    <div className="dashboard-container p-4 sm:p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={handleViewAnalytics}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 btn-glow hover:scale-[1.02]"
          >
            <PlusIcon className="h-4 w-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="transform transition-all duration-200">
        <QuickStatsCards
          totalBalance={metrics.totalBalance}
          monthlyExpenses={metrics.monthlyExpenses}
          monthlyIncome={metrics.monthlyIncome}
          financialHealthScore={dashboardData.security?.healthScore || 0}
          isLoading={dashboardData.loading}
        />
      </div>

      {/* Main Dashboard Grid - Structured Layout for Proper Vertical Alignment */}
      <div className="grid grid-cols-1 xl:grid-cols-12 lg:grid-cols-8 gap-4 sm:gap-6">
        {/* Left Column - Primary Content */}
        <div className="xl:col-span-8 lg:col-span-5">
          {/* Top Section - Quick Entry and Transactions */}
          <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
            {/* Quick Expense Entry */}
            <QuickExpenseEntry
              onExpenseAdded={handleQuickExpenseAdded}
              commonCategories={commonCategories}
            />

            {/* Recent Transactions */}
            <RecentTransactions
              transactions={allTransactions}
              isLoading={dashboardData.loading}
              onViewAll={handleViewAllTransactions}
              onTransactionClick={handleTransactionClick}
            />
          </div>

          {/* Bottom Section - Mini Trends Chart (aligned with Budget Progress) */}
          <MiniTrendsChart
            expenses={dashboardData.expenses}
            income={dashboardData.income}
            isLoading={dashboardData.loading}
            onViewAnalytics={handleViewAnalytics}
          />
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="xl:col-span-4 lg:col-span-3">
          {/* Top Section - AI Insights (matches left column top section height) */}
          <div className="mb-4 sm:mb-6">
            <div className="ai-feature-highlight">
              <AiInsightsWidget
                period={period}
                onOpenChat={() => setShowAiAssistant(true)}
                onOpenChatWithContent={(content) => {
                  setPreloadedChatContent(content);
                  setShowAiAssistant(true);
                }}
              />
            </div>
          </div>

          {/* Bottom Section - Budget Progress Widget (aligned with Mini Trends Chart) */}
          <BudgetProgressWidget
            budgets={dashboardData.budgets}
            expenses={dashboardData.expenses}
            isLoading={dashboardData.loading}
            onViewAll={handleViewAllBudgets}
            onBudgetClick={handleBudgetClick}
            maxDisplay={3}
            prioritizeBySpending={true}
          />
        </div>
      </div>

      {/* AI Assistant Modal */}
      <ErrorBoundary
        fallbackMessage="The AI Assistant encountered an error. Please try refreshing the page."
        onReset={() => {
          // Clear corrupted chat data
          localStorage.removeItem('aiChatMessages');
          setShowAiAssistant(false);
          setTimeout(() => setShowAiAssistant(true), 100);
        }}
      >
        <AiAssistant
          isOpen={showAiAssistant}
          onClose={() => {
            setShowAiAssistant(false);
            setPreloadedChatContent(null); // Clear preloaded content when closing
          }}
          preloadedContent={preloadedChatContent}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;
