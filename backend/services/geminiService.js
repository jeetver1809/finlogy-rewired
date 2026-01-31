/**
 * 🤖 GEMINI AI SERVICE
 * 
 * This service handles all interactions with Google's Gemini AI API
 * for the Personal Finance Tracker application.
 * 
 * Features:
 * - Transaction categorization
 * - Financial insights generation
 * - Chat assistant functionality
 * - Expense pattern analysis
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class GeminiService {
  constructor() {
    // Initialize Gemini AI with API key
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      this.model = null;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use Gemini 2.5 Flash Lite (Current Fast Model 2026)
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      // ✅ [SMART CACHE] Initialize in-memory cache for anomalies
      // Key: "CATEGORY_AMOUNT_BUCKET" -> Value: Result Object
      this.anomalyCache = new Map();

      // ✅ [GROQ PIONEER] Initialize Groq as Primary
      if (process.env.GROQ_API_KEY) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        console.log('🚀 Groq (Llama-3) initialized as Primary AI');
      } else {
        console.warn('⚠️ GROQ_API_KEY missing, strictly using Gemini');
        this.groq = null;
      }

      console.log('✅ AI Services initialized successfully (Groq Primary -> Gemini Fallback)');
    } catch (error) {
      console.error('❌ Failed to initialize AI Services:', error);
      this.genAI = null;
      this.model = null;
      this.groq = null;
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isAvailable() {
    return this.model !== null;
  }

  /**
   * 🔄 RETRY LOGIC FOR RELIABILITY
   * 
   * Executes a generator function with exponential backoff for reliability
   * against network drops and model overloading.
   */
  async safeGenerateContent(prompt, maxRetries = 3) {
    // 1️⃣ TRY GROQ (PRIMARY - LLAMA-3-70B)
    if (this.groq) {
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant', // ✅ Active & Fast Llama 3.1
          temperature: 0.1, // Low temp for deterministic results
          max_tokens: 1024
        });

        const text = completion.choices[0]?.message?.content || '';
        if (text) {
          console.log('⚡ Served via Groq (Llama-3.1-8B-Instant)');
          // Normalize to Gemini structure to keep callers happy
          return {
            response: {
              text: () => text
            }
          };
        }
      } catch (groqError) {
        console.warn('⚠️ Groq unavailable, switching to Gemini Fallback:', groqError.message);
        // Fall through to Gemini loop
      }
    }

    // 2️⃣ GEMINI FALLBACK (ORIGINAL LOGIC)
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Calculate backoff: 1s, 2s, 4s...
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Add timeout to prevent hanging requests
        const result = await Promise.race([
          this.model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 20000)
          )
        ]);

        return result;
      } catch (error) {
        lastError = error;
        const msg = error.message || '';

        // Retry only on specific transient errors
        const isRetryable =
          msg.includes('503') || // Service Unavailable / Overloaded
          msg.includes('fetch failed') || // Network drop
          msg.includes('TIMEOUT'); // Local timeout

        if (!isRetryable) {
          throw error; // Fatal error, fail immediately
        }

        console.warn(`⚠️ Attempt ${attempt + 1} failed: ${msg.split('\n')[0]}`);
      }
    }
    throw lastError;
  }

  /**
   * 🏷️ TRANSACTION CATEGORIZATION
   * 
   * Automatically categorizes transactions based on description and amount
   * 
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount
   * @returns {Promise<string>} - Category name
   */
  async categorizeTransaction(description, amount) {
    if (!this.isAvailable()) {
      return this.fallbackCategorization(description);
    }

    const prompt = `
Categorize this financial transaction for a personal finance tracker:

Description: "${description}"
Amount: ₹${amount}

Available categories:
- Food & Dining
- Transportation
- Entertainment
- Shopping
- Bills & Utilities
- Healthcare
- Education
- Investment
- Salary
- Freelance
- Business
- Travel
- Groceries
- Other

Rules:
1. Return ONLY the category name (exactly as listed above)
2. Choose the most specific and appropriate category
3. If uncertain, use "Other"
4. Consider Indian context (₹ currency, local businesses)

Category:`;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = await result.response;
      const category = response.text().trim();

      // Validate the response is one of our categories
      const validCategories = [
        'Food & Dining', 'Transportation', 'Entertainment', 'Shopping',
        'Bills & Utilities', 'Healthcare', 'Education', 'Investment',
        'Salary', 'Freelance', 'Business', 'Travel', 'Groceries', 'Other'
      ];

      if (validCategories.includes(category)) {
        return category;
      } else {
        return this.fallbackCategorization(description);
      }
    } catch (error) {
      console.error('❌ Gemini categorization failed after retries:', error.message);
      return this.fallbackCategorization(description);
    }
  }

  /**
   * 💡 FINANCIAL INSIGHTS GENERATION
   *
   * Generates personalized financial insights based on user data
   *
   * @param {Object} financialData - User's financial data
   * @returns {Promise<string>} - Generated insights
   */
  async generateFinancialInsights(financialData) {
    if (!this.isAvailable()) {
      return this.generateFallbackInsights(financialData);
    }

    const { transactions, budgets, period = 'month' } = financialData;

    // Check network connectivity first
    try {
      // Simple keep-alive check (Google or generally internet)
      await fetch('https://www.google.com', { method: 'HEAD', timeout: 5000 });
    } catch (networkError) {
      console.error('❌ Network unavailable for insights');
      return this.generateFallbackInsights(financialData);
    }

    const prompt = `
Analyze this personal finance data and provide helpful insights:

RECENT TRANSACTIONS (last 10):
${transactions.slice(0, 10).map(t =>
      `- ${t.description}: ₹${t.amount} (${t.category || 'Uncategorized'}) on ${new Date(t.date).toLocaleDateString()}`
    ).join('\n')}

CURRENT BUDGETS:
${budgets.map(b =>
      `- ${b.category}: ₹${b.amount} budget, ₹${b.spent || 0} spent`
    ).join('\n')}

ANALYSIS PERIOD: ${period}

Please provide:
1. 📊 Spending pattern analysis (2-3 sentences)
2. 🎯 Budget performance summary (2-3 sentences)
3. 💡 3 specific, actionable recommendations

Keep the response:
- Under 250 words
- Friendly and encouraging tone
- Focused on actionable advice
- Use Indian currency context (₹)
- Include relevant emojis for better readability

Response:`;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = await result.response;
      return response.text().trim();

    } catch (error) {
      console.error('❌ Gemini insights failed after retries:', error.message);
      return this.generateFallbackInsights(financialData);
    }
  }

  /**
   * 💬 AI CHAT ASSISTANT
   * 
   * Handles conversational queries about personal finance
   * 
   * @param {string} userMessage - User's message
   * @param {Object} context - User's financial context
   * @returns {Promise<string>} - AI response
   */
  async chatWithAI(userMessage, context = {}) {
    if (!this.isAvailable()) {
      return 'I apologize, but the AI assistant is currently unavailable. Please check your network connection.';
    }

    const { recentTransactions = [], budgets = [], totalBalance = 0 } = context;

    const prompt = `
You are a helpful personal finance assistant for an Indian user. You have access to their financial data and should provide helpful, accurate advice.

USER'S FINANCIAL CONTEXT:
- Current Balance: ₹${totalBalance}
- Recent Transactions: ${recentTransactions.length} transactions
- Active Budgets: ${budgets.length} budgets

RECENT ACTIVITY:
${recentTransactions.slice(0, 5).map(t =>
      `- ${t.description}: ₹${t.amount} (${t.category || 'Uncategorized'})`
    ).join('\n')}

USER ASKS: "${userMessage}"

Guidelines:
1. Be conversational, helpful, and encouraging
2. Provide specific, actionable advice
3. Use Indian currency (₹) and context
4. If you need more information, ask specific questions
5. Keep responses under 150 words
6. Use emojis appropriately for better engagement
7. Focus on practical financial advice

Response:`;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('❌ Gemini chat failed after retries:', error.message);
      return 'I apologize, but I\'m having trouble verifying your request right now. Please try again in various moments. 🤖';
    }
  }

  /**
   * 📈 EXPENSE PATTERN ANALYSIS
   * 
   * Analyzes spending patterns and provides recommendations
   * 
   * @param {Array} expenses - Array of expense transactions
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeExpensePatterns(expenses) {
    if (!this.isAvailable()) {
      return {
        patterns: [],
        recommendations: ['AI analysis is currently unavailable.'],
        anomalies: []
      };
    }

    // Group expenses by category and calculate totals
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    const prompt = `
Analyze these expense patterns for personal finance insights:

EXPENSE BREAKDOWN:
${Object.entries(categoryTotals).map(([category, amount]) =>
      `- ${category}: ₹${amount}`
    ).join('\n')}

TOTAL EXPENSES: ₹${expenses.reduce((sum, e) => sum + e.amount, 0)}
NUMBER OF TRANSACTIONS: ${expenses.length}

Provide analysis in this JSON format:
{
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "anomalies": ["anomaly1", "anomaly2"]
}

Focus on:
1. Spending patterns and trends
2. Actionable recommendations for improvement
3. Any unusual spending that stands out
4. Use Indian financial context

Return only valid JSON:`;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().trim();

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(jsonText.replace(/```json/g, '').replace(/```/g, '').trim());
        return parsed;
      } catch (parseError) {
        return {
          patterns: ['Unable to parse analysis'],
          recommendations: ['Please try again later'],
          anomalies: []
        };
      }
    } catch (error) {
      console.error('❌ Gemini pattern analysis failed after retries:', error.message);
      return {
        patterns: ['Analysis temporarily unavailable'],
        recommendations: ['Please check back later'],
        anomalies: []
      };
    }
  }

  // Fallback Insights Generator (Unchanged)
  generateFallbackInsights(financialData) {
    const { transactions = [], budgets = [], period = 'month' } = financialData;

    // Calculate basic statistics
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    // Budget analysis
    const budgetAnalysis = budgets.length > 0
      ? `You have ${budgets.length} active budgets set up.`
      : 'Consider setting up budgets to better track your spending.';

    // Generate insights in paragraph format
    const insights = `
📊 Spending Analysis (${period})

Your financial activity shows total expenses of ₹${totalExpenses.toLocaleString('en-IN')} against income of ₹${totalIncome.toLocaleString('en-IN')}, resulting in net savings of ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}. ${totalIncome > totalExpenses ? 'You\'re maintaining a positive savings rate, which is excellent for your financial health.' : 'Consider reviewing your expenses to improve your savings rate.'}

🎯 Budget Overview

${budgetAnalysis} ${topCategory ? `Your highest spending category is ${topCategory[0]} with ₹${topCategory[1].toLocaleString('en-IN')} spent, which represents a significant portion of your expenses.` : 'Tracking your spending by category will help you identify areas for potential savings.'}

💡 Financial Recommendations

Based on your current financial patterns, focus on tracking your daily expenses to identify spending trends and opportunities for optimization. Setting up budgets for major expense categories will provide better control over your finances. Regular weekly reviews of your transactions will help you stay aligned with your financial goals, and consider automating your savings to build wealth consistently over time.

*Note: AI insights are temporarily unavailable (Network/Service Issue). These are basic analytics based on your data.*
    `.trim();

    return insights;
  }

  fallbackCategorization(description) {
    const desc = description.toLowerCase();

    // Simple keyword-based categorization
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('cafe') || desc.includes('zomato') || desc.includes('swiggy')) {
      return 'Food & Dining';
    }
    if (desc.includes('uber') || desc.includes('ola') || desc.includes('petrol') || desc.includes('fuel') || desc.includes('bus') || desc.includes('metro')) {
      return 'Transportation';
    }
    if (desc.includes('movie') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('game')) {
      return 'Entertainment';
    }
    if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping') || desc.includes('mall')) {
      return 'Shopping';
    }
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || desc.includes('internet') || desc.includes('mobile')) {
      return 'Bills & Utilities';
    }
    if (desc.includes('salary') || desc.includes('payroll')) {
      return 'Salary';
    }
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('vegetables')) {
      return 'Groceries';
    }

    return 'Other';
  }

  /**
   * 🚨 ANOMALY DETECTION (AI CLASSIFICATION)
   * 
   * Analyzes a single transaction for suspicious patterns using context.
   * STRICTLY for classification and explanation.
   * Includes Smart Caching to minimize API calls.
   * 
   * @param {Object} transaction - The transaction object
   * @returns {Promise<Object>} - { isAnomaly: boolean, severity, explanation, confidence }
   */
  async detectAnomalies(transaction) {
    if (!this.isAvailable()) return null;

    // 1. GENERATE CACHE KEY
    // Bucket amount to nearest 100 to group similar transactions
    // e.g. ₹520 -> 500, ₹580 -> 600
    const amountBucket = Math.round(transaction.amount / 100) * 100;
    const cacheKey = `${transaction.category}_${amountBucket}`.toUpperCase();

    // 2. CHECK CACHE
    if (this.anomalyCache.has(cacheKey)) {
      console.log(`⚡ Cache Hit for Anomaly Detection: ${cacheKey}`);
      return this.anomalyCache.get(cacheKey);
    }

    const prompt = `
Analyze this transaction for financial irregularities or unusual monitoring patterns.
Strictly act as a security classifier. Do not make decisions, just flag.

Transaction: "${transaction.description}"
Amount: ₹${transaction.amount}
Category: ${transaction.category}
Date: ${new Date(transaction.date || Date.now()).toLocaleTimeString()}

Check for:
1. Suspicious context (e.g. large "Miscellaneous", "Unknown")
2. Unusual high-value items for typical personal finance
3. Potential signs of embezzlement or irrational spending

Return JSON only:
{
  "isAnomaly": boolean,
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "explanation": "Brief plain english reason (max 1 sentence)",
  "confidence": 0-100
}
    `;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Clean up markdown code blocks if present
      // Robust JSON extraction
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsedResult = JSON.parse(jsonStr);

      // 3. UPDATE CACHE (Store result for future similar checks)
      // Limit cache size to prevent memory leaks (simple LRU-like check)
      if (this.anomalyCache.size > 1000) {
        this.anomalyCache.clear(); // Reset if too big
      }
      this.anomalyCache.set(cacheKey, parsedResult);
      console.log(`🧠 AI Analyzed & Cached: ${cacheKey}`);

      return parsedResult;

    } catch (error) {
      console.error('❌ Gemini anomaly detection failed after retries:', error.message);
      return null;
    }
  }

}

// Export singleton instance
module.exports = new GeminiService();
