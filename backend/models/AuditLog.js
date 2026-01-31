const mongoose = require('mongoose');

/**
 * 🔒 AUDIT LOG MODEL
 * Note: This model is APPEND-ONLY by design.
 * It serves as the immutable "Trust Layer" for the application.
 */
const AuditLogSchema = new mongoose.Schema({
    // Who performed the action?
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // What happened?
    action: {
        type: String,
        enum: [
            'EXPENSE_CREATE',
            'EXPENSE_UPDATE',
            'EXPENSE_DELETE',
            'INCOME_CREATE',
            'INCOME_UPDATE',
            'INCOME_DELETE',
            'ANOMALY_DETECTED',
            'ANOMALY_RESOLVED',
            'ANOMALY_DISMISSED',
            'SYSTEM_EVENT'
        ],
        required: true
    },

    // What was affected?
    resource: {
        type: String,
        enum: ['Expense', 'Income', 'Budget', 'Anomaly', 'User', 'System'],
        required: true
    },

    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false // May not exist for global system events
    },

    // Immutable timestamp
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true
    },

    // What changed? (JSON snapshot)
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Security Context
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: String
    }
});

// Prevent updates to audit logs
AuditLogSchema.pre('updateOne', function (next) {
    next(new Error('Audit logs are immutable and cannot be updated.'));
});

AuditLogSchema.pre('findOneAndUpdate', function (next) {
    next(new Error('Audit logs are immutable and cannot be updated.'));
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
