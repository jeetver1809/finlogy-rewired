/**
 * 💡 AI INSIGHTS WIDGET (PREMIUM REDESIGN)
 * 
 * "Iron Man's HUD" Style - Glassmorphism, Neon Accents, Futuristic Typography.
 * Powered by Groq (Llama-3) & Gemini.
 */

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { aiService } from '../../services/aiService';
import { formatInsightsAsParagraphs } from '../../utils/aiFormatting.jsx';
import toast from 'react-hot-toast';

const AiInsightsWidget = ({
  period = 'month',
  onOpenChat,
  onOpenChatWithContent,
  className = ''
}) => {
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [period]);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const aiInsights = await aiService.generateInsights(period);
      setInsights(aiInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        setError('AI is offline. Reconnecting...');
      } else {
        setError('Unable to analyze data right now.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    generateInsights();
  };

  const openChatWithInsights = () => {
    if (onOpenChatWithContent && insights) {
      onOpenChatWithContent(insights);
    } else if (onOpenChat) {
      onOpenChat();
    }
  };

  // --- RENDER HELPERS ---

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-all duration-500 hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 hover:border-purple-500/30 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🔮 Background Glow Effects */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl transition-opacity duration-700 group-hover:opacity-40" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl transition-opacity duration-700 group-hover:opacity-40" />

      {/* 🟢 Live Indicator & Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-gray-100 dark:border-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 shadow-inner">
            <SparklesIcon className="h-4 w-4 text-purple-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-outfit text-base font-semibold text-gray-900 dark:text-white tracking-wide">
              Financial Intelligence
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                System Active
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all ${isLoading ? 'animate-spin' : ''}`}
            title="Refresh Analysis"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 📝 Main Content Area */}
      <div className="relative z-10 p-6 min-h-[180px] flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center text-red-300">
            <ExclamationTriangleIcon className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs font-medium text-white/50 hover:text-white underline decoration-dotted underline-offset-4"
            >
              Try Reconnecting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Insight Text */}
            <div className="prose prose-invert max-w-none">
              <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-light tracking-wide">
                {formatInsightsAsParagraphs(insights, true)}
              </div>
            </div>

            {/* Smart Chips (Decorational for now, could be parsed later) */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-[10px] font-medium text-green-300">
                <BoltIcon className="h-3 w-3" /> Efficiency High
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-[10px] font-medium text-blue-300">
                Stable Trends
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Footer / Action */}
      {!isLoading && !error && (
        <div className="relative z-10 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-4 backdrop-blur-md">
          <button
            onClick={openChatWithInsights}
            className="group/btn w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gray-900/90 px-4 py-2.5 transition-all group-hover/btn:bg-gray-900/0">
              <span className="font-medium text-sm text-white group-hover/btn:text-white transition-colors">
                Deep Dive with AI
              </span>
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-300 group-hover/btn:text-white transition-colors" />
            </div>
            {/* Button Glow */}
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity group-hover/btn:opacity-100 blur-sm pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AiInsightsWidget;
