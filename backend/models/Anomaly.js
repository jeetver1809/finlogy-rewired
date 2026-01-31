const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The transaction that triggered this
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense', // primarily expenses, but could be income
        required: false
    },

    type: {
        type: String,
        enum: [
            'DUPLICATE_TRANSACTION',
            'SPENDING_SPIKE',
            'CATEGORY_OVERUSE',
            'ODD_TIME_PATTERN',
            'PREVENTIVE_WARNING', // "Soft" anomaly
            'AI_DETECTED_IRREGULARITY',
            'BUDGET_EXCEEDED', // When spending exceeds budget limit
            'SILENT_LEAK' // Frequent small transactions (subscription creep)
        ],
        required: true
    },

    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        required: true
    },

    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'CONFIRMED'],
        default: 'PENDING'
    },

    // "Why was this flagged?" - Human readable
    explanation: {
        type: String,
        required: true
    },

    // Data backing the claim (e.g., { "duplicateOf": "ID..." } or { "baseline": 500, "current": 5000 })
    evidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // If resolved/dismissed, valid reason required
    resolutionNote: {
        type: String,
        default: ''
    },

    detectedAt: {
        type: Date,
        default: Date.now
    },

    resolvedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Anomaly', AnomalySchema);
