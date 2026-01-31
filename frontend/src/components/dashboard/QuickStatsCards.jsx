import React, { memo } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';

const QuickStatsCards = memo(({
  totalBalance = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  financialHealthScore = 0,
  isLoading = false,
  previousMonth = {}
}) => {
  const { formatAmount } = useCurrency();

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const expenseChange = calculateChange(monthlyExpenses, previousMonth.expenses || 0);
  const incomeChange = calculateChange(monthlyIncome, previousMonth.income || 0);
  const balanceChange = calculateChange(totalBalance, previousMonth.balance || 0);

  const stats = [
    {
      id: 'balance',
      title: 'Total Balance',
      value: totalBalance,
      change: balanceChange,
      icon: BanknotesIcon,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      description: 'Current account balance'
    },
    {
      id: 'income',
      title: 'This Month\'s Income',
      value: monthlyIncome,
      change: incomeChange,
      icon: ArrowTrendingUpIcon,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      description: 'Income for current month'
    },
    {
      id: 'expenses',
      title: 'This Month\'s Expenses',
      value: monthlyExpenses,
      change: expenseChange,
      icon: ArrowTrendingDownIcon,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      description: 'Expenses for current month'
    },
    {
      id: 'health',
      title: 'Financial Health',
      value: financialHealthScore,
      isPercentage: false,
      icon: ShieldCheckIcon,
      color: financialHealthScore > 80 ? 'green' : financialHealthScore > 50 ? 'yellow' : 'red',
      bgColor: financialHealthScore > 80 ? 'bg-green-50 dark:bg-green-900/20' : financialHealthScore > 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20',
      iconColor: financialHealthScore > 80 ? 'text-green-600 dark:text-green-400' : financialHealthScore > 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      description: 'Overall security score'
    }
  ];

  const formatChangeValue = (change) => {
    if (change === 0) return '0%';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change, isExpense = false) => {
    if (change === 0) return 'text-gray-500 dark:text-gray-400';

    // For expenses, negative change (decrease) is good
    if (isExpense) {
      return change < 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
    }

    // For income and balance, positive change is good
    return change > 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
                <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 interactive-card transition-base relative overflow-hidden"
        >
          {/* SPECIAL RENDER FOR HEALTH GAUGE */}
          {stat.id === 'health' ? (
            <div className="relative h-full flex flex-col justify-between">
              {/* Header with Icon - Consistent with other cards */}
              <div className="flex items-center justify-between z-10">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                {/* Status Pill */}
                <div className={`text-xs font-bold px-2 py-1 rounded-full border ${stat.value > 80 ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                    stat.value > 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                  {stat.value > 80 ? 'Excellent' : stat.value > 50 ? 'Good' : 'Action Needed'}
                </div>
              </div>

              {/* Main Gauge Area */}
              <div className="flex-1 flex flex-col items-center justify-center relative mt-1">
                {/* Background Decorator for "Filled" feel */}
                <div className={`absolute w-full h-16 rounded-full bottom-0 opacity-5 blur-xl ${stat.value > 80 ? 'bg-green-500' :
                    stat.value > 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                  }`}></div>

                <div className="h-28 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ value: stat.value }, { value: 100 - stat.value }]}
                        cx="50%"
                        cy="75%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="80%"
                        outerRadius="100%"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={
                          stat.value > 80 ? '#10B981' :
                            stat.value > 50 ? '#F59E0B' :
                              '#EF4444'
                        } />
                        <Cell fill="var(--color-bg-subtle, #E5E7EB)" className="dark:fill-gray-700" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Score Text */}
                  <div className="absolute top-[66%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-400 -mt-2">
                  Health Score
                </h3>
              </div>
            </div>
          ) : (
            // STANDARD CARD LAYOUT (Balance, Income, Expenses)
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                {stat.change !== undefined && stat.change !== 0 && (
                  <div className={`text-sm font-medium ${getChangeColor(stat.change, stat.id === 'expenses')}`}>
                    {formatChangeValue(stat.change)}
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(stat.value, { showSymbol: true, minimumFractionDigits: 0 })}
                </div>

                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>

              {/* Date Footer */}
              {(stat.id === 'income' || stat.id === 'expenses') && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>
                      {new Date().toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
});

QuickStatsCards.displayName = 'QuickStatsCards';

export default QuickStatsCards;
