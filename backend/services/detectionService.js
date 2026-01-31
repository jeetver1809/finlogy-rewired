const { subMinutes, subDays, getHours } = require('date-fns');
const mongoose = require('mongoose');
// const Expense = require('../models/Expense'); // ❌ Circular dependency caused crash
const Anomaly = require('../models/Anomaly');
const geminiService = require('./geminiService');

/**
 * 🕵️ DETECTION SERVICE
 * 
 * Engine responsible for identifying financial irregularities.
 * Combines Rule-based Logic + Statistical Analysis + AI Classification.
 */
class DetectionService {

    /**
     * Main entry point to check a transaction for all anomaly types
     */
    async checkTransaction(transaction, userId) {
        console.log(`🕵️ Checking transaction for anomalies: ${transaction.title} (${transaction.amount})`);
        const anomalies = [];

        // 1. Rule: DUPLICATE CHECK
        const isDuplicate = await this.checkDuplicate(transaction, userId);
        if (isDuplicate) {
            console.log('🚨 Duplicate detected');
            anomalies.push({
                type: 'DUPLICATE_TRANSACTION',
                severity: 'MEDIUM',
                explanation: 'This appears to be a duplicate transaction.',
                evidence: { duplicateOf: isDuplicate._id }
            });
        }

        // 2. Rule: ODD TIME PATTERN
        if (this.checkOddTime(transaction.date)) {
            console.log('🚨 Odd time detected');
            anomalies.push({
                type: 'ODD_TIME_PATTERN',
                severity: 'MEDIUM',
                explanation: 'Transaction occurred during unusual hours (2 AM - 5 AM).',
                evidence: { hour: getHours(new Date(transaction.date)) }
            });
        }

        // 3. Statistical: SPENDING SPIKE
        const isSpike = await this.checkSpendingSpike(transaction, userId);
        if (isSpike) {
            console.log('🚨 Spending spike detected:', isSpike);
            anomalies.push({
                type: 'SPENDING_SPIKE',
                severity: 'HIGH',
                explanation: `Transaction is ${Math.round(isSpike.percentage)}% higher than your 30-day average.`,
                evidence: {
                    average: isSpike.average,
                    current: transaction.amount,
                    threshold: isSpike.threshold
                }
            });
        }

        // 4. Statistical: CATEGORY OVERUSE
        const isOveruse = await this.checkCategoryOveruse(transaction, userId);
        if (isOveruse) {
            console.log('🚨 Category overuse detected:', isOveruse);
            anomalies.push({
                type: 'CATEGORY_OVERUSE',
                severity: 'MEDIUM',
                explanation: `Spending in '${transaction.category}' is ${Math.round(isOveruse.percentage)}% of your total monthly spend.`,
                evidence: {
                    categoryTotal: isOveruse.categoryTotal,
                    totalMonthly: isOveruse.totalMonthly,
                    percentage: isOveruse.percentage
                }
            });
        }

        // 5. Preventive Signal: SILENT LEAK
        const isSilentLeak = await this.checkSilentLeak(transaction, userId);
        if (isSilentLeak) {
            console.log('🚨 Silent leak detected');
            anomalies.push({
                type: 'SILENT_LEAK',
                severity: 'LOW',
                explanation: `Preventive Warning: ${isSilentLeak.count} small transactions to '${transaction.title}' detected in last 30 days.`,
                evidence: {
                    period: '30 Days',
                    count: isSilentLeak.count,
                    totalAmount: isSilentLeak.totalAmount
                }
            });
        }

        // 7. Rule: BUDGET EXCEEDED (High Severity)
        const isBudgetExceeded = await this.checkBudgetExceeded(transaction, userId);
        if (isBudgetExceeded) {
            console.log('🚨 Budget exceeded detected: ', isBudgetExceeded);
            anomalies.push({
                type: 'BUDGET_EXCEEDED',
                severity: 'HIGH',
                explanation: `Transaction exceeds your '${isBudgetExceeded.budgetName}' budget limit.`,
                evidence: {
                    budgetLimit: isBudgetExceeded.limit,
                    currentSpend: isBudgetExceeded.currentSpend,
                    exceededBy: isBudgetExceeded.exceededBy
                }
            });
        }

        // 8. AI Analysis (ON-DEMAND / HEURISTIC ONLY)
        // -------------------------------------------------------------
        // To save quota, we only ask AI if:
        // A) We already found a rule-based anomaly (to verify/explain it)
        // B) The context looks highly suspicious (High Value, "Other", etc.)
        // -------------------------------------------------------------

        const hasRuleBasedAnomaly = anomalies.length > 0;

        // Simple heuristics for "Suspicious Context" that rules might miss
        const isHighValue = transaction.amount > 5000;
        const isSuspiciousCategory = transaction.category === 'Other' || transaction.category === 'Miscellaneous';
        const isSuspiciousKeyword = /unknown|cash|transfer|mystery/i.test(transaction.description);

        const shouldTriggerAI = hasRuleBasedAnomaly || isHighValue || isSuspiciousCategory || isSuspiciousKeyword;

        if (geminiService.isAvailable() && shouldTriggerAI) {
            const triggerReason = hasRuleBasedAnomaly ? 'Rule Verification' : 'Heuristic Check';
            console.log(`🤖 Requesting AI analysis (${triggerReason})...`);

            try {
                const aiResult = await geminiService.detectAnomalies(transaction);
                console.log('🤖 AI Result:', aiResult);

                if (aiResult && aiResult.isAnomaly) {
                    // Avoid duplicating if AI just confirms what we know, 
                    // unless it provides a different explanation or higher severity
                    const isDuplicateType = anomalies.some(a => a.type === 'AI_DETECTED_IRREGULARITY');

                    if (!isDuplicateType) {
                        anomalies.push({
                            type: 'AI_DETECTED_IRREGULARITY',
                            severity: this.normalizeSeverity(aiResult.severity),
                            explanation: aiResult.explanation,
                            evidence: { aiConfidence: aiResult.confidence }
                        });
                    }
                }
            } catch (err) {
                console.error('AI Anomaly Detection Failed silently:', err.message);
            }
        } else {
            console.log('⏩ Skipping AI Analysis (Optimization Mode)');
        }

        // Save all detected anomalies
        if (anomalies.length > 0) {
            console.log(`💾 Saving ${anomalies.length} anomalies to database...`);
            await this.saveAnomalies(anomalies, transaction, userId);
        } else {
            console.log('✅ No anomalies found');
        }

        return anomalies;
    }

    // --- RULES ---

    /**
     * Check for identical transaction (Amount + Description + Category) 
     * within the last 10 minutes.
     * Uses Fuzzy Logic for Title/Description matching.
     */
    async checkDuplicate(transaction, userId) {
        const Expense = mongoose.model('Expense'); // Lazy load to avoid circular dependency
        const tenMinutesAgo = subMinutes(new Date(transaction.date), 10);

        // 1. First, find "Potential Candidates" via Database (Efficient Filter)
        const query = {
            user: userId,
            _id: { $ne: transaction._id }, // Exclude self
            amount: transaction.amount,
            date: { $gte: tenMinutesAgo } // REMOVED $lte to handle slight clock skew/latency
        };

        console.log('🔍 Checking for duplicate params:', JSON.stringify(query));

        const candidates = await Expense.find(query);
        console.log(`🔍 Found ${candidates.length} potential duplicate candidates.`);

        if (candidates.length === 0) return null;

        // 2. Fuzzy Match Logic (In-Memory)
        const normalize = (str) => (str || '').toLowerCase().trim();
        const targetTitle = normalize(transaction.title);

        for (const candidate of candidates) {
            const candidateTitle = normalize(candidate.title);

            // A. Exact Match
            if (candidateTitle === targetTitle) return candidate;

            // B. Fuzzy Match (Levenshtein Distance)
            // Allow 1 typo for short words (< 5 chars), 2 for longer
            const allowedErrors = targetTitle.length < 5 ? 1 : 2;
            const distance = this.levenshteinDistance(targetTitle, candidateTitle);

            if (distance <= allowedErrors) {
                console.log(`🔍 Fuzzy Duplicate Found: "${targetTitle}" ~= "${candidateTitle}" (Dist: ${distance})`);
                return candidate;
            }
        }

        return null;
    }

    /**
     * Calculate Levenshtein Distance between two strings
     * (Number of single-character edits required to change one word into the other)
     */
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // Increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Check if transaction is between 2 AM and 5 AM
     */
    checkOddTime(dateStr) {
        const hour = getHours(new Date(dateStr));
        return hour >= 2 && hour < 5;
    }

    /**
     * Check if amount > 200% of 30-day average for this user
     */
    async checkSpendingSpike(transaction, userId) {
        const Expense = mongoose.model('Expense'); // Lazy load
        const thirtyDaysAgo = subDays(new Date(), 30);

        const stats = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    date: { $gte: thirtyDaysAgo },
                    _id: { $ne: new mongoose.Types.ObjectId(transaction._id) } // Exclude current
                }
            },
            {
                $group: {
                    _id: null,
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        const average = stats.length > 0 ? stats[0].avgAmount : 0;

        // If no history, can't determine spike accurately, or set a safe default minimum (e.g. 500)
        if (average < 0) return null; // [TESTING] Lowered from 100 to 0 to allow easy testing

        const threshold = average * 3; // 200% increase = 3x total

        if (transaction.amount > threshold) {
            return {
                average,
                threshold,
                percentage: ((transaction.amount - average) / average) * 100
            };
        }
        return null;
    }

    /**
     * Check if category constitutes > 60% of total monthly spending
     */
    async checkCategoryOveruse(transaction, userId) {
        const Expense = mongoose.model('Expense'); // Lazy load
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const stats = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    categoryTotal: {
                        $sum: {
                            $cond: [{ $eq: ['$category', transaction.category] }, '$amount', 0]
                        }
                    }
                }
            }
        ]);

        if (stats.length === 0) return null;

        const { total, categoryTotal } = stats[0];
        const newTotal = total + transaction.amount;
        const newCategoryTotal = categoryTotal + transaction.amount;

        const percentage = (newCategoryTotal / newTotal) * 100;

        if (percentage > 60 && newTotal > 1000) { // Minimum spend check
            return {
                categoryTotal: newCategoryTotal,
                totalMonthly: newTotal,
                percentage
            };
        }
        return null;
    }

    /**
     * Check if budget limit is exceeded for the category
     */
    async checkBudgetExceeded(transaction, userId) {
        try {
            const Budget = mongoose.model('Budget'); // Lazy load
            const Expense = mongoose.model('Expense'); // Lazy load

            console.log('🔍 [BUDGET CHECK] Transaction category:', transaction.category);
            console.log('🔍 [BUDGET CHECK] User ID:', userId);

            // Find active budgets for this category (Case Insensitive)
            const budgetQuery = {
                user: userId,
                isActive: true,
                category: { $regex: new RegExp(`^${transaction.category}$`, 'i') },
                endDate: { $gte: new Date() }
            };

            console.log('🔍 [BUDGET CHECK] Query:', JSON.stringify(budgetQuery));

            const budgets = await Budget.find(budgetQuery);
            console.log('🔍 [BUDGET CHECK] Found budgets:', budgets.length);

            if (!budgets || budgets.length === 0) {
                console.log('ℹ️ No active budgets found for this category.');
                return null;
            }

            for (const budget of budgets) {
                console.log(`🔍 [BUDGET CHECK] Checking budget: ${budget.name} (Limit: ₹${budget.amount})`);
                console.log(`🔍 [BUDGET CHECK] Budget period: ${budget.startDate} to ${budget.endDate}`);

                // Calculate total spend for this budget period
                const stats = await Expense.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(userId),
                            category: { $regex: new RegExp(`^${transaction.category}$`, 'i') }, // Case-insensitive
                            date: {
                                $gte: budget.startDate,
                                $lte: budget.endDate
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                const currentSpend = stats.length > 0 ? stats[0].total : 0;
                console.log(`🔍 [BUDGET CHECK] Current spend: ₹${currentSpend}, Limit: ₹${budget.amount}`);
                console.log(`🔍 [BUDGET CHECK] Exceeds? ${currentSpend > budget.amount}`);

                // Note: 'currentSpend' includes the current transaction if it was already saved
                // Since this runs post-save, currentSpend likely includes it. 
                // However, let's just check raw totals.

                if (currentSpend > budget.amount) {
                    console.log('🚨 [BUDGET CHECK] EXCEEDED! Returning anomaly data.');
                    return {
                        budgetName: budget.name,
                        limit: budget.amount,
                        currentSpend: currentSpend,
                        exceededBy: currentSpend - budget.amount
                    };
                }
            }
            console.log('✅ [BUDGET CHECK] No budget exceeded.');
            return null;

        } catch (error) {
            console.error('❌ [BUDGET CHECK] Error:', error);
            return null;
        }
    }

    /**
     * Check for "Silent Leak" - Frequent small transactions with same title
     * E.g. Subscription creep or forgotten recurring charges
     */
    async checkSilentLeak(transaction, userId) {
        const Expense = mongoose.model('Expense'); // Lazy load
        // Only check for small amounts
        if (transaction.amount > 50) return null;

        const thirtyDaysAgo = subDays(new Date(), 30);
        const titleRegex = new RegExp(`^${transaction.title}$`, 'i'); // Exact match case-insensitive

        const stats = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    date: { $gte: thirtyDaysAgo },
                    title: { $regex: titleRegex },
                    amount: { $lte: 50 },
                    _id: { $ne: new mongoose.Types.ObjectId(transaction._id) }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        if (stats.length > 0) {
            const { count, totalAmount } = stats[0];
            // If we found 2 or more previous occurrences (total 3 including current), flag it
            if (count >= 2) {
                return {
                    count: count + 1, // Include current
                    totalAmount: totalAmount + transaction.amount
                };
            }
        }
        return null;
    }

    /**
     * Helper to batch save anomalies
     */
    async saveAnomalies(anomalies, transaction, userId) {
        const anomalyDocs = anomalies.map(a => ({
            user: userId,
            transactionId: transaction._id,
            ...a,
            status: 'PENDING',
            detectedAt: new Date()
        }));

        await Anomaly.insertMany(anomalyDocs);
    }
    /**
     * Helper to normalize AI severity to allowed Enums
     * Failure to do this causes Mongoose Validation Errors -> No Anomaly Saved
     */
    normalizeSeverity(rawSeverity) {
        if (!rawSeverity) return 'MEDIUM';

        const upper = rawSeverity.toUpperCase();
        const valid = ['LOW', 'MEDIUM', 'HIGH'];

        if (valid.includes(upper)) return upper;

        // Mappings for common AI hallucinations
        if (['CRITICAL', 'SEVERE', 'URGENT', 'EXTREME'].includes(upper)) return 'HIGH';
        if (['INFO', 'NOTE', 'WARNING', 'MINOR'].includes(upper)) return 'LOW';

        return 'MEDIUM'; // Default fallback
    }
}

module.exports = new DetectionService();
